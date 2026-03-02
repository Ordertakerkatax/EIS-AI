'use server';

import { revalidatePath } from 'next/cache';
import { BirCanonicalPayloadSchema } from '@/lib/bir-schema/validation';
import { submitToBirApi } from '@/lib/gateway/client';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function createInvoiceAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Unauthorized');
        }

        // 1. Extract Form Data
        const rawCustomerName = formData.get('customerName') as string;
        const rawCustomerTin = formData.get('customerTin') as string;
        const rawBranchCode = formData.get('branchCode') as string || '000';
        const rawCity = formData.get('city') as string;
        const rawAddress = formData.get('address') as string;
        const rawLineItemsStr = formData.get('lineItems') as string;

        let rawLineItems: any[] = [];
        try {
            rawLineItems = JSON.parse(rawLineItemsStr);
        } catch {
            throw new Error('Invalid line items array');
        }

        if (!rawLineItems || rawLineItems.length === 0) {
            throw new Error('At least one line item is required.');
        }

        // 2. Fetch User Organization Information (Seller)
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { organization: true }
        });

        if (!dbUser || !dbUser.organization) {
            throw new Error('User Organization not found.');
        }

        const org = dbUser.organization;

        // 3. Mathematical Calculations
        let totalNetAmount = 0;
        let totalTaxAmount = 0;

        const processedItems = rawLineItems.map(item => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unitPrice) || 0;

            const itemNet = qty * price;
            const itemTax = itemNet * 0.12; // 12% VAT Constant for mvp

            totalNetAmount += itemNet;
            totalTaxAmount += itemTax;

            return {
                description: item.description,
                quantity: qty,
                unitPrice: price,
                taxRate: 0.12,
                taxAmount: itemTax,
                totalAmount: itemNet + itemTax
            };
        });

        const totalGrossAmount = totalNetAmount + totalTaxAmount;
        const invoiceNumber = `INV-${Date.now()}`;
        const issueDate = new Date();

        // 4. Save to PostgreSQL Database
        const dbResult = await prisma.$transaction(async (tx) => {

            // Upsert Customer
            // Wait, we need organizationId and tin to uniquely identify? In our schema, we'll just create or find first.
            let customer = await tx.customer.findFirst({
                where: { tin: rawCustomerTin, organizationId: org.id }
            });

            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        organizationId: org.id,
                        registeredName: rawCustomerName,
                        tin: rawCustomerTin,
                        branchCode: rawBranchCode,
                        city: rawCity,
                        address: rawAddress
                    }
                });
            }

            // Create Invoice
            const invoice = await tx.invoice.create({
                data: {
                    organizationId: org.id,
                    customerId: customer.id,
                    invoiceNumber,
                    issueDate,
                    currency: "PHP",
                    totalGrossAmount,
                    totalTaxAmount,
                    totalNetAmount,
                    status: "ISSUED"
                }
            });

            // Add Line Items
            await tx.lineItem.createMany({
                data: processedItems.map(pi => ({
                    invoiceId: invoice.id,
                    ...pi
                }))
            });

            return { invoice, customer };
        });

        // 5. Map accurately to Canonical BIR JSON Payload
        const birPayload = {
            document: {
                id: dbResult.invoice.invoiceNumber,
                issueDate: dbResult.invoice.issueDate.toISOString(),
                documentType: "01"
            },
            seller: {
                tin: "000123456789", // Mock Seller TIN
                branchCode: "000",
                registeredName: org.name // Use real org name
            },
            buyer: {
                tin: dbResult.customer.tin,
                branchCode: dbResult.customer.branchCode,
                registeredName: dbResult.customer.registeredName
            },
            items: processedItems,
            summary: {
                totalGrossAmount,
                totalTaxAmount,
                totalNetAmount,
                currencyCode: "PHP"
            }
        };

        // 6. Strict Validation using Zod
        const validatedPayload = BirCanonicalPayloadSchema.parse(birPayload);

        // 7. Dummy JWS Signature Generation (Placeholder for real RS256 signing)
        const jwsSignature = `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify(validatedPayload)).toString('base64')}.SIGNATURE_BYTES`;

        // 8. API Submission (mocked)
        const apiResponse = await submitToBirApi(validatedPayload);

        // 9. Store Compliance Archive (Immutable 10-year lock)
        await prisma.complianceArchive.create({
            data: {
                invoiceId: dbResult.invoice.id,
                canonicalJsonPayload: JSON.parse(JSON.stringify(validatedPayload)),
                jwsSignature: jwsSignature,
                birTrackingId: apiResponse.success ? `BIR-${Date.now()}` : null,
                birResponsePayload: apiResponse.success ? { msg: 'success' } : { msg: 'error' }
            }
        });

        // Update Invoice status
        await prisma.invoice.update({
            where: { id: dbResult.invoice.id },
            data: { status: apiResponse.success ? "SUBMITTED" : "REJECTED" }
        });

        revalidatePath('/');

        return { success: apiResponse.success, message: apiResponse.success ? 'Invoice Submitted to BIR' : apiResponse.error };

    } catch (error: any) {
        console.error("Invoice Error:", error);
        return { success: false, message: error.message };
    }
}

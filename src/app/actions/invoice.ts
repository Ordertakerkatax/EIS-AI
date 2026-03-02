'use server';

import { revalidatePath } from 'next/cache';
import { BirCanonicalPayloadSchema } from '@/lib/bir-schema/validation';
import { submitToBirApi } from '@/lib/gateway/client';
import { createClient } from '@/lib/supabase/server';
import PrismaClient from '@prisma/client';

export async function createInvoiceAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Unauthorized');
        }

        const rawData = {
            customerTin: formData.get('customerTin'),
            description: formData.get('description'),
            amount: formData.get('amount'),
        };

        // In a real app we'd first save to the Database via Prisma 
        // and map using our mapInvoiceToBirPayload function.
        // For MVP testing the API flow, we'll build a dummy payload mimicking the requirement.

        const amountVal = parseFloat(rawData.amount as string);
        const taxVal = amountVal * 0.12; // Simple 12% calculation

        const mockPayload = {
            document: {
                id: `INV-${Date.now()}`,
                issueDate: new Date().toISOString(),
                documentType: "01"
            },
            seller: {
                tin: "000123456789",
                branchCode: "000",
                registeredName: "Demo Tech Inc"
            },
            buyer: {
                tin: rawData.customerTin as string || "987654321000",
                branchCode: "000",
                registeredName: "Acme Corp"
            },
            items: [{
                description: rawData.description as string,
                quantity: 1.0000,
                unitPrice: amountVal,
                taxRate: 0.1200,
                taxAmount: taxVal,
                totalAmount: amountVal + taxVal
            }],
            summary: {
                totalGrossAmount: amountVal + taxVal,
                totalTaxAmount: taxVal,
                totalNetAmount: amountVal,
                currencyCode: "PHP"
            }
        };

        // Strict Validate
        const validatedPayload = BirCanonicalPayloadSchema.parse(mockPayload);

        // Normally this is asynchronous/background queued
        const result = await submitToBirApi(validatedPayload);

        revalidatePath('/');

        return { success: result.success, message: result.success ? 'Invoice Sent' : result.error };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

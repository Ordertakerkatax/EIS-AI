// Import standard Prisma Types after they've been generated properly for V7
import { Invoice, Customer, LineItem } from '@prisma/client';
import { BirCanonicalPayload, BirCanonicalPayloadSchema } from './validation';
import Decimal from 'decimal.js';

// Helper to convert Prisma Decimal to JS Number format required by BIR (or string based exactly on their spec)
// Often BIR expects either a string encoded decimal or a float constraint. 
// For our Zod schema, we mapped it to number() but ensured 4 decimals max.
const formatDecimal = (val: any): number => {
    return Number(new Decimal(val).toFixed(4));
};

export const mapInvoiceToBirPayload = (
    invoice: Invoice & { lineItems: LineItem[]; customer: Customer }
): BirCanonicalPayload => {

    // Here we hardcode the seller details. In a real multi-tenant SaaS, this 
    // would be derived from the current Tenant/Organization settings.
    const sellerDetails = {
        tin: process.env.SELLER_TIN || '000123456789',
        branchCode: process.env.SELLER_BRANCH_CODE || '000',
        registeredName: process.env.SELLER_NAME || 'Demo SaaS Company Inc.',
        address: '123 Demo St. Manila City',
    };

    const payload = {
        document: {
            id: invoice.invoiceNumber,
            // Date to ISO string, ensuring timing compliance
            issueDate: invoice.issueDate.toISOString(),
            documentType: "01", // Sales Invoice
        },
        seller: sellerDetails,
        buyer: {
            tin: invoice.customer.tin,
            branchCode: invoice.customer.branchCode,
            registeredName: invoice.customer.registeredName,
            address: invoice.customer.address || undefined,
        },
        items: invoice.lineItems.map((item: LineItem) => ({
            description: item.description,
            quantity: formatDecimal(item.quantity),
            unitPrice: formatDecimal(item.unitPrice),
            taxRate: formatDecimal(item.taxRate),
            taxAmount: formatDecimal(item.taxAmount),
            totalAmount: formatDecimal(item.totalAmount),
        })),
        summary: {
            totalGrossAmount: formatDecimal(invoice.totalGrossAmount),
            totalTaxAmount: formatDecimal(invoice.totalTaxAmount),
            totalNetAmount: formatDecimal(invoice.totalNetAmount),
            currencyCode: invoice.currency,
        }
    };

    // Validate mapping output against the strict BIR specification schema
    return BirCanonicalPayloadSchema.parse(payload);
};

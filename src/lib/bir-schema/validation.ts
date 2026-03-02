import { z } from 'zod';

// BIR requires strict formatting for amounts (usually 4 decimal places)
export const StrictDecimalSchema = z.number().refine(
  (n) => {
    // Regex ensuring max 4 decimal places
    return /^-?\d+(\.\d{1,4})?$/.test(n.toString());
  },
  { message: "Must be a decimal with a maximum of 4 decimal places" }
);

// ---------------------------------------------------------------------------
// 1. Document ID & Timing
// ---------------------------------------------------------------------------
export const BirDocumentSchema = z.object({
  id: z.string().min(1, "Document ID is required"), // e.g., Invoice Number
  issueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format. Expected valid ISO-8601 string.",
  }),
  documentType: z.string().default("01"), // Example: '01' for Sales Invoice
});

// ---------------------------------------------------------------------------
// 2. Party Details (Seller & Buyer)
// ---------------------------------------------------------------------------
export const BirPartySchema = z.object({
  tin: z.string().regex(/^\d{9,12}$/, "TIN must be 9 to 12 digits"),
  branchCode: z.string().length(3, "Branch Code must be exactly 3 digits"),
  registeredName: z.string().min(2, "Registered name must be provided"),
  address: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 3. Line Items
// ---------------------------------------------------------------------------
export const BirLineItemSchema = z.object({
  description: z.string().min(1, "Item description required"),
  quantity: StrictDecimalSchema,
  unitPrice: StrictDecimalSchema,
  taxRate: StrictDecimalSchema,
  taxAmount: StrictDecimalSchema,
  totalAmount: StrictDecimalSchema,
});

// ---------------------------------------------------------------------------
// 4. Monetary Summary
// ---------------------------------------------------------------------------
export const BirMonetarySummarySchema = z.object({
  totalGrossAmount: StrictDecimalSchema,
  totalTaxAmount: StrictDecimalSchema,
  totalNetAmount: StrictDecimalSchema,
  currencyCode: z.string().length(3).default("PHP"),
});

// ---------------------------------------------------------------------------
// 5. Root Canonical JSON Payload
// ---------------------------------------------------------------------------
export const BirCanonicalPayloadSchema = z.object({
  document: BirDocumentSchema,
  seller: BirPartySchema,
  buyer: BirPartySchema.optional(), // Buyer might be optional for some types of receipts
  items: z.array(BirLineItemSchema).min(1, "At least one item required"),
  summary: BirMonetarySummarySchema,
});

// Type inferences
export type BirCanonicalPayload = z.infer<typeof BirCanonicalPayloadSchema>;

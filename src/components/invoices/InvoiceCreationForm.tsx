'use client';

import { useTransition, useState, useMemo } from 'react';
import { createInvoiceAction } from '@/app/actions/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

export function InvoiceCreationForm() {
    const [isPending, startTransition] = useTransition();
    const [resultMessage, setResultMessage] = useState<{ success: boolean; message: string } | null>(null);

    const [lineItems, setLineItems] = useState([
        { description: 'Software Subscription', quantity: 1, unitPrice: 1000.00 }
    ]);

    const handleAddLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: string, value: string | number) => {
        const newItems = [...lineItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setLineItems(newItems);
    };

    const summary = useMemo(() => {
        let netAmount = 0;
        let taxAmount = 0;

        lineItems.forEach(item => {
            const itemNet = item.quantity * item.unitPrice;
            const itemTax = itemNet * 0.12; // 12% VAT
            netAmount += itemNet;
            taxAmount += itemTax;
        });

        return {
            netAmount,
            taxAmount,
            grossAmount: netAmount + taxAmount
        };
    }, [lineItems]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        // Append dynamic line items as a JSON string to the FormData
        formData.append('lineItems', JSON.stringify(lineItems));

        startTransition(async () => {
            setResultMessage(null);
            const result = await createInvoiceAction(formData);
            setResultMessage({ success: result.success, message: result.message || 'Unknown response' });
        });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto mt-10">
            <CardHeader>
                <CardTitle>Create BIR EIS Invoice</CardTitle>
                <CardDescription>Issue a complete BIR-compliant sales invoice directly to the EIS gateway.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">

                    {/* Buyer Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Buyer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Registered Name</Label>
                                <Input id="customerName" name="customerName" placeholder="Acme Corporation" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerTin">Customer TIN</Label>
                                <Input id="customerTin" name="customerTin" placeholder="123456789" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branchCode">Branch Code</Label>
                                <Input id="branchCode" name="branchCode" placeholder="000" defaultValue="000" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" placeholder="Makati City" required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Input id="address" name="address" placeholder="123 Business Blvd, Tech Park" required />
                            </div>
                        </div>
                    </div>

                    {/* Line Items Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="text-lg font-semibold">Line Items</h3>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                                <Plus className="h-4 w-4 mr-1" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {lineItems.map((item, index) => (
                                <div key={index} className="flex gap-3 items-end p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
                                    <div className="flex-1 space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                            placeholder="Item name..."
                                            required
                                        />
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <Label>Qty</Label>
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label>Unit Price (Net)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveLineItem(index)} disabled={lineItems.length === 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Total Net Amount:</span>
                            <span className="font-medium">₱{summary.netAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">12% VAT:</span>
                            <span className="font-medium">₱{summary.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-bold text-base">
                            <span>Total Gross Amount:</span>
                            <span>₱{summary.grossAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {resultMessage && (
                        <div className={`text-sm p-3 rounded-md ${resultMessage.success ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                            {resultMessage.message}
                        </div>
                    )}

                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? 'Processing complex payload...' : 'Issue & Sign Invoice'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

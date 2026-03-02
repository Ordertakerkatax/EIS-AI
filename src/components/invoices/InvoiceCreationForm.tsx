'use client';

import { useTransition, useState } from 'react';
import { createInvoiceAction } from '@/app/actions/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function InvoiceCreationForm() {
    const [isPending, startTransition] = useTransition();
    const [resultMessage, setResultMessage] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const result = await createInvoiceAction(formData);
            setResultMessage(result.message || 'Error occurred');
        });
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-10">
            <CardHeader>
                <CardTitle>Create BIR Invoice</CardTitle>
                <CardDescription>Issue a new sales invoice directly to the EIS gateway.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customerTin">Customer TIN</Label>
                        <Input id="customerTin" name="customerTin" placeholder="123456789000" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Item Description</Label>
                        <Input id="description" name="description" placeholder="Software Subscription" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Net Amount (PHP)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" placeholder="1000.00" required />
                    </div>

                    {resultMessage && (
                        <div className={`text-sm p-3 rounded-md ${resultMessage === 'Invoice Sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {resultMessage}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? 'Submitting to BIR...' : 'Issue & Sign Invoice'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

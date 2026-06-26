import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { dashboard } from '@/routes';

interface Payment {
    id: number;
    customer: string;
    email: string;
    amount: number;
    status: string;
    reference: string;
    applicationId: number | null;
    createdAt: string;
}

export default function AdminPayments() {
    const { payments } = usePage().props as unknown as {
        payments: Payment[];
    };

    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filtered = payments.filter(
        (p) => filterStatus === 'all' || p.status === filterStatus,
    );

    function handleStatusChange(paymentId: number, status: string) {
        router.put(
            `/dashboard/payments/${paymentId}`,
            { status },
            {
                onSuccess: () => toast.success('Payment status updated.'),
                onError: () => toast.error('Failed to update payment.'),
            },
        );
    }

    function handleDelete(paymentId: number) {
        if (!confirm('Delete this payment record?')) {
            return;
        }

        router.delete(`/dashboard/payments/${paymentId}`, {
            onSuccess: () => toast.success('Payment deleted.'),
            onError: () => toast.error('Failed to delete payment.'),
        });
    }

    return (
        <>
            <Head title="Payments" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Payments</h1>
                    <p className="text-muted-foreground">
                        View and manage all payments
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10 text-center">#</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((payment, idx) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {payment.customer}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {payment.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            ₦
                                            {(
                                                payment.amount / 100
                                            ).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {payment.reference}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={payment.status}
                                                onValueChange={(val) =>
                                                    handleStatusChange(
                                                        payment.id,
                                                        val,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">
                                                        Pending
                                                    </SelectItem>
                                                    <SelectItem value="success">
                                                        Success
                                                    </SelectItem>
                                                    <SelectItem value="failed">
                                                        Failed
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {payment.createdAt}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(payment.id)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-muted-foreground"
                                        >
                                            No payments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminPayments.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Payments', href: '#' },
    ],
};

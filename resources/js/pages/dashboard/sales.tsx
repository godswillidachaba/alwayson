import { Head, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    plan: string;
    submittedAt: string;
}

interface Pipeline {
    submitted: number;
    kycPending: number;
    approved: number;
    installed: number;
    active: number;
}

const statusColors: Record<string, string> = {
    submitted: 'bg-blue-500',
    kyc_pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    installed: 'bg-purple-500',
    active: 'bg-emerald-500',
    declined: 'bg-red-500',
};

export default function SalesDashboard() {
    const { customers, pipeline } = usePage().props as unknown as {
        customers: Customer[];
        pipeline: Pipeline;
    };

    return (
        <>
            <Head title="Sales Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Sales Dashboard</h1>
                    <p className="text-muted-foreground">
                        Your customer pipeline
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    {[
                        {
                            label: 'Submitted',
                            value: pipeline.submitted,
                            color: 'bg-blue-500',
                        },
                        {
                            label: 'KYC Pending',
                            value: pipeline.kycPending,
                            color: 'bg-yellow-500',
                        },
                        {
                            label: 'Approved',
                            value: pipeline.approved,
                            color: 'bg-green-500',
                        },
                        {
                            label: 'Installed',
                            value: pipeline.installed,
                            color: 'bg-purple-500',
                        },
                        {
                            label: 'Active',
                            value: pipeline.active,
                            color: 'bg-emerald-500',
                        },
                    ].map((item) => (
                        <Card key={item.label}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {item.label}
                                </CardTitle>
                                <div
                                    className={`size-2 rounded-full ${item.color}`}
                                />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {item.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">My Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {customer.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {customer.email} &middot;{' '}
                                            {customer.phone}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {customer.plan}
                                        </span>
                                        <Badge
                                            className={`${statusColors[customer.status] ?? 'bg-gray-500'} text-white`}
                                        >
                                            {customer.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {customers.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No customers assigned yet.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SalesDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

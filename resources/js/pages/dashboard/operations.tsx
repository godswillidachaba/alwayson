import { Head, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface PendingKyc {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    plan: string;
    buildingType: string | null;
    submittedAt: string;
}

const statusColors: Record<string, string> = {
    address_verification: 'bg-yellow-500',
    identity_verification: 'bg-orange-500',
    under_review: 'bg-blue-500',
    submitted: 'bg-gray-500',
};

export default function OperationsDashboard() {
    const { pendingKyc } = usePage().props as unknown as {
        pendingKyc: PendingKyc[];
    };

    return (
        <>
            <Head title="Operations Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        Operations Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Review and manage pending KYC applications
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Pending KYC Reviews
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingKyc.map((app) => (
                                <div
                                    key={app.id}
                                    className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {app.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {app.email} &middot; {app.phone}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {app.buildingType ?? '—'} &middot;{' '}
                                            {app.plan ?? '—'} &middot;{' '}
                                            {app.submittedAt}
                                        </div>
                                    </div>
                                    <Badge
                                        className={`${statusColors[app.status] ?? 'bg-gray-500'} text-white`}
                                    >
                                        {app.status.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                            ))}
                            {pendingKyc.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No pending KYC reviews.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OperationsDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

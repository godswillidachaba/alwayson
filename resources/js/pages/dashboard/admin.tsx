import { Head, usePage } from '@inertiajs/react';
import { Activity, DollarSign, FileText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface Stat {
    totalApplications: number;
    pendingKyc: number;
    approved: number;
    installed: number;
    active: number;
    declined: number;
    totalCustomers: number;
    totalRevenue: number;
}

interface RecentApplication {
    id: number;
    name: string;
    email: string;
    status: string;
    plan: string;
    submittedAt: string;
}

const statusColors: Record<string, string> = {
    submitted: 'bg-blue-500',
    kyc_pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    installed: 'bg-purple-500',
    active: 'bg-emerald-500',
    declined: 'bg-red-500',
};

export default function AdminDashboard() {
    const { stats, recentApplications } = usePage().props as unknown as {
        stats: Stat;
        recentApplications: RecentApplication[];
    };

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of all applications and customers
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Applications
                            </CardTitle>
                            <FileText className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalApplications}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Customers
                            </CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalCustomers}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active
                            </CardTitle>
                            <Activity className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {stats.active}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Revenue
                            </CardTitle>
                            <DollarSign className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ₦{(stats.totalRevenue / 100).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Application Pipeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {[
                                    {
                                        label: 'KYC Pending',
                                        value: stats.pendingKyc,
                                        color: 'bg-yellow-500',
                                    },
                                    {
                                        label: 'Approved',
                                        value: stats.approved,
                                        color: 'bg-green-500',
                                    },
                                    {
                                        label: 'Installed',
                                        value: stats.installed,
                                        color: 'bg-purple-500',
                                    },
                                    {
                                        label: 'Active',
                                        value: stats.active,
                                        color: 'bg-emerald-500',
                                    },
                                    {
                                        label: 'Declined',
                                        value: stats.declined,
                                        color: 'bg-red-500',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`size-2 rounded-full ${item.color}`}
                                            />
                                            <span>{item.label}</span>
                                        </div>
                                        <span className="font-medium">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Recent Applications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentApplications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                                    >
                                        <div>
                                            <div className="text-sm font-medium">
                                                {app.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {app.email}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {app.plan}
                                            </span>
                                            <Badge
                                                className={`${statusColors[app.status] ?? 'bg-gray-500'} text-white`}
                                            >
                                                {app.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {recentApplications.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No applications yet.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';

interface Application {
    id: number;
    name: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    assignedSales: string | null;
    submittedAt: string;
}

interface SalesRep {
    id: number;
    name: string;
    email: string;
    submitted: number;
    addressVerification: number;
    identityVerification: number;
    underReview: number;
    esignPending: number;
    approved: number;
    installed: number;
    active: number;
    declined: number;
}

interface KycReviewItem {
    id: number;
    name: string;
    email: string;
    addressVerified: boolean;
    billingAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
    } | null;
    identityVerified: boolean;
    bvnMatch: boolean | null;
    addressDocument: string | null;
    identityDocument: string | null;
    submittedAt: string;
}

export default function AdminApplications() {
    const { applications, salesReps, installers, salesPipeline, kycReview } =
        usePage().props as unknown as {
            applications: Application[];
            salesReps: { id: number; name: string; email: string }[];
            installers: { id: number; name: string; email: string }[];
            salesPipeline: SalesRep[];
            kycReview: KycReviewItem[];
        };

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch] = useState('');

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedAppName, setSelectedAppName] = useState('');

    async function handleShowHistory(appId: number, appName: string) {
        setSelectedAppName(appName);
        setIsHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryData([]);

        try {
            const res = await fetch(`/dashboard/applications/${appId}/history`);
            const data = await res.json();

            if (res.ok) {
                setHistoryData(data.history || []);
            } else {
                toast.error('Failed to load status history.');
            }
        } catch {
            toast.error('Failed to load status history.');
        } finally {
            setHistoryLoading(false);
        }
    }

    const filtered = applications.filter((app) => {
        const matchesStatus =
            filterStatus === 'all' || app.status === filterStatus;
        const matchesSearch =
            !search ||
            app.name.toLowerCase().includes(search.toLowerCase()) ||
            app.email.toLowerCase().includes(search.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    function handleAssignSales(appId: number, salesId: string) {
        router.put(
            `/dashboard/applications/${appId}`,
            { assigned_sales_id: salesId || null },
            {
                onSuccess: () => toast.success('Sales rep assigned.'),
                onError: () => toast.error('Failed to assign.'),
            },
        );
    }

    function handleStatusChange(appId: number, status: string) {
        router.put(
            `/dashboard/applications/${appId}`,
            { status },
            {
                onSuccess: () => toast.success('Status updated.'),
                onError: () => toast.error('Failed to update.'),
            },
        );
    }

    function handleDelete(appId: number) {
        if (!confirm('Delete this application?')) {
            return;
        }

        router.delete(`/dashboard/applications/${appId}`, {
            onSuccess: () => toast.success('Application deleted.'),
            onError: () => toast.error('Failed to delete.'),
        });
    }

    function handleApproveKyc(appId: number) {
        router.post(
            `/dashboard/applications/${appId}/review-kyc`,
            {},
            {
                onSuccess: () => {
                    toast.success('KYC approved.');
                    router.reload();
                },
                onError: () => toast.error('Failed to approve KYC.'),
            },
        );
    }

    function handleDeclineKyc(appId: number) {
        const reason = prompt(
            'Decline reason: income_threshold, kyc_bvn_failure, or address_not_serviceable',
        );

        if (!reason) {
            return;
        }

        router.post(
            `/dashboard/applications/${appId}/decline-kyc`,
            { decline_reason: reason },
            {
                onSuccess: () => {
                    toast.success('Application declined.');
                    router.reload();
                },
                onError: () => toast.error('Failed to decline.'),
            },
        );
    }

    function handleAssignInstaller(appId: number, installerId: string) {
        if (!installerId) {
            return;
        }

        router.post(
            `/dashboard/applications/${appId}/assign-installer`,
            { installer_id: installerId },
            {
                onSuccess: () => {
                    toast.success('Installer assigned.');
                    router.reload();
                },
                onError: () => toast.error('Failed to assign installer.'),
            },
        );
    }

    const statusOptions = [
        { value: 'all', label: 'All statuses' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'address_verification', label: 'Address Verification' },
        { value: 'identity_verification', label: 'Identity Verification' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'esign_pending', label: 'E-sign Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'installed', label: 'Installed' },
        { value: 'active', label: 'Active' },
        { value: 'declined', label: 'Declined' },
    ];

    return (
        <>
            <Head title="Applications" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Applications</h1>
                    <p className="text-muted-foreground">
                        Manage all applications, KYC reviews, and pipeline
                    </p>
                </div>

                <Tabs defaultValue="applications">
                    <TabsList>
                        <TabsTrigger value="applications">
                            All Applications
                        </TabsTrigger>
                        <TabsTrigger value="kyc-review">
                            KYC Review{' '}
                            {kycReview.length > 0 && `(${kycReview.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="pipeline">
                            Sales Pipeline
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="applications" className="space-y-4">
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                            <Select
                                value={filterStatus}
                                onValueChange={setFilterStatus}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
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
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Sales Rep</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map((app, idx) => (
                                            <TableRow key={app.id}>
                                                <TableCell className="text-center text-sm text-muted-foreground">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {app.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {app.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {app.plan}
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={app.status}
                                                        onValueChange={(val) =>
                                                            handleStatusChange(
                                                                app.id,
                                                                val,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-44">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statusOptions
                                                                .filter(
                                                                    (o) =>
                                                                        o.value !==
                                                                        'all',
                                                                )
                                                                .map((opt) => (
                                                                    <SelectItem
                                                                        key={
                                                                            opt.value
                                                                        }
                                                                        value={
                                                                            opt.value
                                                                        }
                                                                    >
                                                                        {
                                                                            opt.label
                                                                        }
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={
                                                            app.assignedSales ??
                                                            ''
                                                        }
                                                        onValueChange={(val) =>
                                                            handleAssignSales(
                                                                app.id,
                                                                val,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-40">
                                                            <SelectValue placeholder="Unassigned" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">
                                                                Unassigned
                                                            </SelectItem>
                                                            {salesReps.map(
                                                                (rep) => (
                                                                    <SelectItem
                                                                        key={
                                                                            rep.id
                                                                        }
                                                                        value={String(
                                                                            rep.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            rep.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {app.submittedAt}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleShowHistory(
                                                                    app.id,
                                                                    app.name,
                                                                )
                                                            }
                                                        >
                                                            History
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    app.id,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filtered.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    className="text-center text-muted-foreground"
                                                >
                                                    No applications found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="kyc-review" className="space-y-4">
                        {kycReview.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No applications pending KYC review.
                                </CardContent>
                            </Card>
                        ) : (
                            kycReview.map((item) => (
                                <Card key={item.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base">
                                                    {item.name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {item.email}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="secondary">
                                                Under Review
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2 rounded-lg border p-3">
                                                <h4 className="flex items-center gap-2 text-sm font-medium">
                                                    Address Verification
                                                    {item.addressVerified ? (
                                                        <Badge
                                                            variant="default"
                                                            className="bg-green-500"
                                                        >
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </h4>
                                                {item.billingAddress && (
                                                    <p className="text-xs text-muted-foreground">
                                                        <span className="font-medium">
                                                            Billing address:
                                                        </span>{' '}
                                                        {
                                                            item.billingAddress
                                                                .street
                                                        }
                                                        ,{' '}
                                                        {
                                                            item.billingAddress
                                                                .city
                                                        }
                                                        ,{' '}
                                                        {
                                                            item.billingAddress
                                                                .state
                                                        }
                                                    </p>
                                                )}
                                                {item.addressDocument && (
                                                    <a
                                                        href={
                                                            item.addressDocument
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 underline"
                                                    >
                                                        View Document
                                                    </a>
                                                )}
                                            </div>
                                            <div className="space-y-2 rounded-lg border p-3">
                                                <h4 className="flex items-center gap-2 text-sm font-medium">
                                                    Identity Verification
                                                    {item.identityVerified ? (
                                                        <Badge
                                                            variant="default"
                                                            className="bg-green-500"
                                                        >
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </h4>
                                                {item.bvnMatch !== null && (
                                                    <p className="text-sm">
                                                        BVN match:{' '}
                                                        {item.bvnMatch
                                                            ? '✅'
                                                            : '❌'}
                                                    </p>
                                                )}
                                                {item.identityDocument && (
                                                    <a
                                                        href={
                                                            item.identityDocument
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 underline"
                                                    >
                                                        View Document
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleApproveKyc(item.id)
                                                }
                                            >
                                                Approve → E-Signing
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDeclineKyc(item.id)
                                                }
                                            >
                                                Decline
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleShowHistory(
                                                        item.id,
                                                        item.name,
                                                    )
                                                }
                                            >
                                                History
                                            </Button>
                                            <div className="ml-auto flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    Assign installer:
                                                </span>
                                                <Select
                                                    onValueChange={(val) =>
                                                        handleAssignInstaller(
                                                            item.id,
                                                            val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-40">
                                                        <SelectValue placeholder="Select installer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {installers.map(
                                                            (inst) => (
                                                                <SelectItem
                                                                    key={
                                                                        inst.id
                                                                    }
                                                                    value={String(
                                                                        inst.id,
                                                                    )}
                                                                >
                                                                    {inst.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="pipeline" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {salesPipeline.map((rep) => {
                                const total =
                                    rep.submitted +
                                    rep.addressVerification +
                                    rep.identityVerification +
                                    rep.underReview +
                                    rep.esignPending +
                                    rep.approved +
                                    rep.installed +
                                    rep.active +
                                    rep.declined;

                                return (
                                    <Card key={rep.id}>
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                {rep.name}
                                            </CardTitle>
                                            <CardDescription>
                                                {rep.email}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span>Submitted</span>
                                                    <Badge variant="secondary">
                                                        {rep.submitted}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>
                                                        Address Verification
                                                    </span>
                                                    <Badge variant="secondary">
                                                        {
                                                            rep.addressVerification
                                                        }
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>
                                                        Identity Verification
                                                    </span>
                                                    <Badge variant="secondary">
                                                        {
                                                            rep.identityVerification
                                                        }
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Under Review</span>
                                                    <Badge variant="secondary">
                                                        {rep.underReview}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>E-sign Pending</span>
                                                    <Badge variant="secondary">
                                                        {rep.esignPending}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Approved</span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-green-500 text-white"
                                                    >
                                                        {rep.approved}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Installed</span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-purple-500 text-white"
                                                    >
                                                        {rep.installed}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Active</span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-emerald-500 text-white"
                                                    >
                                                        {rep.active}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Declined</span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-red-500 text-white"
                                                    >
                                                        {rep.declined}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between border-t pt-2 font-medium">
                                                    <span>Total</span>
                                                    <span>{total}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {salesPipeline.length === 0 && (
                                <p className="col-span-full text-center text-sm text-muted-foreground">
                                    No sales reps yet.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
                    <DialogHeader className="shrink-0 p-6 pb-4">
                        <DialogTitle>Status History</DialogTitle>
                        <DialogDescription>
                            Audit trail for {selectedAppName || 'Application'}'s
                            status updates.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6">
                        <div className="space-y-4 py-4">
                            {historyLoading ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    Loading history...
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No status history recorded yet.
                                </div>
                            ) : (
                                <div className="relative space-y-6 border-l border-border pl-4">
                                    {historyData.map((h: any) => (
                                        <div key={h.id} className="relative">
                                            <span className="absolute -left-[21px] mt-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-muted-foreground">
                                                    {h.createdAt}
                                                </span>
                                                <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {h.from || 'None'}
                                                    </Badge>
                                                    <span>→</span>
                                                    <Badge
                                                        variant="default"
                                                        className="text-xs"
                                                    >
                                                        {h.to}
                                                    </Badge>
                                                </div>
                                                {h.notes && (
                                                    <p className="mt-1 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                                                        {h.notes}
                                                    </p>
                                                )}
                                                <span className="mt-0.5 text-xs text-muted-foreground">
                                                    Changed by: {h.changedBy}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminApplications.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Applications', href: '#' },
    ],
};

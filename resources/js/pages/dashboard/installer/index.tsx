import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, Inbox, Phone, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTicketPolling } from '@/hooks/use-polling';
import { dashboard } from '@/routes';
import { show as ticketShow } from '@/routes/dashboard/installer/ticket';

interface Appliance {
    label: string;
    quantity: number;
    watts: number;
}

interface Address {
    formattedAddress: string;
    street: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
}

interface Ticket {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    customerAddress: Address | null;
    plan: string;
    status: string;
    notes: string | null;
    appliances: Appliance[];
    startedAt: string | null;
    completedAt: string | null;
    completionPhotoPath: string | null;
    completionNotes: string | null;
    createdAt: string;
    checklistDone: number;
    checklistTotal: number;
}

export default function InstallerDashboard() {
    useTicketPolling(30000);

    const { tickets, stats } = usePage().props as unknown as {
        tickets: Ticket[];
        stats: { pending: number; inProgress: number; completed: number };
    };

    const [photoDialog, setPhotoDialog] = useState<{
        ticketId: number;
        open: boolean;
    }>({ ticketId: 0, open: false });
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredTickets = useMemo(
        () =>
            tickets.filter((t) => {
                const matchesSearch =
                    !search ||
                    t.customerName.toLowerCase().includes(search.toLowerCase());
                const matchesStatus =
                    statusFilter === 'all' || t.status === statusFilter;

                return matchesSearch && matchesStatus;
            }),
        [tickets, search, statusFilter],
    );

    const completedWithPhotos = useMemo(
        () =>
            tickets.filter(
                (t) => t.status === 'completed' && t.completionPhotoPath,
            ),
        [tickets],
    );

    const handleStart = (ticketId: number) => {
        router.post(
            `/dashboard/installer/tickets/${ticketId}/start`,
            {},
            {
                onSuccess: () => {
                    toast.success('Ticket started.');
                    router.reload();
                },
                onError: () => toast.error('Failed to start ticket.'),
            },
        );
    };

    const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch(
                `/dashboard/installer/tickets/${photoDialog.ticketId}/complete`,
                {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name=csrf-token]')
                                ?.getAttribute('content') ?? '',
                    },
                    body: formData,
                },
            );
            const data = await res.json();

            if (res.ok) {
                toast.success('Installation completed.');
                setPhotoDialog({ ticketId: 0, open: false });
                router.reload();
            } else {
                toast.error(data.message || 'Failed to complete.');
            }
        } catch {
            toast.error('Failed to complete installation.');
        } finally {
            setUploading(false);
        }
    };

    const statusBadge = (status: string) => {
        const map: Record<
            string,
            { label: string; variant: 'default' | 'secondary' | 'outline' }
        > = {
            pending: { label: 'Pending', variant: 'outline' },
            in_progress: { label: 'In Progress', variant: 'secondary' },
            completed: { label: 'Completed', variant: 'default' },
        };
        const s = map[status] ?? { label: status, variant: 'outline' as const };

        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    return (
        <>
            <Head title="Installer Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Installer Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your installation tickets
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pending
                            </CardTitle>
                            <Clock className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.pending}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                In Progress
                            </CardTitle>
                            <Wrench className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.inProgress}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Completed
                            </CardTitle>
                            <CheckCircle2 className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.completed}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {completedWithPhotos.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Recent Completions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {completedWithPhotos.map((ticket) => (
                                    <Link
                                        key={ticket.id}
                                        href={
                                            ticketShow({ ticket: ticket.id })
                                                .url
                                        }
                                        className="group cursor-pointer"
                                    >
                                        <div className="overflow-hidden rounded-lg border">
                                            <img
                                                src={
                                                    ticket.completionPhotoPath!
                                                }
                                                alt={`${ticket.customerName} installation`}
                                                className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        </div>
                                        <p className="mt-1.5 text-sm font-medium">
                                            {ticket.customerName}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg">My Tickets</CardTitle>
                        <div className="flex items-center gap-3">
                            <Input
                                placeholder="Search customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 w-48"
                            />
                            <Tabs
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <TabsList className="h-9">
                                    <TabsTrigger
                                        value="all"
                                        className="text-xs"
                                    >
                                        All
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="pending"
                                        className="text-xs"
                                    >
                                        Pending
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="in_progress"
                                        className="text-xs"
                                    >
                                        In Progress
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="completed"
                                        className="text-xs"
                                    >
                                        Completed
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 text-center">#</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="hidden lg:table-cell">
                                            Checklist
                                        </TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTickets.map((ticket, idx) => (
                                        <TableRow
                                            key={ticket.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                router.visit(
                                                    ticketShow({
                                                        ticket: ticket.id,
                                                    }).url,
                                                )
                                            }
                                        >
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {ticket.customerName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {ticket.customerEmail}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {ticket.customerPhone ? (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Phone className="size-3 text-muted-foreground" />
                                                        {ticket.customerPhone}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{ticket.plan}</TableCell>
                                            <TableCell>
                                                {statusBadge(ticket.status)}
                                            </TableCell>
                                            <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                                                {ticket.notes ?? '—'}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                {ticket.checklistTotal > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-primary"
                                                                style={{
                                                                    width: `${Math.round((ticket.checklistDone / ticket.checklistTotal) * 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                ticket.checklistDone
                                                            }
                                                            /
                                                            {
                                                                ticket.checklistTotal
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {ticket.createdAt}
                                            </TableCell>
                                            <TableCell
                                                className="text-right"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {ticket.status ===
                                                    'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleStart(
                                                                ticket.id,
                                                            )
                                                        }
                                                    >
                                                        Start
                                                    </Button>
                                                )}
                                                {ticket.status ===
                                                    'in_progress' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setPhotoDialog({
                                                                ticketId:
                                                                    ticket.id,
                                                                open: true,
                                                            })
                                                        }
                                                    >
                                                        Complete
                                                    </Button>
                                                )}
                                                {ticket.status ===
                                                    'completed' && (
                                                    <Badge
                                                        variant="default"
                                                        className="bg-green-500"
                                                    >
                                                        Done
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredTickets.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Inbox className="size-10 text-muted-foreground/50" />
                                                    <p className="font-medium">
                                                        No tickets{' '}
                                                        {statusFilter !== 'all'
                                                            ? statusFilter.replace(
                                                                  '_',
                                                                  ' ',
                                                              )
                                                            : ''}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {search
                                                            ? 'Try a different search term.'
                                                            : 'Waiting for the operations team to assign you a ticket.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="block md:hidden">
                            <div className="divide-y">
                                {filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50"
                                        onClick={() =>
                                            router.visit(
                                                ticketShow({
                                                    ticket: ticket.id,
                                                }).url,
                                            )
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">
                                                    {ticket.customerName}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {ticket.customerEmail}
                                                </p>
                                                {ticket.customerPhone && (
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Phone className="size-3" />
                                                        {ticket.customerPhone}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {statusBadge(ticket.status)}
                                                <span className="text-xs text-muted-foreground">
                                                    {ticket.plan}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {ticket.checklistTotal > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-primary"
                                                                style={{
                                                                    width: `${Math.round((ticket.checklistDone / ticket.checklistTotal) * 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                ticket.checklistDone
                                                            }
                                                            /
                                                            {
                                                                ticket.checklistTotal
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {ticket.createdAt}
                                                </span>
                                            </div>
                                            <div
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {ticket.status ===
                                                    'pending' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() =>
                                                            handleStart(
                                                                ticket.id,
                                                            )
                                                        }
                                                    >
                                                        Start
                                                    </Button>
                                                )}
                                                {ticket.status ===
                                                    'in_progress' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() =>
                                                            setPhotoDialog({
                                                                ticketId:
                                                                    ticket.id,
                                                                open: true,
                                                            })
                                                        }
                                                    >
                                                        Complete
                                                    </Button>
                                                )}
                                                {ticket.status ===
                                                    'completed' && (
                                                    <Badge
                                                        variant="default"
                                                        className="bg-green-500 text-xs"
                                                    >
                                                        Done
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredTickets.length === 0 && (
                                    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                                        <Inbox className="size-10 text-muted-foreground/50" />
                                        <p className="font-medium">
                                            No tickets{' '}
                                            {statusFilter !== 'all'
                                                ? statusFilter.replace('_', ' ')
                                                : ''}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {search
                                                ? 'Try a different search term.'
                                                : 'Waiting for the operations team to assign you a ticket.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Dialog
                    open={photoDialog.open}
                    onOpenChange={(open) =>
                        setPhotoDialog({ ...photoDialog, open })
                    }
                >
                    <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0">
                        <DialogHeader className="shrink-0 p-6 pb-4">
                            <DialogTitle>Complete Installation</DialogTitle>
                            <DialogDescription>
                                Take a photo of the completed installation in
                                landscape mode and add any notes.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6">
                            <form
                                id="install-complete-form"
                                onSubmit={handleComplete}
                                className="space-y-4 py-4"
                            >
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        Installation Photo (landscape)
                                    </label>
                                    <input
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        capture="environment"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        name="completionNotes"
                                        rows={3}
                                        placeholder="Any notes about the installation..."
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </form>
                        </div>
                        <DialogFooter className="shrink-0 p-6 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setPhotoDialog({
                                        ticketId: 0,
                                        open: false,
                                    })
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="install-complete-form"
                                disabled={uploading}
                            >
                                {uploading
                                    ? 'Submitting...'
                                    : 'Complete Installation'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

InstallerDashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Installer', href: '#' },
    ],
};

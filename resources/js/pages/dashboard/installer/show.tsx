import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Camera,
    CheckCircle2,
    CheckSquare,
    Clock,
    Cpu,
    MapPin,
    Phone,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { dashboard } from '@/routes';
import { toggle as checklistToggle } from '@/routes/dashboard/installer/ticket/checklist';

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

interface ChecklistItem {
    id: number;
    label: string;
    isDone: boolean;
    sortOrder: number;
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
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    completionPhotoPath: string | null;
    completionNotes: string | null;
    checklistItems: ChecklistItem[];
}

const statusConfig: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'outline';
        icon: typeof Clock;
    }
> = {
    pending: { label: 'Pending', variant: 'outline', icon: Clock },
    in_progress: { label: 'In Progress', variant: 'secondary', icon: Cpu },
    completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
};

export default function Show() {
    const { ticket } = usePage().props as unknown as { ticket: Ticket };
    const status = statusConfig[ticket.status] ?? statusConfig.pending;
    const StatusIcon = status.icon;

    const doneCount = ticket.checklistItems.filter((i) => i.isDone).length;
    const totalCount = ticket.checklistItems.length;
    const progressPct =
        totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const formatAddress = (addr: Address | null) => {
        if (!addr) {
            return null;
        }

        return (
            addr.formattedAddress ||
            [addr.street, addr.city, addr.state, addr.country]
                .filter(Boolean)
                .join(', ')
        );
    };

    const toggleItem = (item: ChecklistItem) => {
        router.post(
            checklistToggle({ ticket: ticket.id, item: item.id }).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        item.isDone ? 'Item unchecked' : 'Item checked',
                    );
                },
                onError: () => {
                    toast.error('Failed to update checklist item');
                },
            },
        );
    };

    return (
        <>
            <Head title={`Ticket #${ticket.id} — ${ticket.customerName}`} />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={dashboard().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">
                                {ticket.customerName}
                            </h1>
                            <Badge
                                variant={status.variant}
                                className="flex items-center gap-1.5"
                            >
                                <StatusIcon className="size-3" />
                                {status.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Installation ticket #{ticket.id}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="size-4 text-muted-foreground" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Name
                                    </p>
                                    <p className="font-medium">
                                        {ticket.customerName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Email
                                    </p>
                                    <p className="font-medium">
                                        {ticket.customerEmail}
                                    </p>
                                </div>
                                {ticket.customerPhone && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Phone
                                        </p>
                                        <p className="flex items-center gap-1.5 font-medium">
                                            <Phone className="size-3.5 text-muted-foreground" />
                                            {ticket.customerPhone}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {formatAddress(ticket.customerAddress) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <MapPin className="size-4 text-muted-foreground" />
                                        Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">
                                        {formatAddress(ticket.customerAddress)}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Cpu className="size-4 text-muted-foreground" />
                                    Plan & Equipment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Plan
                                    </p>
                                    <Badge variant="secondary" className="mt-1">
                                        {ticket.plan}
                                    </Badge>
                                </div>
                                {ticket.appliances.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            Appliances (
                                            {ticket.appliances.length})
                                        </p>
                                        <div className="space-y-1">
                                            {ticket.appliances.map((a, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm"
                                                >
                                                    <span>{a.label}</span>
                                                    <span className="text-muted-foreground">
                                                        {a.quantity} × {a.watts}
                                                        W
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="size-4 text-muted-foreground" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="flex size-6 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                                                <div className="size-2 rounded-full bg-primary" />
                                            </div>
                                            <div className="mt-0.5 w-px flex-1 bg-border" />
                                        </div>
                                        <div className="pb-6">
                                            <p className="text-sm font-medium">
                                                Created
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {ticket.createdAt}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`flex size-6 items-center justify-center rounded-full border-2 ${ticket.startedAt ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 bg-muted/50'}`}
                                            >
                                                <div
                                                    className={`size-2 rounded-full ${ticket.startedAt ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                                />
                                            </div>
                                            <div className="mt-0.5 w-px flex-1 bg-border" />
                                        </div>
                                        <div
                                            className={`pb-6 ${!ticket.startedAt ? 'opacity-40' : ''}`}
                                        >
                                            <p className="text-sm font-medium">
                                                Started
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {ticket.startedAt ??
                                                    'Not yet started'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`flex size-6 items-center justify-center rounded-full border-2 ${ticket.completedAt ? 'border-green-500 bg-green-500/10' : 'border-muted-foreground/30 bg-muted/50'}`}
                                            >
                                                <div
                                                    className={`size-2 rounded-full ${ticket.completedAt ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                                                />
                                            </div>
                                        </div>
                                        <div
                                            className={
                                                !ticket.completedAt
                                                    ? 'opacity-40'
                                                    : ''
                                            }
                                        >
                                            <p className="text-sm font-medium">
                                                Completed
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {ticket.completedAt ??
                                                    'Not yet completed'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {ticket.checklistItems.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <CheckSquare className="size-4 text-muted-foreground" />
                                        Installation Checklist
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Progress
                                            </span>
                                            <span className="font-medium">
                                                {doneCount}/{totalCount} (
                                                {progressPct}%)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-300"
                                                style={{
                                                    width: `${progressPct}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ul className="space-y-2">
                                        {ticket.checklistItems.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex items-start gap-3"
                                            >
                                                <Checkbox
                                                    checked={item.isDone}
                                                    onCheckedChange={() =>
                                                        toggleItem(item)
                                                    }
                                                    disabled={
                                                        ticket.status ===
                                                        'completed'
                                                    }
                                                    id={`checklist-${item.id}`}
                                                    className="mt-0.5"
                                                />
                                                <label
                                                    htmlFor={`checklist-${item.id}`}
                                                    className={`cursor-pointer text-sm ${item.isDone ? 'text-muted-foreground line-through' : ''}`}
                                                >
                                                    {item.label}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {ticket.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Assignment Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="rounded-md bg-muted/50 p-3 text-sm">
                                        {ticket.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {ticket.completionPhotoPath && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Camera className="size-4 text-muted-foreground" />
                                        Completion Photo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <img
                                        src={ticket.completionPhotoPath}
                                        alt="Installation complete"
                                        className="w-full rounded-lg border object-cover shadow-sm"
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {ticket.completionNotes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Completion Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="rounded-md bg-muted/50 p-3 text-sm">
                                        {ticket.completionNotes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Ticket', href: '#' },
    ],
};

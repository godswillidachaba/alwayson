import { Head, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    CreditCard,
    FileText,
    RotateCcw,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { dashboard } from '@/routes';

interface ApplicationInfo {
    id: number;
    status: string;
    plan: string | null;
    isSuspended: boolean;
}

interface DepositData {
    amount: number | null;
    paid: boolean;
    paidAt: string | null;
}

interface LeaseData {
    monthly: number | null;
}

interface EsignData {
    provider: string;
    signed: boolean;
    signedAt: string | null;
    reference: string | null;
    url: string | null;
}

// G17: Billing schedule row type
interface ScheduleRow {
    id: number;
    dueDate: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'skipped';
    attemptCount: number;
    lastAttemptedAt: string | null;
}

function formatKobo(kobo: number | null | undefined): string {
    if (!kobo) {
        return '—';
    }

    return '₦' + (kobo / 100).toLocaleString();
}

const statusVariant: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    paid: 'default',
    pending: 'secondary',
    failed: 'destructive',
    skipped: 'outline',
};

export default function PaymentsLease() {
    const { application, deposit, lease, esign, schedules } = usePage()
        .props as unknown as {
        application: ApplicationInfo | null;
        deposit: DepositData | null;
        lease: LeaseData | null;
        esign: EsignData | null;
        schedules: ScheduleRow[];
    };

    const handlePayDeposit = async () => {
        if (!application || !deposit?.amount) {
            return;
        }

        const res = await fetch('/payments/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document
                        .querySelector('meta[name=csrf-token]')
                        ?.getAttribute('content') ?? '',
            },
            body: JSON.stringify({
                amount: deposit.amount,
                application_id: application.id,
            }),
        });

        const data = await res.json();

        if (data.authorization_url) {
            window.location.href = data.authorization_url;
        }
    };

    return (
        <>
            <Head title="Payments & Lease" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Payments &amp; Lease</h1>
                    <p className="text-muted-foreground">
                        Your lease agreement and payment details
                    </p>
                </div>

                {/* G3: Suspension banner */}
                {application?.isSuspended && (
                    <Alert variant="destructive">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>Account Suspended</AlertTitle>
                        <AlertDescription>
                            Your AlwaysON service has been suspended due to
                            missed payments. Please contact support to resolve
                            your outstanding balance and restore service.
                        </AlertDescription>
                    </Alert>
                )}

                {!application && (
                    <p className="text-sm text-muted-foreground">
                        No application found. Payment details will appear once
                        you apply.
                    </p>
                )}

                {application && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CreditCard className="size-5" />
                                    Lease Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {lease?.monthly && (
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-muted-foreground">
                                            Monthly lease
                                        </span>
                                        <span className="text-2xl font-bold">
                                            {formatKobo(lease.monthly)}
                                        </span>
                                    </div>
                                )}
                                {deposit?.amount && (
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-muted-foreground">
                                            Deposit
                                        </span>
                                        <span className="text-lg font-medium">
                                            {formatKobo(deposit.amount)}
                                        </span>
                                    </div>
                                )}
                                {application.plan && (
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-muted-foreground">
                                            Plan
                                        </span>
                                        <span className="font-medium">
                                            {application.plan}
                                        </span>
                                    </div>
                                )}
                                {!lease?.monthly && (
                                    <p className="text-muted-foreground">
                                        Lease details will be available once
                                        your application is reviewed.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="size-5" />
                                    Lease Agreement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {esign?.signed ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle2 className="size-5" />
                                            <span className="font-medium">
                                                Signed
                                            </span>
                                        </div>
                                        {esign.signedAt && (
                                            <p className="text-muted-foreground">
                                                Signed on {esign.signedAt}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Badge variant="outline">
                                            Not yet signed
                                        </Badge>
                                        <p className="text-muted-foreground">
                                            Visit your dashboard to review and
                                            sign the lease agreement.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CreditCard className="size-5" />
                                    Deposit Payment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {deposit?.paid ? (
                                    <Alert>
                                        <CheckCircle2 className="size-4 text-green-500" />
                                        <AlertTitle>Deposit Paid</AlertTitle>
                                        <AlertDescription>
                                            {deposit.paidAt
                                                ? `Your deposit of ${formatKobo(deposit.amount)} was paid on ${deposit.paidAt}.`
                                                : `Your deposit of ${formatKobo(deposit.amount)} has been received.`}
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">
                                            {esign?.signed
                                                ? `Pay your deposit of ${formatKobo(deposit?.amount)} to finalise your application.`
                                                : 'Sign your lease agreement first to unlock deposit payment.'}
                                        </p>
                                        {esign?.signed && (
                                            <Button onClick={handlePayDeposit}>
                                                Pay Deposit{' '}
                                                {deposit?.amount
                                                    ? formatKobo(deposit.amount)
                                                    : ''}
                                            </Button>
                                        )}
                                    </>
                                )}

                                <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground">
                                        About your payments
                                    </p>
                                    <p className="mt-1">
                                        Your monthly lease payment will be
                                        collected automatically via direct debit
                                        after installation. The deposit is a
                                        one-time payment due upon signing.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* G17: Monthly billing schedule table */}
                        {schedules && schedules.length > 0 && (
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calendar className="size-5" />
                                        Billing Schedule
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10 text-center">#</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Attempts</TableHead>
                                                <TableHead>
                                                    Last Tried
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {schedules.map((s, idx) => (
                                                <TableRow key={s.id}>
                                                    <TableCell className="text-center text-sm text-muted-foreground">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {s.dueDate}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatKobo(s.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                statusVariant[
                                                                    s.status
                                                                ] ?? 'outline'
                                                            }
                                                        >
                                                            {s.status ===
                                                                'paid' && (
                                                                <CheckCircle2 className="mr-1 size-3" />
                                                            )}
                                                            {s.status ===
                                                                'failed' && (
                                                                <RotateCcw className="mr-1 size-3" />
                                                            )}
                                                            {s.status
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                s.status.slice(
                                                                    1,
                                                                )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {s.attemptCount}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {s.lastAttemptedAt ??
                                                            '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

PaymentsLease.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Payments & Lease',
            href: '',
        },
    ],
};

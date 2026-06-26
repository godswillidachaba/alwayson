import { Head, usePage } from '@inertiajs/react';
import { Check, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface ApplianceItem {
    label: string;
    quantity: number;
    watts: number;
}

interface ApplicationData {
    id: number;
    status: string;
    plan: string | null;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    ndprConsented: boolean;
    buildingType: string | null;
    appliances: ApplianceItem[];
    totalLoadWatts: number | null;
    monthlyIncome: string | null;
    monthlyBill: string | null;
    monthlyGenerator: string | null;
    location: {
        lat: number;
        lng: number;
        formattedAddress: string;
        street: string;
        city: string;
        state: string;
        country: string;
    } | null;
    billingAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
    } | null;
    depositAmount: number | null;
    monthlyLease: number | null;
    submittedAt: string;
}

function getTotalWatts(appliances: ApplianceItem[]): number {
    return appliances.reduce((sum, a) => sum + a.watts * a.quantity, 0);
}

export default function ApplicationDetails() {
    const { application } = usePage().props as unknown as {
        application: ApplicationData | null;
    };

    const totalWatts =
        application?.totalLoadWatts ??
        (application ? getTotalWatts(application.appliances) : 0);

    const appliancesList = application?.appliances ?? [];

    return (
        <>
            <Head title="My Application" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">My Application</h1>
                    <p className="text-muted-foreground">
                        Details of your AlwaysON application
                    </p>
                </div>

                {!application && (
                    <p className="text-sm text-muted-foreground">
                        No application found.{' '}
                        <a href="/apply" className="underline">
                            Apply now.
                        </a>
                    </p>
                )}

                {application && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="size-5" />
                                    Application Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Status
                                    </span>
                                    <Badge>
                                        {application.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Full name
                                    </span>
                                    <span className="font-medium">
                                        {application.fullName ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Email
                                    </span>
                                    <span className="font-medium">
                                        {application.email ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Phone
                                    </span>
                                    <span className="font-medium">
                                        {application.phone ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        NDPR consent
                                    </span>
                                    <span className="font-medium">
                                        {application.ndprConsented
                                            ? <Check className="inline h-4 w-4 text-green-500" />
                                            : <X className="inline h-4 w-4 text-destructive" />}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Plan
                                    </span>
                                    <span className="font-medium">
                                        {application.plan ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Building
                                    </span>
                                    <span className="font-medium capitalize">
                                        {application.buildingType ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Installation location
                                    </span>
                                    <span className="font-medium text-right max-w-48 truncate">
                                        {application.location?.formattedAddress ??
                                            ([application.location?.street, application.location?.city]
                                                .filter(Boolean)
                                                .join(', ') || '—')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Billing address
                                    </span>
                                    <span className="font-medium text-right max-w-48 truncate">
                                        {application.billingAddress
                                            ? [application.billingAddress.street, application.billingAddress.city, application.billingAddress.state]
                                                .filter(Boolean)
                                                .join(', ')
                                            : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Submitted
                                    </span>
                                    <span className="font-medium">
                                        {application.submittedAt}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    Usage &amp; Load
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {totalWatts > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Total load
                                        </span>
                                        <span className="font-medium">
                                            {totalWatts.toLocaleString()}W
                                        </span>
                                    </div>
                                )}
                                {application.monthlyBill && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Monthly bill
                                        </span>
                                        <span className="font-medium">
                                            ₦{application.monthlyBill}
                                        </span>
                                    </div>
                                )}
                                {application.monthlyGenerator && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Generator cost
                                        </span>
                                        <span className="font-medium">
                                            ₦{application.monthlyGenerator}
                                        </span>
                                    </div>
                                )}
                                {application.monthlyIncome && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Income
                                        </span>
                                        <span className="font-medium">
                                            ₦{application.monthlyIncome}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {application.depositAmount != null && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        Pricing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Deposit
                                        </span>
                                        <span className="font-medium">
                                            ₦{(application.depositAmount / 100).toLocaleString()}
                                        </span>
                                    </div>
                                    {application.monthlyLease != null && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Monthly lease
                                            </span>
                                            <span className="font-medium">
                                                ₦{(application.monthlyLease / 100).toLocaleString()}/mo
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    Appliances
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {appliancesList.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {appliancesList.map((a, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <span className="text-muted-foreground">
                                                    {a.label}
                                                    <span className="text-xs text-muted-foreground/60">
                                                        {' '}
                                                        &times;{a.quantity}
                                                    </span>
                                                </span>
                                                <span className="font-medium tabular-nums">
                                                    {(
                                                        a.watts * a.quantity
                                                    ).toLocaleString()}
                                                    W
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No appliances recorded.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}

ApplicationDetails.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'My Application',
            href: '',
        },
    ],
};

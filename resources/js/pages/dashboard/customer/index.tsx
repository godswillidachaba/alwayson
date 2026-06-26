import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Camera,
    CheckCircle2,
    Circle,
    CreditCard,
    FileText,
    IdCard,
    Loader2,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Wrench,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

const MonitoringPreview = lazy(() => import('@/components/monitoring-preview'));
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { dashboard } from '@/routes';
import type { LocationData } from '@/types/application';

interface ApplianceItem {
    label: string;
    quantity: number;
    watts: number;
}

interface ApplicationData {
    id: number;
    status: string;
    plan: string | null;
    buildingType: string | null;
    appliances: ApplianceItem[] | Record<string, number>;
    totalLoadWatts: number | null;
    monthlyIncome: string | null;
    monthlyBill: string | null;
    monthlyGenerator: string | null;
    location: LocationData | null;
    billingAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
    } | null;
    submittedAt: string | null;
}

interface DepositData {
    amount: number | null;
    paid: boolean;
}

interface LeaseData {
    monthly: number | null;
}

interface EsignData {
    provider: string;
    signed: boolean;
    url: string | null;
}

interface VerificationData {
    emailVerified: boolean;
    phoneVerified: boolean;
    phone: string | null;
}

interface KycData {
    addressVerified: boolean;
    identityVerified: boolean;
    identityBvnPrefix: string | null;
}

interface DeclineInfo {
    reason: string;
    details: Record<string, string> | null;
    canRetry: boolean;
}

interface InstallerTicketData {
    status: string;
    completionPhotoPath: string | null;
    completionNotes: string | null;
    installerName: string | null;
}

interface PipelineStep {
    key: string;
    label: string;
    icon: typeof Circle;
    status: 'complete' | 'current' | 'pending' | 'action';
    action?: {
        label: string;
        onClick: () => void;
    };
}

const declineMessages: Record<
    string,
    { title: string; description: string; action: string }
> = {
    income_threshold: {
        title: 'Income Below Threshold',
        description:
            'Your declared income does not meet the minimum requirement for this plan. You can reapply with a guarantor or co-applicant, or try again when your income changes.',
        action: 'Reapply with Guarantor',
    },
    kyc_bvn_failure: {
        title: 'Verification Failed',
        description:
            'We could not complete your identity verification. Please ensure your BVN is linked to your phone number and try again.',
        action: 'Try Again',
    },
    address_not_serviceable: {
        title: 'Address Not Serviceable',
        description:
            'AlwaysON does not currently cover your area. Register your interest and we will notify you when coverage expands.',
        action: 'Register Interest',
    },
};

function formatKobo(kobo: number | null | undefined): string {
    if (!kobo) {
        return '—';
    }

    return '₦' + (kobo / 100).toLocaleString();
}

export default function CustomerDashboard() {
    const {
        application,
        deposit,
        lease,
        esign,
        verification,
        kyc,
        declineInfo,
        installerTicket,
    } = usePage().props as unknown as {
        application: ApplicationData | null;
        deposit: DepositData | null;
        lease: LeaseData | null;
        esign: EsignData | null;
        verification: VerificationData;
        kyc: KycData | null;
        declineInfo: DeclineInfo | null;
        installerTicket: InstallerTicketData | null;
    };

    const [addressDialogOpen, setAddressDialogOpen] = useState(false);
    const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // G15: progress 0-100
    const [bvn, setBvn] = useState('');
    const [bvnVerifying, setBvnVerifying] = useState(false);

    // G16: Poll for real-time status updates every 15 seconds
    useEffect(() => {
        if (
            !application ||
            application.status === 'active' ||
            application.status === 'declined'
        ) {
            return; // No need to poll terminal states
        }

        const interval = setInterval(() => {
            router.reload({
                only: [
                    'application',
                    'deposit',
                    'esign',
                    'kyc',
                    'installerTicket',
                    'isSuspended',
                ],
            });
        }, 15_000);

        return () => clearInterval(interval);
    }, [application]);

    const handleSendCode = () => {
        router.post('/verify/phone/send', { phone: verification.phone });
    };

    const handleAcceptEsign = () => {
        router.post(
            '/dashboard/esign/accept',
            {},
            {
                onSuccess: () => {
                    router.reload();
                },
            },
        );
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

    const handleAddressUpload = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData(e.currentTarget);
        const csrfToken =
            document
                .querySelector('meta[name=csrf-token]')
                ?.getAttribute('content') ?? '';

        // G15: Use XHR so we can track upload progress
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/dashboard/kyc/address');
        xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
                setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            }
        };
        xhr.onload = () => {
            setUploading(false);
            setUploadProgress(0);

            try {
                const data = JSON.parse(xhr.responseText);

                if (xhr.status < 300) {
                    toast.success('Address document uploaded.');
                    setAddressDialogOpen(false);
                    router.reload();
                } else {
                    toast.error(data.message || 'Upload failed.');
                }
            } catch {
                toast.error('Upload failed.');
            }
        };
        xhr.onerror = () => {
            setUploading(false);
            setUploadProgress(0);
            toast.error('Upload failed.');
        };
        xhr.send(formData);
    };

    const handleBvnSubmit = async () => {
        if (!bvn || bvn.length !== 11) {
            toast.error('Enter a valid 11-digit BVN.');

            return;
        }

        setBvnVerifying(true);

        try {
            const res = await fetch('/dashboard/kyc/identity/bvn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name=csrf-token]')
                            ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ bvn }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('BVN verified successfully.');
                setIdentityDialogOpen(false);
                router.reload();
            } else {
                toast.error(data.message || 'BVN verification failed.');
            }
        } catch {
            toast.error('Verification failed.');
        } finally {
            setBvnVerifying(false);
        }
    };

    const handleIdentityDocUpload = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData(e.currentTarget);
        const csrfToken =
            document
                .querySelector('meta[name=csrf-token]')
                ?.getAttribute('content') ?? '';

        // G15: Use XHR so we can track upload progress
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/dashboard/kyc/identity/document');
        xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
                setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            }
        };
        xhr.onload = () => {
            setUploading(false);
            setUploadProgress(0);

            try {
                const data = JSON.parse(xhr.responseText);

                if (xhr.status < 300) {
                    toast.success('Identity document uploaded.');
                    router.reload();
                } else {
                    toast.error(data.message || 'Upload failed.');
                }
            } catch {
                toast.error('Upload failed.');
            }
        };
        xhr.onerror = () => {
            setUploading(false);
            setUploadProgress(0);
            toast.error('Upload failed.');
        };
        xhr.send(formData);
    };

    const status = application?.status;
    const isKycStep = status === 'submitted';
    const isUnderReview = status === 'under_review';
    const isEsignStep = status === 'esign_pending';
    const isApproved = status === 'approved';
    const isInstalled = status === 'installed';
    const isActive = status === 'active';
    const isDeclined = status === 'declined';

    const pipelineSteps: PipelineStep[] = [
        {
            key: 'submitted',
            label: 'Submitted',
            icon: CheckCircle2,
            status: 'complete',
        },
        {
            key: 'address',
            label: 'Address Verification',
            icon: kyc?.addressVerified ? CheckCircle2 : MapPin,
            status: kyc?.addressVerified
                ? 'complete'
                : isKycStep
                  ? 'action'
                  : 'pending',
            action: kyc?.addressVerified
                ? undefined
                : {
                      label: 'Upload Proof of Address',
                      onClick: () => setAddressDialogOpen(true),
                  },
        },
        {
            key: 'identity',
            label: 'Identity Verification',
            icon: kyc?.identityVerified ? CheckCircle2 : IdCard,
            status: kyc?.identityVerified
                ? 'complete'
                : isKycStep
                  ? 'action'
                  : 'pending',
            action: kyc?.identityVerified
                ? undefined
                : {
                      label: kyc?.identityBvnPrefix
                          ? 'Upload ID Document'
                          : 'Verify BVN',
                      onClick: () => setIdentityDialogOpen(true),
                  },
        },
        {
            key: 'under_review',
            label: 'Under Review',
            icon: isUnderReview ? Loader2 : isDeclined ? AlertCircle : Circle,
            status: isUnderReview
                ? 'current'
                : isDeclined
                  ? 'pending'
                  : isKycStep
                    ? 'pending'
                    : 'complete',
        },
        {
            key: 'esign',
            label: 'E-Signing',
            icon: esign?.signed ? CheckCircle2 : FileText,
            status: esign?.signed
                ? 'complete'
                : isEsignStep
                  ? 'action'
                  : isApproved || isInstalled || isActive
                    ? 'complete'
                    : 'pending',
            action:
                !esign?.signed && isEsignStep
                    ? {
                          label: 'Sign Agreement',
                          onClick: handleAcceptEsign,
                      }
                    : undefined,
        },
        {
            key: 'deposit',
            label: 'Deposit',
            icon: deposit?.paid ? CheckCircle2 : CreditCard,
            status: deposit?.paid
                ? 'complete'
                : esign?.signed && !deposit?.paid
                  ? 'action'
                  : isApproved || isInstalled || isActive
                    ? 'complete'
                    : 'pending',
            action:
                !deposit?.paid && esign?.signed
                    ? {
                          label: `Pay ${formatKobo(deposit?.amount)}`,
                          onClick: handlePayDeposit,
                      }
                    : undefined,
        },
        {
            key: 'installed',
            label: 'Installation',
            icon: isInstalled || isActive ? CheckCircle2 : Wrench,
            status: isInstalled || isActive ? 'complete' : 'pending',
        },
        {
            key: 'active',
            label: 'Active',
            icon: isActive ? CheckCircle2 : Circle,
            status: isActive ? 'complete' : 'pending',
        },
    ];

    const declineMsg = declineInfo ? declineMessages[declineInfo.reason] : null;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground">
                        Track your application and payments
                    </p>
                </div>

                {!application && (
                    <Alert>
                        <AlertCircle className="size-4" />
                        <AlertTitle>No Application Yet</AlertTitle>
                        <AlertDescription>
                            You haven&apos;t submitted an application yet.{' '}
                            <a href="/apply" className="underline">
                                Apply now
                            </a>{' '}
                            to get started with AlwaysON.
                        </AlertDescription>
                    </Alert>
                )}

                {declineInfo && declineMsg && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertTitle>{declineMsg.title}</AlertTitle>
                        <AlertDescription className="space-y-3">
                            <p>{declineMsg.description}</p>
                            <Button variant="outline" size="sm">
                                {declineMsg.action}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {application && !declineInfo && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    Application Progress
                                    <Badge>{status?.replace(/_/g, ' ')}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {pipelineSteps.map((step, i) => {
                                        const Icon = step.icon;
                                        const isComplete =
                                            step.status === 'complete';
                                        const isCurrent =
                                            step.status === 'current';
                                        const needsAction =
                                            step.status === 'action';

                                        return (
                                            <div
                                                key={step.key}
                                                className="flex items-start gap-3 py-2"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`flex size-8 items-center justify-center rounded-full ${
                                                            isComplete
                                                                ? 'bg-green-100 text-green-600'
                                                                : isCurrent
                                                                  ? 'bg-blue-100 text-blue-600'
                                                                  : needsAction
                                                                    ? 'bg-amber-100 text-amber-600'
                                                                    : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {isCurrent &&
                                                        step.key ===
                                                            'under_review' ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Icon className="size-4" />
                                                        )}
                                                    </div>
                                                    {i <
                                                        pipelineSteps.length -
                                                            1 && (
                                                        <div
                                                            className={`h-6 w-px ${
                                                                isComplete
                                                                    ? 'bg-green-300'
                                                                    : 'bg-muted'
                                                            }`}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-1 items-center justify-between pt-1">
                                                    <div>
                                                        <span
                                                            className={`text-sm font-medium ${
                                                                isComplete
                                                                    ? 'text-green-700'
                                                                    : isCurrent
                                                                      ? 'text-blue-700'
                                                                      : needsAction
                                                                        ? 'text-amber-700'
                                                                        : 'text-muted-foreground'
                                                            }`}
                                                        >
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                    {needsAction &&
                                                        step.action && (
                                                            <Button
                                                                size="sm"
                                                                variant={
                                                                    isEsignStep ||
                                                                    (esign?.signed &&
                                                                        !deposit?.paid)
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                onClick={
                                                                    step.action
                                                                        .onClick
                                                                }
                                                            >
                                                                {
                                                                    step.action
                                                                        .label
                                                                }
                                                            </Button>
                                                        )}
                                                    {isCurrent &&
                                                        step.key ===
                                                            'under_review' && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="shrink-0"
                                                            >
                                                                Pending Review
                                                            </Badge>
                                                        )}
                                                    {kyc?.identityBvnPrefix &&
                                                        step.key ===
                                                            'identity' &&
                                                        !kyc.identityVerified &&
                                                        isKycStep && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="shrink-0"
                                                            >
                                                                BVN:{' '}
                                                                {
                                                                    kyc.identityBvnPrefix
                                                                }
                                                            </Badge>
                                                        )}
                                                    {installerTicket &&
                                                        step.key ===
                                                            'installed' && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="shrink-0"
                                                            >
                                                                {installerTicket.installerName ??
                                                                    'Installer'}{' '}
                                                                —{' '}
                                                                {installerTicket.status.replace(
                                                                    /_/g,
                                                                    ' ',
                                                                )}
                                                            </Badge>
                                                        )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address Verification Dialog */}
                        <Dialog
                            open={addressDialogOpen}
                            onOpenChange={setAddressDialogOpen}
                        >
                            <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0">
                                <DialogHeader className="shrink-0 p-6 pb-4">
                                    <DialogTitle>Proof of Address</DialogTitle>
                                    <DialogDescription>
                                        Upload a recent utility bill, bank
                                        statement, or tenancy agreement (max
                                        5MB, PDF/JPEG/PNG).
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="min-h-0 flex-1 overflow-y-auto px-6">
                                    {application?.billingAddress && (application.billingAddress.street || application.billingAddress.city || application.billingAddress.state) && (
                                        <div className="mb-4 rounded-lg border border-border/60 bg-muted p-3 text-sm">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Your billing address
                                            </span>
                                            <p className="mt-0.5">
                                                {[application.billingAddress.street, application.billingAddress.city, application.billingAddress.state].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    <form
                                        id="address-form"
                                        onSubmit={handleAddressUpload}
                                        className="space-y-4 py-4"
                                    >
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">
                                                Document
                                            </label>
                                            <input
                                                type="file"
                                                name="document"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                required
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">
                                                Notes (optional)
                                            </label>
                                            <textarea
                                                name="notes"
                                                rows={3}
                                                placeholder="E.g., tenant at this address, document date..."
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {uploading && (
                                            <div className="w-full space-y-1">
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                                    <div
                                                        className="h-2 rounded-full bg-primary transition-all duration-300"
                                                        style={{
                                                            width: `${uploadProgress}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-right text-xs text-muted-foreground">
                                                    {uploadProgress}% uploaded
                                                </p>
                                            </div>
                                        )}
                                    </form>
                                </div>
                                <DialogFooter className="shrink-0 p-6 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setAddressDialogOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="address-form"
                                        disabled={uploading}
                                    >
                                        {uploading
                                            ? `Uploading (${uploadProgress}%)`
                                            : 'Upload'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Identity Verification Dialog */}
                        <Dialog
                            open={identityDialogOpen}
                            onOpenChange={setIdentityDialogOpen}
                        >
                            <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0">
                                <DialogHeader className="shrink-0 p-6 pb-4">
                                    <DialogTitle>
                                        Identity Verification
                                    </DialogTitle>
                                    <DialogDescription>
                                        {kyc?.identityBvnPrefix
                                            ? "Upload a clear photo of your government-issued ID (NIN slip, passport, driver's license)."
                                            : 'Enter your 11-digit BVN to verify your identity.'}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="min-h-0 flex-1 overflow-y-auto px-6">
                                    {kyc?.identityBvnPrefix ? (
                                        <form
                                            id="identity-doc-form"
                                            onSubmit={handleIdentityDocUpload}
                                            className="space-y-4 py-4"
                                        >
                                            <p className="text-sm text-muted-foreground">
                                                BVN:{' '}
                                                <strong>
                                                    {kyc.identityBvnPrefix}
                                                </strong>
                                            </p>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">
                                                    ID Document
                                                </label>
                                                <input
                                                    type="file"
                                                    name="document"
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    required
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                />
                                            </div>
                                            {uploading && (
                                                <div className="w-full space-y-1">
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                                        <div
                                                            className="h-2 rounded-full bg-primary transition-all duration-300"
                                                            style={{
                                                                width: `${uploadProgress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-right text-xs text-muted-foreground">
                                                        {uploadProgress}% uploaded
                                                    </p>
                                                </div>
                                            )}
                                        </form>
                                    ) : (
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">
                                                    BVN Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bvn}
                                                    onChange={(e) =>
                                                        setBvn(
                                                            e.target.value
                                                                .replace(/\D/g, '')
                                                                .slice(0, 11),
                                                        )
                                                    }
                                                    placeholder="Enter 11-digit BVN"
                                                    maxLength={11}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Your BVN is verified against the
                                                NIBSS database. Your data is
                                                encrypted and secure.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="shrink-0 p-6 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIdentityDialogOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    {kyc?.identityBvnPrefix ? (
                                        <Button
                                            type="submit"
                                            form="identity-doc-form"
                                            disabled={uploading}
                                        >
                                            {uploading
                                                ? `Uploading (${uploadProgress}%)`
                                                : 'Upload'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleBvnSubmit}
                                            disabled={
                                                bvnVerifying ||
                                                bvn.length !== 11
                                            }
                                        >
                                            {bvnVerifying
                                                ? 'Verifying...'
                                                : 'Verify BVN'}
                                        </Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Suspense
                            fallback={
                                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                    Loading chart…
                                </div>
                            }
                        >
                            <MonitoringPreview application={application} />
                        </Suspense>

                        <div className="grid gap-6 md:grid-cols-2">
                            {isEsignStep && !esign?.signed && (
                                <Card className="border-primary md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <FileText className="size-5" />
                                            Complete Your E-Signing
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="rounded-lg border p-4 text-sm">
                                            <h3 className="mb-2 font-semibold">
                                                AlwaysON Solar Lease Agreement
                                            </h3>
                                            <p className="mb-1 text-muted-foreground">
                                                Plan:{' '}
                                                <span className="font-medium text-foreground">
                                                    {application.plan ??
                                                        'Standard'}
                                                </span>
                                            </p>
                                            {lease?.monthly && (
                                                <p className="mb-1 text-muted-foreground">
                                                    Monthly lease:{' '}
                                                    <span className="font-medium text-foreground">
                                                        {formatKobo(
                                                            lease.monthly,
                                                        )}
                                                    </span>
                                                </p>
                                            )}
                                            {deposit?.amount && (
                                                <p className="mb-1 text-muted-foreground">
                                                    Deposit:{' '}
                                                    <span className="font-medium text-foreground">
                                                        {formatKobo(
                                                            deposit.amount,
                                                        )}
                                                    </span>
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                By accepting, you agree to the
                                                terms and conditions of the
                                                AlwaysON lease agreement. A
                                                deposit payment will be required
                                                after signing.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleAcceptEsign}
                                            className="w-full"
                                        >
                                            {esign?.provider === 'docusign'
                                                ? 'Proceed to DocuSign'
                                                : 'I Accept the Lease Agreement'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {esign?.signed && deposit && !deposit.paid && (
                                <Card className="border-primary md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <CreditCard className="size-5" />
                                            Pay Your Deposit
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Your agreement has been signed. Pay
                                            your deposit of{' '}
                                            <span className="font-semibold text-foreground">
                                                {formatKobo(deposit.amount)}
                                            </span>{' '}
                                            to finalise your application.
                                        </p>
                                        <Button
                                            onClick={handlePayDeposit}
                                            className="w-full"
                                        >
                                            Pay Deposit{' '}
                                            {deposit.amount
                                                ? formatKobo(deposit.amount)
                                                : ''}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {deposit?.paid && (
                                <Card className="md:col-span-2">
                                    <CardContent className="pt-6">
                                        <Alert>
                                            <CheckCircle2 className="size-4 text-green-500" />
                                            <AlertTitle>
                                                Deposit Paid
                                            </AlertTitle>
                                            <AlertDescription>
                                                Your deposit has been received.
                                                Your application is now
                                                approved. We will be in touch
                                                within 48 hours to arrange
                                                installation.
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            )}

                            {installerTicket?.completionPhotoPath && (
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Camera className="size-5" />
                                            Installation Complete
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <img
                                            src={
                                                installerTicket.completionPhotoPath
                                            }
                                            alt="Installation completion"
                                            className="w-full max-w-md rounded-lg border"
                                        />
                                        {installerTicket.completionNotes && (
                                            <p className="text-sm text-muted-foreground">
                                                {
                                                    installerTicket.completionNotes
                                                }
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <CreditCard className="size-5" />
                                        Lease Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {lease?.monthly && (
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-muted-foreground">
                                                Monthly lease
                                            </span>
                                            <span className="text-lg font-bold">
                                                {formatKobo(lease.monthly)}
                                            </span>
                                        </div>
                                    )}
                                    {deposit?.amount && (
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-muted-foreground">
                                                Deposit
                                            </span>
                                            <span className="font-medium">
                                                {formatKobo(deposit.amount)}
                                                {deposit.paid && (
                                                    <Badge className="ml-2 bg-green-500 text-xs">
                                                        Paid
                                                    </Badge>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {!lease?.monthly && (
                                        <p className="text-muted-foreground">
                                            Lease details will appear once your
                                            application is reviewed.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ShieldCheck className="size-5" />
                                        Account Verification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Email
                                            </span>
                                        </div>
                                        {verification.emailVerified ? (
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
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Phone className="size-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Phone
                                            </span>
                                        </div>
                                        {verification.phoneVerified ? (
                                            <Badge
                                                variant="default"
                                                className="bg-green-500"
                                            >
                                                Verified
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    Pending
                                                </Badge>
                                                {verification.phone && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleSendCode}
                                                    >
                                                        Verify
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

CustomerDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};

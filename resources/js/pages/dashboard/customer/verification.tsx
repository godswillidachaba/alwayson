import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface VerificationData {
    emailVerified: boolean;
    phoneVerified: boolean;
    phone: string | null;
}

export default function Verification() {
    const { verification } = usePage().props as unknown as {
        verification: VerificationData;
    };

    const handleSendCode = () => {
        if (!verification.phone) {
            return;
        }

        router.post('/verify/phone/send', { phone: verification.phone });
    };

    return (
        <>
            <Head title="Verification" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Verification</h1>
                    <p className="text-muted-foreground">
                        Complete these steps to verify your identity
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Mail className="size-5" />
                                Email Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {verification.emailVerified ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="size-5" />
                                    <span className="text-sm font-medium">
                                        Verified
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Check your email inbox for a
                                        verification link. Didn&apos;t receive
                                        it? You can request a new one from your
                                        profile settings.
                                    </p>
                                    <Badge variant="outline">Pending</Badge>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Phone className="size-5" />
                                Phone Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {verification.phoneVerified ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="size-5" />
                                    <span className="text-sm font-medium">
                                        Verified
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        {verification.phone
                                            ? `A verification code will be sent to ${verification.phone} via WhatsApp.`
                                            : 'No phone number on file. Update your phone number to proceed.'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Pending</Badge>
                                        {verification.phone && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleSendCode}
                                            >
                                                Send Code
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Verification.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Verification',
            href: '',
        },
    ],
};

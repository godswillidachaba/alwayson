import { Head, Link } from '@inertiajs/react';
import MarketingFooter from '@/components/marketing-footer';
import MarketingHeader from '@/components/marketing-header';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy">
                <meta
                    name="description"
                    content="AlwaysON privacy policy. Learn how we collect, use, and protect your personal data in compliance with the Nigeria Data Protection Regulation (NDPR)."
                />
            </Head>
            <div className="flex min-h-screen flex-col">
                <MarketingHeader />
                <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 sm:px-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        &larr; Back to home
                    </Link>
                    <h1 className="mt-6 font-display text-4xl font-bold">
                        Privacy Policy
                    </h1>
                    <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
                        <p>
                            AlwaysON is committed to protecting your privacy.
                            This policy explains how we collect, use, and share
                            your personal data.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Information we collect
                        </h2>
                        <p>
                            We collect information you provide directly: name,
                            email, phone number, address, electricity bill
                            details, and payment information. We also collect
                            information automatically: IP address, browser type,
                            and usage data.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            How we use your information
                        </h2>
                        <p>
                            We use your information to process your application,
                            size your solar system, assess creditworthiness,
                            deliver and maintain your system, and communicate
                            with you about your account.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Data sharing
                        </h2>
                        <p>
                            We may share your data with our financing partners
                            for credit assessment, installation partners for
                            system delivery, and regulatory authorities as
                            required by law.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Your rights
                        </h2>
                        <p>
                            Under the Nigeria Data Protection Regulation (NDPR),
                            you have the right to access, correct, or delete
                            your personal data. Contact us at
                            privacy@alwayson.energy to exercise these rights.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Last updated: June 2026
                        </p>
                    </div>
                </main>
                <MarketingFooter />
            </div>
        </>
    );
}

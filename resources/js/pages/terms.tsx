import { Head, Link } from '@inertiajs/react';
import MarketingFooter from '@/components/marketing-footer';
import MarketingHeader from '@/components/marketing-header';

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service">
                <meta
                    name="description"
                    content="AlwaysON terms of service governing the solar-as-a-service agreement between AlwaysON and its customers."
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
                        Terms of Service
                    </h1>
                    <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
                        <p>
                            By using AlwaysON&apos;s services, you agree to
                            these terms. Please read them carefully.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Service description
                        </h2>
                        <p>
                            AlwaysON provides solar-as-a-service: we design,
                            install, own, and maintain solar energy systems at
                            your premises in exchange for a monthly lease fee.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Payment terms
                        </h2>
                        <p>
                            The monthly lease fee is due on the same day each
                            month. Late payments may incur additional charges.
                            The initial deposit is due upon approval and is
                            non-refundable after installation begins.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Equipment ownership
                        </h2>
                        <p>
                            All solar equipment installed by AlwaysON remains
                            the property of AlwaysON for the duration of the
                            lease agreement. Upon full completion of the lease
                            term, ownership may transfer per the specific
                            agreement terms.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Maintenance and support
                        </h2>
                        <p>
                            AlwaysON is responsible for all maintenance and
                            repairs during the lease term. Customers must report
                            issues promptly through the AlwaysON dashboard or
                            support line.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Limitation of liability
                        </h2>
                        <p>
                            AlwaysON&apos;s liability is limited to the monthly
                            lease fee paid. We are not liable for indirect
                            damages, including loss of business or data.
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

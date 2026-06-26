import { Head, Link } from '@inertiajs/react';
import MarketingFooter from '@/components/marketing-footer';
import MarketingHeader from '@/components/marketing-header';

export default function About() {
    return (
        <>
            <Head title="About Us">
                <meta
                    name="description"
                    content="AlwaysON is a solar-as-a-service company powering Nigerian homes and SMEs with no upfront cost. Learn more about our mission."
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
                        About AlwaysON
                    </h1>
                    <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
                        <p>
                            AlwaysON is a Nigerian solar-as-a-service company.
                            We design, install, and maintain solar systems for
                            homes and businesses — with no upfront cost.
                        </p>
                        <p>
                            Our mission is to make reliable, clean energy
                            accessible to every Nigerian. We handle everything
                            from system design and permitting to installation,
                            monitoring, and maintenance.
                        </p>
                        <p>
                            Headquartered in Lagos, we currently serve customers
                            in Lagos, Abuja, and Port Harcourt, with plans to
                            expand nationwide.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Our model
                        </h2>
                        <p>
                            Instead of paying ₦500,000+ upfront for a solar
                            system, you pay a fixed monthly fee that is
                            typically less than your current electricity bill
                            plus generator fuel costs. We own and maintain the
                            equipment — you enjoy uninterrupted power.
                        </p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Why AlwaysON?
                        </h2>
                        <ul className="list-disc space-y-2 pl-6">
                            <li>No upfront cost — deposit from ₦7,000</li>
                            <li>
                                Approved in 10 minutes, installed in 48 hours
                            </li>
                            <li>Tier-1 hardware with full warranty</li>
                            <li>24/7 live monitoring and maintenance</li>
                            <li>NDPR compliant and fully insured</li>
                        </ul>
                    </div>
                </main>
                <MarketingFooter />
            </div>
        </>
    );
}

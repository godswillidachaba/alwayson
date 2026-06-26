import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, ArrowRight, Zap, Clock, Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Counter from '@/components/counter';
import MarketingFooter from '@/components/marketing-footer';
import MarketingHeader from '@/components/marketing-header';
import ScrollReveal from '@/components/scroll-reveal';

const stagger = {
    initial: { opacity: 0, y: 24 },
    animate: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.1 * i,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    }),
};

function HeroSection({
    content,
}: {
    content: {
        badge: string;
        headline1: string;
        headline2: string;
        description: string;
        deposit: string;
        buttons: { text: string; href: string }[];
        liveOutput: string;
    };
}) {
    const words1 = content.headline1.split(' ');
    const words2 = content.headline2.split(' ');

    return (
        <section className="relative min-h-[90vh] overflow-hidden">
            <div className="absolute inset-0">
                <picture>
                    <source
                        srcSet="/assets/hero-rooftop.webp"
                        type="image/webp"
                    />
                    <img
                        src="/assets/hero-rooftop.jpg"
                        alt="Solar panels on a Lagos rooftop — AlwaysON installation"
                        className="h-full w-full object-cover"
                    />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-r from-[#231f20] via-[#231f20]/85 to-[#231f20]/40" />
                <div className="noise absolute inset-0" />
            </div>
            <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-6xl items-center px-4 pt-28 pb-20 sm:px-6">
                <div className="flex max-w-2xl flex-col gap-6">
                    <motion.div
                        custom={0}
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm"
                    >
                        <Zap className="h-3.5 w-3.5 text-primary-light" />
                        {content.badge}
                    </motion.div>

                    <h1 className="font-display leading-[1.05] tracking-tight">
                        <span className="flex flex-wrap gap-x-[0.3em] text-[clamp(2.2rem,5vw+1rem,4.25rem)] font-semibold">
                            {words1.map((word, i) => (
                                <motion.span
                                    key={`w1-${i}`}
                                    custom={i + 1}
                                    variants={stagger}
                                    initial="initial"
                                    animate="animate"
                                    className={
                                        /^\d/.test(word)
                                            ? 'text-primary-light'
                                            : 'text-white'
                                    }
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </span>
                        <span className="flex flex-wrap gap-x-[0.3em] text-[clamp(2.2rem,5vw+1rem,4.25rem)] font-semibold">
                            {words2.map((word, i) => (
                                <motion.span
                                    key={`w2-${i}`}
                                    custom={i + words1.length + 1}
                                    variants={stagger}
                                    initial="initial"
                                    animate="animate"
                                    className={
                                        /^\d/.test(word)
                                            ? 'text-primary-light'
                                            : 'text-white'
                                    }
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </span>
                    </h1>

                    <motion.p
                        custom={words1.length + words2.length + 1}
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                        className="max-w-lg text-base leading-relaxed text-white/70 sm:text-lg"
                        dangerouslySetInnerHTML={{
                            __html: content.description,
                        }}
                    />

                    <motion.div
                        custom={words1.length + words2.length + 2}
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                        className="flex flex-wrap items-center gap-4"
                    >
                        {content.buttons?.map((btn, i) =>
                            btn.href.startsWith('/') ? (
                                <Link
                                    key={i}
                                    href={btn.href}
                                    className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-7 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-primary-dark hover:shadow-xl active:scale-[0.98]"
                                >
                                    {btn.text}
                                    {i === 0 && (
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    )}
                                </Link>
                            ) : (
                                <a
                                    key={i}
                                    href={btn.href}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-medium whitespace-nowrap text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white"
                                >
                                    {btn.text}
                                </a>
                            ),
                        )}
                    </motion.div>

                    <motion.p
                        custom={words1.length + words2.length + 3}
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                        className="text-sm text-white/50"
                    >
                        {content.deposit}
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 1.2,
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute right-12 bottom-12 hidden items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl lg:flex"
                >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/40 text-primary-light">
                        <Zap className="h-5 w-5" />
                    </span>
                    <div>
                        <div className="text-xs text-white/60">
                            {content.liveOutput}
                        </div>
                        <div className="text-sm font-semibold text-white">
                            <Counter
                                from={0}
                                to={8.4}
                                decimals={1}
                                duration={1.5}
                            />{' '}
                            kWh · 100% uptime
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function StatsBar({
    items,
}: {
    items: {
        label: string;
        value: number;
        prefix: string;
        suffix: string;
    }[];
}) {
    return (
        <section className="bg-primary">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                    {items.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{
                                delay: i * 0.1,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="flex flex-col items-center gap-1 text-center"
                        >
                            <span className="font-display text-3xl font-bold text-white sm:text-4xl">
                                <Counter
                                    from={0}
                                    to={stat.value}
                                    prefix={stat.prefix}
                                    suffix={stat.suffix}
                                    decimals={0}
                                />
                            </span>
                            <span className="text-sm text-white/75">
                                {stat.label}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const ICON_MAP: Record<string, React.ReactNode> = {
    sun: <Sun className="h-6 w-6" />,
    check: <Check className="h-6 w-6" />,
    zap: <Zap className="h-6 w-6" />,
    clock: <Clock className="h-6 w-6" />,
};

function HowItWorks({
    content,
}: {
    content: {
        label: string;
        title: string;
        steps: {
            icon: string;
            title: string;
            description: string;
        }[];
    };
}) {
    return (
        <section id="how" className="relative bg-surface-elevated">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
                <ScrollReveal>
                    <div className="mx-auto mb-16 max-w-2xl text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            {content.label}
                        </p>
                        <h2 className="mt-3 font-display text-[clamp(1.75rem,3vw+0.5rem,3rem)] leading-[1.1] font-semibold">
                            {content.title}
                        </h2>
                    </div>
                </ScrollReveal>

                <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="absolute top-6 left-6 hidden h-[calc(100%-3rem)] w-px bg-border lg:block" />
                    {content.steps.map((s, i) => (
                        <ScrollReveal key={i} delay={i * 0.1}>
                            <div className="relative flex flex-col gap-3 pl-14 lg:pl-0">
                                <div className="absolute top-0 left-0 grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md lg:relative lg:mb-1">
                                    {ICON_MAP[s.icon] ?? (
                                        <Sun className="h-6 w-6" />
                                    )}
                                </div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Step {i + 1}
                                </p>
                                <h3 className="font-display text-xl font-semibold">
                                    {s.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {s.description}
                                </p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PricingSection({
    content,
}: {
    content: {
        label: string;
        title: string;
        description: string;
        plans: {
            name: string;
            price: string;
            deposit: string;
            badge: string | null;
            features: string[];
        }[];
    };
}) {
    return (
        <section id="pricing">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
                <ScrollReveal>
                    <div className="mx-auto mb-16 max-w-2xl text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            {content.label}
                        </p>
                        <h2 className="mt-3 font-display text-[clamp(1.75rem,3vw+0.5rem,3rem)] leading-[1.1] font-semibold">
                            {content.title}
                        </h2>
                        <div
                            className="mt-4 text-muted-foreground"
                            dangerouslySetInnerHTML={{
                                __html: content.description,
                            }}
                        />
                    </div>
                </ScrollReveal>

                <div className="grid gap-8 lg:grid-cols-3">
                    {content.plans.map((plan, i) => (
                        <ScrollReveal key={plan.name} delay={i * 0.1}>
                            <motion.div
                                whileHover={{
                                    y: -6,
                                    boxShadow:
                                        '0 20px 40px -12px rgba(0,0,0,0.1)',
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20,
                                }}
                                className={`relative flex flex-col rounded-2xl border bg-surface p-8 shadow-sm transition-shadow ${
                                    plan.badge
                                        ? 'border-primary/40 ring-1 ring-primary/20'
                                        : 'border-border/60'
                                }`}
                            >
                                {plan.badge && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground"
                                    >
                                        {plan.badge}
                                    </motion.div>
                                )}
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="font-display text-2xl font-semibold">
                                        {plan.name}
                                    </h3>
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                                        <Sun className="h-5 w-5" />
                                    </span>
                                </div>
                                <div className="mb-6">
                                    <div className="font-display text-3xl font-bold">
                                        {plan.price}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {plan.deposit}
                                    </div>
                                </div>
                                <ul className="mb-8 flex flex-col gap-3 text-sm">
                                    {plan.features.map((f, fi) => (
                                        <motion.li
                                            key={f}
                                            initial={{ opacity: 0, x: -8 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{
                                                delay: 0.1 * fi,
                                                duration: 0.3,
                                            }}
                                            className="flex items-start gap-3"
                                        >
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <span>{f}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                                <div className="mt-auto">
                                    <Link
                                        href="/apply"
                                        className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-dark hover:shadow-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                        Apply for {plan.name}
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    </Link>
                                </div>
                            </motion.div>
                        </ScrollReveal>
                    ))}
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Indicative figures — final monthly fee and deposit confirmed
                    after the product validation call. Prices in Naira.
                </p>
            </div>
        </section>
    );
}

function FeaturesSection({
    content,
}: {
    content: {
        items: {
            icon: string;
            title: string;
            description: string;
        }[];
    };
}) {
    return (
        <section className="border-t border-border/60 bg-surface-elevated">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
                <div className="grid gap-8 sm:grid-cols-3">
                    {content.items.map((f, i) => (
                        <ScrollReveal key={f.title} delay={i * 0.12}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="-mx-2 flex flex-col gap-4 rounded-2xl p-6 transition-colors hover:bg-primary-soft/50"
                            >
                                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                    {ICON_MAP[f.icon] ?? (
                                        <Zap className="h-6 w-6" />
                                    )}
                                </span>
                                <h3 className="font-display text-xl font-semibold">
                                    {f.title}
                                </h3>
                                <div
                                    className="text-sm leading-relaxed text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: f.description,
                                    }}
                                />
                            </motion.div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TestimonialsSection({
    content,
}: {
    content: {
        label: string;
        title: string;
        items: {
            quote: string;
            name: string;
            location: string;
        }[];
    };
}) {
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => {
        setCurrent((p) => (p + 1) % content.items.length);
    }, [content.items.length]);

    useEffect(() => {
        const t = setInterval(next, 5000);

        return () => clearInterval(t);
    }, [next]);

    return (
        <section className="border-t border-border/60 bg-surface">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
                <ScrollReveal>
                    <div className="mx-auto mb-12 max-w-2xl text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            {content.label}
                        </p>
                        <h2 className="mt-3 font-display text-[clamp(1.75rem,3vw+0.5rem,3rem)] leading-[1.1] font-semibold">
                            {content.title}
                        </h2>
                    </div>
                </ScrollReveal>

                <div className="relative mx-auto max-w-2xl">
                    <div className="relative h-48 sm:h-40">
                        <AnimatePresence mode="wait">
                            <motion.blockquote
                                key={current}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{
                                    duration: 0.35,
                                    ease: 'easeInOut',
                                }}
                                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                            >
                                <div
                                    className="mb-4 font-display text-xl leading-snug font-medium text-foreground sm:text-2xl"
                                    dangerouslySetInnerHTML={{
                                        __html: `&ldquo;${content.items[current].quote}&rdquo;`,
                                    }}
                                />
                                <cite className="not-italic">
                                    <span className="text-sm font-medium text-foreground">
                                        {content.items[current].name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {' '}
                                        &middot;{' '}
                                        {content.items[current].location}
                                    </span>
                                </cite>
                            </motion.blockquote>
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2">
                        {content.items.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    i === current
                                        ? 'w-6 bg-primary'
                                        : 'w-2 bg-border hover:bg-muted-foreground/30'
                                }`}
                                aria-label={`Go to testimonial ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function FAQSection({
    content,
}: {
    content: {
        title: string;
        items: { question: string; answer: string }[];
    };
}) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer.replace(/<[^>]*>/g, ''),
            },
        })),
    };

    return (
        <section id="faq" className="border-t border-border/60">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            ></script>
            <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
                <ScrollReveal>
                    <h2 className="mb-12 text-center font-display text-[clamp(1.75rem,3vw+0.5rem,3rem)] leading-[1.1] font-semibold">
                        {content.title}
                    </h2>
                </ScrollReveal>
                <div className="divide-y divide-border rounded-xl border border-border/60">
                    {content.items.map((faq, i) => (
                        <div key={i}>
                            <button
                                onClick={() =>
                                    setOpenIndex(openIndex === i ? null : i)
                                }
                                className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-medium transition-colors hover:bg-muted/50"
                            >
                                <span>{faq.question}</span>
                                <motion.span
                                    animate={{
                                        rotate: openIndex === i ? 45 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="ml-4 shrink-0 text-lg"
                                >
                                    +
                                </motion.span>
                            </button>
                            <AnimatePresence initial={false}>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            duration: 0.25,
                                            ease: 'easeInOut',
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div
                                            className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground"
                                            dangerouslySetInnerHTML={{
                                                __html: faq.answer,
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTASection({
    content,
}: {
    content: {
        headline: string;
        description: string;
        buttons: { text: string; href: string }[];
    };
}) {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark">
            <div className="noise absolute inset-0" />
            <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
                <ScrollReveal>
                    <h2 className="font-display text-[clamp(1.75rem,3vw+0.5rem,3rem)] leading-[1.1] font-semibold text-white">
                        {content.headline}
                    </h2>
                    <div
                        className="mt-4 text-lg text-white/80"
                        dangerouslySetInnerHTML={{
                            __html: content.description,
                        }}
                    />
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        {content.buttons?.map((btn, i) =>
                            btn.href.startsWith('/') ? (
                                <Link
                                    key={i}
                                    href={btn.href}
                                    className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-8 py-2 text-sm font-medium whitespace-nowrap text-primary shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 hover:shadow-xl active:scale-[0.98]"
                                >
                                    {btn.text}
                                    {i === 0 && (
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    )}
                                </Link>
                            ) : (
                                <a
                                    key={i}
                                    href={btn.href}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/30 px-6 py-2 text-sm font-medium whitespace-nowrap text-white transition-all duration-300 hover:bg-white/10"
                                >
                                    {btn.text}
                                </a>
                            ),
                        )}
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}

export default function Welcome() {
    const { siteContent } = usePage().props as unknown as {
        siteContent: Record<string, unknown>;
    };

    const hero = siteContent.hero as {
        badge: string;
        headline1: string;
        headline2: string;
        description: string;
        deposit: string;
        buttons: { text: string; href: string }[];
        liveOutput: string;
    };
    const stats = siteContent.stats as {
        items: {
            label: string;
            value: number;
            prefix: string;
            suffix: string;
        }[];
    };
    const howItWorks = siteContent.how_it_works as {
        label: string;
        title: string;
        steps: { icon: string; title: string; description: string }[];
    };
    const pricing = siteContent.pricing as {
        label: string;
        title: string;
        description: string;
        plans: {
            name: string;
            price: string;
            deposit: string;
            badge: string | null;
            features: string[];
        }[];
    };
    const features = siteContent.features as {
        items: { icon: string; title: string; description: string }[];
    };
    const testimonials = siteContent.testimonials as {
        label: string;
        title: string;
        items: { quote: string; name: string; location: string }[];
    };
    const faq = siteContent.faq as {
        title: string;
        items: { question: string; answer: string }[];
    };
    const cta = siteContent.cta as {
        headline: string;
        description: string;
        buttons: { text: string; href: string }[];
    };

    return (
        <>
            <Head title="Solar in 48 hours, approved in 10 minutes">
                <meta
                    name="description"
                    content="Solar-as-a-service for Nigerian homes and SMEs. No upfront cost, no diesel, no blackouts. Apply in 10 minutes, installed in 48 hours."
                />
                <meta
                    property="og:title"
                    content="AlwaysON — Solar in 48 hours, approved in 10 minutes"
                />
                <meta
                    property="og:description"
                    content="Solar-as-a-service for Nigerian homes and SMEs. No upfront cost, no diesel, no blackouts. Apply in 10 minutes, installed in 48 hours."
                />
            </Head>
            <div className="flex min-h-screen flex-col">
                <MarketingHeader />
                <main className="flex-1">
                    <HeroSection content={hero} />
                    <StatsBar items={stats.items} />
                    <HowItWorks content={howItWorks} />
                    <TestimonialsSection content={testimonials} />
                    <PricingSection content={pricing} />
                    <FeaturesSection content={features} />
                    <FAQSection content={faq} />
                    <CTASection content={cta} />
                </main>
                <MarketingFooter siteContent={siteContent} />
            </div>
        </>
    );
}

import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#b8322a] lg:flex lg:flex-col lg:justify-between lg:p-12"
            >
                <div className="noise absolute inset-0 opacity-30" />
                <div className="relative z-10">
                    <Link href="/">
                        <img
                            src="/assets/logo-white.png"
                            alt="AlwaysON"
                            className="h-8 w-auto"
                        />
                    </Link>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="relative z-10 max-w-md"
                >
                    <h2 className="font-display text-3xl leading-tight font-semibold text-white">
                        &ldquo;We were approved in seven minutes. Engineers
                        arrived the next morning.&rdquo;
                    </h2>
                    <p className="mt-4 text-sm text-white/70">
                        &mdash; Tunde, Lekki Phase 1
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative z-10 text-xs text-white/50"
                >
                    &copy; AlwaysON &middot; NDPR compliant
                </motion.div>
            </motion.div>

            <div className="flex items-center justify-center p-6 sm:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-md"
                >
                    <Link
                        href="/"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        &larr; Back to home
                    </Link>
                    <h1 className="mt-4 font-display text-2xl font-semibold">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                    <div className="mt-6">{children}</div>
                </motion.div>
            </div>
        </div>
    );
}

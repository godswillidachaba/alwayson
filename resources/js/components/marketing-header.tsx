import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const navLinks = [
    { to: '/#how', label: 'How it works' },
    { to: '/#pricing', label: 'Pricing' },
    { to: '/#faq', label: 'FAQ' },
];

function NavLinks({
    mobile = false,
    onClick,
    scrolled,
}: {
    mobile?: boolean;
    onClick?: () => void;
    scrolled: boolean;
}) {
    return (
        <>
            {navLinks.map((link) => (
                <a
                    key={link.to}
                    href={link.to}
                    onClick={onClick}
                    className={`relative transition-colors ${
                        scrolled || mobile
                            ? 'text-muted-foreground hover:text-foreground'
                            : 'text-white/80 hover:text-white'
                    } ${
                        mobile ? 'py-2 text-lg' : 'text-sm'
                    } after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full`}
                >
                    {link.label}
                </a>
            ))}
        </>
    );
}

export default function MarketingHeader({
    forceScrolled = false,
}: {
    forceScrolled?: boolean;
}) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (forceScrolled) {
            return;
        }

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, [forceScrolled]);

    const effectiveScrolled = forceScrolled || scrolled;

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    return (
        <header
            className={`fixed top-0 z-50 w-full transition-all duration-500 ${
                effectiveScrolled
                    ? 'bg-background/85 shadow-sm backdrop-blur-xl'
                    : 'bg-transparent'
            }`}
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link href="/" className="flex items-center">
                    <img
                        src={
                            effectiveScrolled
                                ? '/assets/logo-horizontal.png'
                                : '/assets/logo-white.png'
                        }
                        alt="AlwaysON"
                        className="h-8 w-auto transition-opacity duration-300"
                    />
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    <NavLinks scrolled={effectiveScrolled} />
                </nav>

                <div className="hidden items-center gap-4 md:flex">
                    <Link
                        href="/login"
                        className={`text-sm font-medium transition-colors ${
                            effectiveScrolled
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/apply"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-primary-dark hover:shadow-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                        Apply now
                    </Link>
                </div>

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="relative z-50 flex h-9 w-9 items-center justify-center md:hidden"
                    aria-label="Toggle menu"
                >
                    <div className="flex flex-col gap-1.5">
                        <motion.span
                            animate={
                                menuOpen
                                    ? { rotate: 45, y: 5.5 }
                                    : { rotate: 0, y: 0 }
                            }
                            className={`block h-[2px] w-5 transition-colors ${
                                effectiveScrolled || menuOpen
                                    ? 'bg-foreground'
                                    : 'bg-white'
                            }`}
                        />
                        <motion.span
                            animate={
                                menuOpen
                                    ? { opacity: 0, x: -8 }
                                    : { opacity: 1, x: 0 }
                            }
                            className={`block h-[2px] w-5 transition-colors ${
                                effectiveScrolled || menuOpen
                                    ? 'bg-foreground'
                                    : 'bg-white'
                            }`}
                        />
                        <motion.span
                            animate={
                                menuOpen
                                    ? { rotate: -45, y: -5.5 }
                                    : { rotate: 0, y: 0 }
                            }
                            className={`block h-[2px] w-5 transition-colors ${
                                effectiveScrolled || menuOpen
                                    ? 'bg-foreground'
                                    : 'bg-white'
                            }`}
                        />
                    </div>
                </button>
            </div>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 md:hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setMenuOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -24 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute top-20 right-4 left-4 rounded-2xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur-xl"
                        >
                            <nav className="flex flex-col items-center gap-4">
                                {navLinks.map((link, i) => (
                                    <motion.a
                                        key={link.to}
                                        href={link.to}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -16 }}
                                        transition={{
                                            delay: i * 0.05,
                                            duration: 0.25,
                                            ease: 'easeOut',
                                        }}
                                        onClick={() => setMenuOpen(false)}
                                        className="relative w-full py-2 text-center text-lg text-muted-foreground transition-colors after:absolute after:-bottom-0.5 after:left-1/4 after:h-[2px] after:w-1/2 after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100"
                                    >
                                        {link.label}
                                    </motion.a>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{
                                        delay: navLinks.length * 0.05,
                                        duration: 0.25,
                                        ease: 'easeOut',
                                    }}
                                    className="w-full"
                                >
                                    <Link
                                        href="/login"
                                        className="block w-full py-2 text-center text-lg text-muted-foreground transition-colors hover:text-foreground"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Sign in
                                    </Link>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{
                                        delay: navLinks.length * 0.05,
                                        duration: 0.25,
                                        ease: 'easeOut',
                                    }}
                                    className="w-full"
                                >
                                    <Link
                                        href="/apply"
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-dark"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Apply now
                                    </Link>
                                </motion.div>
                            </nav>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CounterProps {
    from?: number;
    to: number;
    suffix?: string;
    prefix?: string;
    decimals?: number;
    duration?: number;
}

export default function Counter({
    from = 0,
    to,
    suffix = '',
    prefix = '',
    decimals = 0,
    duration = 2,
}: CounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const [val, setVal] = useState(from);
    const started = useRef(false);

    useEffect(() => {
        if (!inView || started.current) {
            return;
        }

        started.current = true;

        const startTime = performance.now();
        const animate = (now: number) => {
            const elapsed = (now - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(from + (to - from) * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [inView, from, to, duration]);

    return (
        <span ref={ref}>
            {prefix}
            {val.toFixed(decimals)}
            {suffix}
        </span>
    );
}

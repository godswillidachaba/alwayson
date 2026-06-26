import { useAppearance } from '@/hooks/use-appearance';

export default function AppLogo() {
    const { resolvedAppearance } = useAppearance();

    return (
        <img
            src={
                resolvedAppearance === 'dark'
                    ? '/assets/logo-white.png'
                    : '/assets/logo-horizontal.png'
            }
            alt="AlwaysON"
            className="h-8 w-auto"
        />
    );
}

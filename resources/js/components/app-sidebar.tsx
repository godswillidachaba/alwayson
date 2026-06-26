import { Link, usePage } from '@inertiajs/react';
import {
    CreditCard,
    FileText,
    LayoutGrid,
    Palette,
    ShieldCheck,
    Users,
    Wrench,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import { application, verification } from '@/routes/dashboard';
import { payments as customerPayments } from '@/routes/dashboard/customer';
import type { NavItem } from '@/types';

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    if (items.length === 0) {
        return null;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={item.isActive ?? isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function useNavGroups(): { label: string; items: NavItem[] }[] {
    const { auth } = usePage().props;
    const role = auth.user?.role ?? 'customer';

    if (role === 'super_admin') {
        return [
            {
                label: 'Platform',
                items: [
                    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
                    {
                        title: 'Applications',
                        href: '/dashboard/applications',
                        icon: FileText,
                    },
                    {
                        title: 'Payments',
                        href: '/dashboard/payments',
                        icon: CreditCard,
                    },
                    { title: 'Users', href: '/dashboard/users', icon: Users },
                    {
                        title: 'Site Settings',
                        href: '/dashboard/site',
                        icon: Palette,
                    },
                ],
            },
        ];
    }

    if (role === 'sales' || role === 'operations') {
        return [
            {
                label: 'Platform',
                items: [
                    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
                    {
                        title: 'KYC Review',
                        href: '/dashboard/applications',
                        icon: ShieldCheck,
                    },
                ],
            },
        ];
    }

    if (role === 'installer') {
        return [
            {
                label: 'Platform',
                items: [
                    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
                    { title: 'My Tickets', href: dashboard(), icon: Wrench },
                ],
            },
        ];
    }

    return [
        {
            label: 'Overview',
            items: [
                { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
            ],
        },
        {
            label: 'My Application',
            items: [
                {
                    title: 'Application Details',
                    href: application(),
                    icon: FileText,
                },
                {
                    title: 'Verification',
                    href: verification(),
                    icon: ShieldCheck,
                },
            ],
        },
        {
            label: 'Billing',
            items: [
                {
                    title: 'Payments & Lease',
                    href: customerPayments(),
                    icon: CreditCard,
                },
            ],
        },
    ];
}

export function AppSidebar() {
    const groups = useNavGroups();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <NavGroup
                        key={group.label}
                        label={group.label}
                        items={group.items}
                    />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

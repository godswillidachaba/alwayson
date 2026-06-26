import { Head, router, usePage } from '@inertiajs/react';
import {
    Check,
    Clock,
    Home,
    Leaf,
    Plus,
    Shield,
    Sun,
    Trash2,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RichEditor } from '@/components/rich-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

const ICONS: Record<string, React.ReactNode> = {
    sun: <Sun className="h-5 w-5" />,
    check: <Check className="h-5 w-5" />,
    zap: <Zap className="h-5 w-5" />,
    clock: <Clock className="h-5 w-5" />,
    battery: <Zap className="h-5 w-5" />,
    home: <Home className="h-5 w-5" />,
    leaf: <Leaf className="h-5 w-5" />,
    shield: <Shield className="h-5 w-5" />,
};

const SECTION_LABELS: Record<string, string> = {
    hero: 'Hero',
    stats: 'Stats Bar',
    how_it_works: 'How It Works',
    pricing: 'Pricing Plans',
    features: 'Features',
    testimonials: 'Testimonials',
    faq: 'FAQ',
    cta: 'Call to Action',
    social: 'Social Media',
};

const SOCIAL_PLATFORMS = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'X (Twitter)' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
];

const SOCIAL_ICONS: Record<string, string> = {
    linkedin:
        'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    instagram:
        'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    twitter:
        'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    facebook:
        'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    youtube:
        'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
};

function IconPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-40">
                <SelectValue>
                    <span className="flex items-center gap-2">
                        {ICONS[value] ?? <Sun className="h-4 w-4" />}
                        <span className="capitalize">{value || 'sun'}</span>
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {Object.keys(ICONS).map((key) => (
                    <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                            {ICONS[key]}
                            <span className="capitalize">{key}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default function AdminSite() {
    const { sections } = usePage().props as unknown as {
        sections: Record<string, unknown>;
    };

    const [activeSection, setActiveSection] = useState<string>('hero');
    const [data, setData] = useState<Record<string, unknown>>(() =>
        structuredClone(sections),
    );

    const hasChanges = useMemo(
        () => JSON.stringify(data) !== JSON.stringify(sections),
        [data, sections],
    );

    function update(path: string, value: unknown) {
        setData((prev) => {
            const next = structuredClone(prev);
            const keys = path.split('.');
            let obj = next[activeSection] as Record<string, unknown>;

            for (let i = 0; i < keys.length - 1; i++) {
                obj = obj[keys[i]] as Record<string, unknown>;
            }

            obj[keys[keys.length - 1]] = value;

            return next;
        });
    }

    function handleSave() {
        const payload = Object.entries(data).map(([section, content]) => ({
            section,
            content: JSON.parse(JSON.stringify(content)),
        }));

        router.put(
            '/dashboard/site',
            { sections: payload as never },
            {
                onSuccess: () => {
                    toast.success('Site content saved.');
                },
                onError: () => {
                    toast.error('Failed to save.');
                },
            },
        );
    }

    const section = data[activeSection] as Record<string, unknown> | undefined;

    return (
        <>
            <Head title="Site Settings" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Site Settings</h1>
                        <p className="text-muted-foreground">
                            Edit landing page content
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={!hasChanges}>
                        {hasChanges ? 'Save Changes' : 'Saved'}
                    </Button>
                </div>

                <div className="flex gap-6">
                    <div className="w-56 shrink-0 space-y-1">
                        {Object.entries(SECTION_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className={cn(
                                    'w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                                    activeSection === key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 space-y-6">
                        {activeSection === 'hero' && section && (
                            <SectionEditor
                                title="Hero Section"
                                fields={[
                                    {
                                        label: 'Badge',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.badge as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'badge',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Headline 1',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.headline1 as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'headline1',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Headline 2',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.headline2 as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'headline2',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Description',
                                        render: (
                                            <RichEditor
                                                content={
                                                    (section.description as string) ??
                                                    ''
                                                }
                                                onChange={(val) =>
                                                    update('description', val)
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Deposit text',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.deposit as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'deposit',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Live output label',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.liveOutput as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'liveOutput',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Buttons',
                                        render: (
                                            <div className="space-y-3">
                                                {(
                                                    (section.buttons as {
                                                        text: string;
                                                        href: string;
                                                    }[]) ?? []
                                                ).map((btn, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex gap-2"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={btn.text}
                                                            onChange={(e) => {
                                                                const b = [
                                                                    ...((section.buttons as {
                                                                        text: string;
                                                                        href: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                b[i] = {
                                                                    ...b[i],
                                                                    text: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'buttons',
                                                                    b,
                                                                );
                                                            }}
                                                            placeholder="Button text"
                                                            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={btn.href}
                                                            onChange={(e) => {
                                                                const b = [
                                                                    ...((section.buttons as {
                                                                        text: string;
                                                                        href: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                b[i] = {
                                                                    ...b[i],
                                                                    href: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'buttons',
                                                                    b,
                                                                );
                                                            }}
                                                            placeholder="/link"
                                                            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'stats' && section && (
                            <SectionEditor
                                title="Stats Bar (fixed 4 items)"
                                fields={[
                                    {
                                        label: '',
                                        render: (
                                            <div className="grid grid-cols-4 gap-3 text-sm font-medium text-muted-foreground">
                                                <span>Label</span>
                                                <span>Value</span>
                                                <span>Prefix</span>
                                                <span>Suffix</span>
                                                {(
                                                    (section.items as {
                                                        label: string;
                                                        value: number;
                                                        prefix: string;
                                                        suffix: string;
                                                    }[]) ?? []
                                                ).map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="contents"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={item.label}
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        label: string;
                                                                        value: number;
                                                                        prefix: string;
                                                                        suffix: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    label: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={item.value}
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        label: string;
                                                                        value: number;
                                                                        prefix: string;
                                                                        suffix: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    value: Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={item.prefix}
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        label: string;
                                                                        value: number;
                                                                        prefix: string;
                                                                        suffix: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    prefix: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={item.suffix}
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        label: string;
                                                                        value: number;
                                                                        prefix: string;
                                                                        suffix: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    suffix: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'how_it_works' && section && (
                            <SectionEditor
                                title="How It Works"
                                fields={[
                                    {
                                        label: 'Section label',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.label as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'label',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Section title',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.title as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'title',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Steps',
                                        render: (
                                            <ArrayEditor
                                                items={
                                                    (section.steps as {
                                                        icon: string;
                                                        title: string;
                                                        description: string;
                                                    }[]) ?? []
                                                }
                                                onAdd={() => {
                                                    const steps = [
                                                        ...((section.steps as {
                                                            icon: string;
                                                            title: string;
                                                            description: string;
                                                        }[]) ?? []),
                                                        {
                                                            icon: 'sun',
                                                            title: '',
                                                            description: '',
                                                        },
                                                    ];
                                                    update('steps', steps);
                                                }}
                                                onRemove={(i) => {
                                                    const steps = [
                                                        ...((section.steps as {
                                                            icon: string;
                                                            title: string;
                                                            description: string;
                                                        }[]) ?? []),
                                                    ];
                                                    steps.splice(i, 1);
                                                    update('steps', steps);
                                                }}
                                                renderItem={(item, i) => (
                                                    <div className="space-y-3 rounded-lg border p-4">
                                                        <div className="flex items-center gap-2">
                                                            <IconPicker
                                                                value={
                                                                    item.icon
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) => {
                                                                    const steps =
                                                                        [
                                                                            ...((section.steps as {
                                                                                icon: string;
                                                                                title: string;
                                                                                description: string;
                                                                            }[]) ??
                                                                                []),
                                                                        ];
                                                                    steps[i] = {
                                                                        ...steps[
                                                                            i
                                                                        ],
                                                                        icon: val,
                                                                    };
                                                                    update(
                                                                        'steps',
                                                                        steps,
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.title ?? ''
                                                            }
                                                            onChange={(e) => {
                                                                const steps = [
                                                                    ...((section.steps as {
                                                                        icon: string;
                                                                        title: string;
                                                                        description: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                steps[i] = {
                                                                    ...steps[i],
                                                                    title: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'steps',
                                                                    steps,
                                                                );
                                                            }}
                                                            placeholder="Step title"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <RichEditor
                                                            content={
                                                                item.description ??
                                                                ''
                                                            }
                                                            onChange={(val) => {
                                                                const steps = [
                                                                    ...((section.steps as {
                                                                        icon: string;
                                                                        title: string;
                                                                        description: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                steps[i] = {
                                                                    ...steps[i],
                                                                    description:
                                                                        val,
                                                                };
                                                                update(
                                                                    'steps',
                                                                    steps,
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'pricing' && section && (
                            <SectionEditor
                                title="Pricing Plans"
                                fields={[
                                    {
                                        label: 'Section label',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.label as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'label',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Section title',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.title as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'title',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Description',
                                        render: (
                                            <RichEditor
                                                content={
                                                    (section.description as string) ??
                                                    ''
                                                }
                                                onChange={(val) =>
                                                    update('description', val)
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Plans',
                                        render: (
                                            <ArrayEditor
                                                items={
                                                    (section.plans as {
                                                        name: string;
                                                        price: string;
                                                        deposit: string;
                                                        badge: string | null;
                                                        features: string[];
                                                    }[]) ?? []
                                                }
                                                onAdd={() => {
                                                    const plans = [
                                                        ...((section.plans as {
                                                            name: string;
                                                            price: string;
                                                            deposit: string;
                                                            badge:
                                                                | string
                                                                | null;
                                                            features: string[];
                                                        }[]) ?? []),
                                                        {
                                                            name: '',
                                                            price: '',
                                                            deposit: '',
                                                            badge: null,
                                                            features: [],
                                                        },
                                                    ];
                                                    update('plans', plans);
                                                }}
                                                onRemove={(i) => {
                                                    const plans = [
                                                        ...((section.plans as {
                                                            name: string;
                                                            price: string;
                                                            deposit: string;
                                                            badge:
                                                                | string
                                                                | null;
                                                            features: string[];
                                                        }[]) ?? []),
                                                    ];
                                                    plans.splice(i, 1);
                                                    update('plans', plans);
                                                }}
                                                renderItem={(plan, i) => (
                                                    <div className="space-y-3 rounded-lg border p-4">
                                                        <input
                                                            type="text"
                                                            value={
                                                                plan.name ?? ''
                                                            }
                                                            onChange={(e) => {
                                                                const plans = [
                                                                    ...((section.plans as {
                                                                        name: string;
                                                                        price: string;
                                                                        deposit: string;
                                                                        badge:
                                                                            | string
                                                                            | null;
                                                                        features: string[];
                                                                    }[]) ?? []),
                                                                ];
                                                                plans[i] = {
                                                                    ...plans[i],
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'plans',
                                                                    plans,
                                                                );
                                                            }}
                                                            placeholder="Plan name"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    plan.price ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const plans =
                                                                        [
                                                                            ...((section.plans as {
                                                                                name: string;
                                                                                price: string;
                                                                                deposit: string;
                                                                                badge:
                                                                                    | string
                                                                                    | null;
                                                                                features: string[];
                                                                            }[]) ??
                                                                                []),
                                                                        ];
                                                                    plans[i] = {
                                                                        ...plans[
                                                                            i
                                                                        ],
                                                                        price: e
                                                                            .target
                                                                            .value,
                                                                    };
                                                                    update(
                                                                        'plans',
                                                                        plans,
                                                                    );
                                                                }}
                                                                placeholder="Price (₦35,000/mo)"
                                                                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={
                                                                    plan.deposit ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const plans =
                                                                        [
                                                                            ...((section.plans as {
                                                                                name: string;
                                                                                price: string;
                                                                                deposit: string;
                                                                                badge:
                                                                                    | string
                                                                                    | null;
                                                                                features: string[];
                                                                            }[]) ??
                                                                                []),
                                                                        ];
                                                                    plans[i] = {
                                                                        ...plans[
                                                                            i
                                                                        ],
                                                                        deposit:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    };
                                                                    update(
                                                                        'plans',
                                                                        plans,
                                                                    );
                                                                }}
                                                                placeholder="Deposit from ₦75,000"
                                                                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={
                                                                plan.badge ?? ''
                                                            }
                                                            onChange={(e) => {
                                                                const plans = [
                                                                    ...((section.plans as {
                                                                        name: string;
                                                                        price: string;
                                                                        deposit: string;
                                                                        badge:
                                                                            | string
                                                                            | null;
                                                                        features: string[];
                                                                    }[]) ?? []),
                                                                ];
                                                                plans[i] = {
                                                                    ...plans[i],
                                                                    badge:
                                                                        e.target
                                                                            .value ||
                                                                        null,
                                                                };
                                                                update(
                                                                    'plans',
                                                                    plans,
                                                                );
                                                            }}
                                                            placeholder="Badge (or leave empty)"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">
                                                                Features
                                                            </label>
                                                            {(
                                                                plan.features ??
                                                                []
                                                            ).map(
                                                                (feat, fi) => (
                                                                    <div
                                                                        key={fi}
                                                                        className="flex gap-2"
                                                                    >
                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                feat
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) => {
                                                                                const plans =
                                                                                    [
                                                                                        ...((section.plans as {
                                                                                            name: string;
                                                                                            price: string;
                                                                                            deposit: string;
                                                                                            badge:
                                                                                                | string
                                                                                                | null;
                                                                                            features: string[];
                                                                                        }[]) ??
                                                                                            []),
                                                                                    ];
                                                                                const f =
                                                                                    [
                                                                                        ...(plans[
                                                                                            i
                                                                                        ]
                                                                                            .features ??
                                                                                            []),
                                                                                    ];
                                                                                f[
                                                                                    fi
                                                                                ] =
                                                                                    e.target.value;
                                                                                plans[
                                                                                    i
                                                                                ] =
                                                                                    {
                                                                                        ...plans[
                                                                                            i
                                                                                        ],
                                                                                        features:
                                                                                            f,
                                                                                    };
                                                                                update(
                                                                                    'plans',
                                                                                    plans,
                                                                                );
                                                                            }}
                                                                            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                        />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                const plans =
                                                                                    [
                                                                                        ...((section.plans as {
                                                                                            name: string;
                                                                                            price: string;
                                                                                            deposit: string;
                                                                                            badge:
                                                                                                | string
                                                                                                | null;
                                                                                            features: string[];
                                                                                        }[]) ??
                                                                                            []),
                                                                                    ];
                                                                                const f =
                                                                                    [
                                                                                        ...(plans[
                                                                                            i
                                                                                        ]
                                                                                            .features ??
                                                                                            []),
                                                                                    ];
                                                                                f.splice(
                                                                                    fi,
                                                                                    1,
                                                                                );
                                                                                plans[
                                                                                    i
                                                                                ] =
                                                                                    {
                                                                                        ...plans[
                                                                                            i
                                                                                        ],
                                                                                        features:
                                                                                            f,
                                                                                    };
                                                                                update(
                                                                                    'plans',
                                                                                    plans,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ),
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const plans =
                                                                        [
                                                                            ...((section.plans as {
                                                                                name: string;
                                                                                price: string;
                                                                                deposit: string;
                                                                                badge:
                                                                                    | string
                                                                                    | null;
                                                                                features: string[];
                                                                            }[]) ??
                                                                                []),
                                                                        ];
                                                                    plans[i] = {
                                                                        ...plans[
                                                                            i
                                                                        ],
                                                                        features:
                                                                            [
                                                                                ...(plans[
                                                                                    i
                                                                                ]
                                                                                    .features ??
                                                                                    []),
                                                                                '',
                                                                            ],
                                                                    };
                                                                    update(
                                                                        'plans',
                                                                        plans,
                                                                    );
                                                                }}
                                                            >
                                                                <Plus className="mr-1 h-4 w-4" />
                                                                Add feature
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'features' && section && (
                            <SectionEditor
                                title="Features"
                                fields={[
                                    {
                                        label: 'Feature cards',
                                        render: (
                                            <ArrayEditor
                                                items={
                                                    (section.items as {
                                                        icon: string;
                                                        title: string;
                                                        description: string;
                                                    }[]) ?? []
                                                }
                                                onAdd={() => {
                                                    const items = [
                                                        ...((section.items as {
                                                            icon: string;
                                                            title: string;
                                                            description: string;
                                                        }[]) ?? []),
                                                        {
                                                            icon: 'zap',
                                                            title: '',
                                                            description: '',
                                                        },
                                                    ];
                                                    update('items', items);
                                                }}
                                                onRemove={(i) => {
                                                    const items = [
                                                        ...((section.items as {
                                                            icon: string;
                                                            title: string;
                                                            description: string;
                                                        }[]) ?? []),
                                                    ];
                                                    items.splice(i, 1);
                                                    update('items', items);
                                                }}
                                                renderItem={(item, i) => (
                                                    <div className="space-y-3 rounded-lg border p-4">
                                                        <IconPicker
                                                            value={item.icon}
                                                            onChange={(val) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        icon: string;
                                                                        title: string;
                                                                        description: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    icon: val,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.title ?? ''
                                                            }
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        icon: string;
                                                                        title: string;
                                                                        description: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    title: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            placeholder="Feature title"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <RichEditor
                                                            content={
                                                                item.description ??
                                                                ''
                                                            }
                                                            onChange={(val) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        icon: string;
                                                                        title: string;
                                                                        description: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    description:
                                                                        val,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'testimonials' && section && (
                            <SectionEditor
                                title="Testimonials"
                                fields={[
                                    {
                                        label: 'Section label',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.label as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'label',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Section title',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.title as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'title',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Testimonial cards',
                                        render: (
                                            <ArrayEditor
                                                items={
                                                    (section.items as {
                                                        quote: string;
                                                        name: string;
                                                        location: string;
                                                    }[]) ?? []
                                                }
                                                onAdd={() => {
                                                    const items = [
                                                        ...((section.items as {
                                                            quote: string;
                                                            name: string;
                                                            location: string;
                                                        }[]) ?? []),
                                                        {
                                                            quote: '',
                                                            name: '',
                                                            location: '',
                                                        },
                                                    ];
                                                    update('items', items);
                                                }}
                                                onRemove={(i) => {
                                                    const items = [
                                                        ...((section.items as {
                                                            quote: string;
                                                            name: string;
                                                            location: string;
                                                        }[]) ?? []),
                                                    ];
                                                    items.splice(i, 1);
                                                    update('items', items);
                                                }}
                                                renderItem={(item, i) => (
                                                    <div className="space-y-3 rounded-lg border p-4">
                                                        <RichEditor
                                                            content={
                                                                item.quote ?? ''
                                                            }
                                                            onChange={(val) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        quote: string;
                                                                        name: string;
                                                                        location: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    quote: val,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.name ?? ''
                                                            }
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        quote: string;
                                                                        name: string;
                                                                        location: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            placeholder="Customer name"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.location ??
                                                                ''
                                                            }
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        quote: string;
                                                                        name: string;
                                                                        location: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    location:
                                                                        e.target
                                                                            .value,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            placeholder="Location"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                )}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'faq' && section && (
                            <SectionEditor
                                title="FAQ"
                                fields={[
                                    {
                                        label: 'Section title',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.title as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'title',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'FAQ items',
                                        render: (
                                            <ArrayEditor
                                                items={
                                                    (section.items as {
                                                        question: string;
                                                        answer: string;
                                                    }[]) ?? []
                                                }
                                                onAdd={() => {
                                                    const items = [
                                                        ...((section.items as {
                                                            question: string;
                                                            answer: string;
                                                        }[]) ?? []),
                                                        {
                                                            question: '',
                                                            answer: '',
                                                        },
                                                    ];
                                                    update('items', items);
                                                }}
                                                onRemove={(i) => {
                                                    const items = [
                                                        ...((section.items as {
                                                            question: string;
                                                            answer: string;
                                                        }[]) ?? []),
                                                    ];
                                                    items.splice(i, 1);
                                                    update('items', items);
                                                }}
                                                renderItem={(item, i) => (
                                                    <div className="space-y-3 rounded-lg border p-4">
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.question ??
                                                                ''
                                                            }
                                                            onChange={(e) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        question: string;
                                                                        answer: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    question:
                                                                        e.target
                                                                            .value,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            placeholder="Question"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <RichEditor
                                                            content={
                                                                item.answer ??
                                                                ''
                                                            }
                                                            onChange={(val) => {
                                                                const items = [
                                                                    ...((section.items as {
                                                                        question: string;
                                                                        answer: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                items[i] = {
                                                                    ...items[i],
                                                                    answer: val,
                                                                };
                                                                update(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'cta' && section && (
                            <SectionEditor
                                title="Call to Action"
                                fields={[
                                    {
                                        label: 'Headline',
                                        render: (
                                            <input
                                                type="text"
                                                value={
                                                    (section.headline as string) ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'headline',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Description',
                                        render: (
                                            <RichEditor
                                                content={
                                                    (section.description as string) ??
                                                    ''
                                                }
                                                onChange={(val) =>
                                                    update('description', val)
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Buttons',
                                        render: (
                                            <div className="space-y-3">
                                                {(
                                                    (section.buttons as {
                                                        text: string;
                                                        href: string;
                                                    }[]) ?? []
                                                ).map((btn, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex gap-2"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={btn.text}
                                                            onChange={(e) => {
                                                                const b = [
                                                                    ...((section.buttons as {
                                                                        text: string;
                                                                        href: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                b[i] = {
                                                                    ...b[i],
                                                                    text: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'buttons',
                                                                    b,
                                                                );
                                                            }}
                                                            placeholder="Button text"
                                                            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={btn.href}
                                                            onChange={(e) => {
                                                                const b = [
                                                                    ...((section.buttons as {
                                                                        text: string;
                                                                        href: string;
                                                                    }[]) ?? []),
                                                                ];
                                                                b[i] = {
                                                                    ...b[i],
                                                                    href: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                update(
                                                                    'buttons',
                                                                    b,
                                                                );
                                                            }}
                                                            placeholder="/link"
                                                            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {activeSection === 'social' && section && (
                            <SectionEditor
                                title="Social Media"
                                fields={[
                                    {
                                        label: 'Links',
                                        render: (
                                            <ArrayEditor
                                                items={
                                                    (section.links as {
                                                        platform: string;
                                                        url: string;
                                                        visible: boolean;
                                                    }[]) ?? []
                                                }
                                                onAdd={() => {
                                                    const links = [
                                                        ...((section.links as {
                                                            platform: string;
                                                            url: string;
                                                            visible: boolean;
                                                        }[]) ?? []),
                                                        {
                                                            platform: '',
                                                            url: '',
                                                            visible: true,
                                                        },
                                                    ];
                                                    update('links', links);
                                                }}
                                                onRemove={(i) => {
                                                    const links = [
                                                        ...((section.links as {
                                                            platform: string;
                                                            url: string;
                                                            visible: boolean;
                                                        }[]) ?? []),
                                                    ];
                                                    links.splice(i, 1);
                                                    update('links', links);
                                                }}
                                                renderItem={(link, i) => (
                                                    <div className="space-y-3 rounded-lg border p-4">
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 space-y-1">
                                                                <label className="text-xs font-medium">
                                                                    Platform
                                                                </label>
                                                                <Select
                                                                    value={
                                                                        link.platform
                                                                    }
                                                                    onValueChange={(
                                                                        val,
                                                                    ) => {
                                                                        const links =
                                                                            [
                                                                                ...((section.links as {
                                                                                    platform: string;
                                                                                    url: string;
                                                                                    visible: boolean;
                                                                                }[]) ??
                                                                                    []),
                                                                            ];
                                                                        links[
                                                                            i
                                                                        ] = {
                                                                            ...links[
                                                                                i
                                                                            ],
                                                                            platform:
                                                                                val,
                                                                        };
                                                                        update(
                                                                            'links',
                                                                            links,
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue>
                                                                            {link.platform ? (
                                                                                <span className="flex items-center gap-2">
                                                                                    <svg
                                                                                        viewBox="0 0 24 24"
                                                                                        className="h-4 w-4"
                                                                                        fill="currentColor"
                                                                                    >
                                                                                        <path
                                                                                            d={
                                                                                                SOCIAL_ICONS[
                                                                                                    link
                                                                                                        .platform
                                                                                                ] ??
                                                                                                ''
                                                                                            }
                                                                                        />
                                                                                    </svg>
                                                                                    <span className="capitalize">
                                                                                        {SOCIAL_PLATFORMS.find(
                                                                                            (
                                                                                                p,
                                                                                            ) =>
                                                                                                p.value ===
                                                                                                link.platform,
                                                                                        )
                                                                                            ?.label ??
                                                                                            link.platform}
                                                                                    </span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">
                                                                                    Select
                                                                                    platform
                                                                                </span>
                                                                            )}
                                                                        </SelectValue>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {SOCIAL_PLATFORMS.map(
                                                                            (
                                                                                p,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        p.value
                                                                                    }
                                                                                    value={
                                                                                        p.value
                                                                                    }
                                                                                >
                                                                                    <span className="flex items-center gap-2">
                                                                                        <svg
                                                                                            viewBox="0 0 24 24"
                                                                                            className="h-4 w-4"
                                                                                            fill="currentColor"
                                                                                        >
                                                                                            <path
                                                                                                d={
                                                                                                    SOCIAL_ICONS[
                                                                                                        p
                                                                                                            .value
                                                                                                    ]
                                                                                                }
                                                                                            />
                                                                                        </svg>
                                                                                        {
                                                                                            p.label
                                                                                        }
                                                                                    </span>
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <label className="text-xs font-medium">
                                                                    URL
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        link.url
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const links =
                                                                            [
                                                                                ...((section.links as {
                                                                                    platform: string;
                                                                                    url: string;
                                                                                    visible: boolean;
                                                                                }[]) ??
                                                                                    []),
                                                                            ];
                                                                        links[
                                                                            i
                                                                        ] = {
                                                                            ...links[
                                                                                i
                                                                            ],
                                                                            url: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                        update(
                                                                            'links',
                                                                            links,
                                                                        );
                                                                    }}
                                                                    placeholder="https://linkedin.com/..."
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                />
                                                            </div>
                                                            <div className="flex items-end pb-2">
                                                                <label className="flex items-center gap-2 text-sm">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            link.visible
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const links =
                                                                                [
                                                                                    ...((section.links as {
                                                                                        platform: string;
                                                                                        url: string;
                                                                                        visible: boolean;
                                                                                    }[]) ??
                                                                                        []),
                                                                                ];
                                                                            links[
                                                                                i
                                                                            ] =
                                                                                {
                                                                                    ...links[
                                                                                        i
                                                                                    ],
                                                                                    visible:
                                                                                        e
                                                                                            .target
                                                                                            .checked,
                                                                                };
                                                                            update(
                                                                                'links',
                                                                                links,
                                                                            );
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300"
                                                                    />
                                                                    Show
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

AdminSite.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Site Settings', href: '#' },
    ],
};

function SectionEditor({
    title,
    fields,
}: {
    title: string;
    fields: { label: string; render: React.ReactNode }[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {fields.map((field) => (
                    <div key={field.label}>
                        {field.label && (
                            <label className="mb-1.5 block text-sm font-medium">
                                {field.label}
                            </label>
                        )}
                        {field.render}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function ArrayEditor<T>({
    items,
    onAdd,
    onRemove,
    renderItem,
}: {
    items: T[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    renderItem: (item: T, index: number) => React.ReactNode;
}) {
    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className="group relative">
                    {renderItem(item, i)}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(i)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={onAdd}>
                <Plus className="mr-1 h-4 w-4" />
                Add item
            </Button>
        </div>
    );
}

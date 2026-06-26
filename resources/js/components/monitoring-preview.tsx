import { Battery, Sun, Zap } from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LocationData } from '@/types/application';

interface ApplianceItem {
    label: string;
    quantity: number;
    watts: number;
}

interface ApplicationData {
    id: number;
    status: string;
    plan: string | null;
    buildingType: string | null;
    appliances: ApplianceItem[] | Record<string, number>;
    totalLoadWatts: number | null;
    monthlyIncome: string | null;
    monthlyBill: string | null;
    monthlyGenerator: string | null;
    location: LocationData | null;
    submittedAt: string | null;
}

const generationData = [
    { time: '00:00', kW: 0 },
    { time: '02:00', kW: 0 },
    { time: '04:00', kW: 0 },
    { time: '06:00', kW: 0.3 },
    { time: '07:00', kW: 1.1 },
    { time: '08:00', kW: 1.8 },
    { time: '09:00', kW: 2.4 },
    { time: '10:00', kW: 2.9 },
    { time: '11:00', kW: 3.2 },
    { time: '12:00', kW: 3.1 },
    { time: '13:00', kW: 2.8 },
    { time: '14:00', kW: 2.4 },
    { time: '15:00', kW: 1.9 },
    { time: '16:00', kW: 1.2 },
    { time: '17:00', kW: 0.5 },
    { time: '18:00', kW: 0.1 },
    { time: '20:00', kW: 0 },
    { time: '22:00', kW: 0 },
];

const totalTodayKwh = generationData.reduce((sum, d) => sum + d.kW, 0);
const peakKw = 3.2;

const planMonthlyCost: Record<string, number> = {
    Starter: 35000,
    Masstige: 68000,
    Premium: 110000,
};

export default function MonitoringPreview({
    application,
}: {
    application: ApplicationData;
}) {
    const monthlyBill = parseInt(
        application.monthlyBill?.replace(/[^0-9]/g, '') ?? '0',
    );
    const monthlyGenerator = parseInt(
        application.monthlyGenerator?.replace(/[^0-9]/g, '') ?? '0',
    );
    const currentMonthlySpend = monthlyBill + monthlyGenerator;
    const planCost = application.plan
        ? (planMonthlyCost[application.plan] ?? 0)
        : 0;
    const monthlySavings =
        currentMonthlySpend > planCost ? currentMonthlySpend - planCost : 0;
    const dailyConsumptionKwh = application.totalLoadWatts
        ? ((application.totalLoadWatts * 8) / 1000).toFixed(1)
        : '—';

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="size-5 text-primary" />
                    Your System Preview
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* System health indicators */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface p-4">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <Sun className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground">
                                Solar generation
                            </div>
                            <div className="truncate text-lg font-bold tabular-nums">
                                {peakKw.toFixed(1)} kW
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400">
                                    Generating
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface p-4">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Battery className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground">
                                Battery
                            </div>
                            <div className="truncate text-lg font-bold tabular-nums">
                                78%
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{ width: '78%' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface p-4">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Zap className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground">
                                Inverter
                            </div>
                            <div className="truncate text-lg font-bold tabular-nums">
                                Online
                            </div>
                            <Badge
                                variant="default"
                                className="bg-green-500 text-xs"
                            >
                                97% efficiency
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Energy generation chart */}
                <div>
                    <div className="mb-3 flex items-baseline justify-between">
                        <h3 className="text-sm font-medium">
                            Today&apos;s energy generation
                        </h3>
                        <span className="text-sm text-muted-foreground">
                            {totalTodayKwh.toFixed(1)} kWh today
                        </span>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={generationData}>
                                <defs>
                                    <linearGradient
                                        id="solarGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="hsl(var(--primary))"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="hsl(var(--primary))"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={3}
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                    tickFormatter={(v: number) => `${v}kW`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        fontSize: '13px',
                                    }}
                                    formatter={(value) => [
                                        `${Number(value).toFixed(1)} kW`,
                                        'Generation',
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="kW"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fill="url(#solarGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Energy audit summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-surface p-4">
                        <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                            Energy Audit
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Total load
                                </span>
                                <span className="font-medium">
                                    {application.totalLoadWatts?.toLocaleString() ??
                                        '—'}
                                    W
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Est. daily consumption
                                </span>
                                <span className="font-medium">
                                    {dailyConsumptionKwh} kWh
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Recommended system
                                </span>
                                <span className="font-medium">
                                    {application.plan ?? '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-surface p-4">
                        <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                            Monthly Savings
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Current spend
                                </span>
                                <span className="font-medium">
                                    ₦{currentMonthlySpend.toLocaleString()}
                                </span>
                            </div>
                            {planCost > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        AlwaysON plan
                                    </span>
                                    <span className="font-medium">
                                        ₦{planCost.toLocaleString()}/mo
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-border/60 pt-2">
                                <span className="font-medium">
                                    Estimated savings
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    ₦{monthlySavings.toLocaleString()}/mo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Installation photo */}
                <div>
                    <h3 className="mb-3 text-sm font-medium">
                        Typical installation
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-border/60">
                        <picture>
                            <source
                                srcSet="/assets/hero-rooftop-thumb.webp"
                                type="image/webp"
                            />
                            <img
                                src="/assets/hero-rooftop-thumb.jpg"
                                alt="Solar panel installation"
                                className="w-full object-cover"
                                style={{ maxHeight: 280 }}
                            />
                        </picture>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                        Your installed system will look similar to this. Photos
                        of your actual installation will appear here once
                        complete.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

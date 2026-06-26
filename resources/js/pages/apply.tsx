import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Building,
    Check,
    Clock,
    Factory,
    Home,
    MapPin,
    Sun,
    Zap,
} from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import MarketingHeader from '@/components/marketing-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BillingAddress, LocationData } from '@/types/application';

const LocationPicker = lazy(() => import('@/components/location-picker'));

const steps = [
    'Your details',
    'Installation location',
    'Appliances',
    'Load summary',
    'Choose a system',
    'Cost comparison',
    'Confirm intent',
    'Create account',
];

const stepVariants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
};

const plans = [
    {
        name: 'Starter',
        price: '₦35,000/mo',
        deposit: 'Deposit from ₦75,000',
        features: [
            '3 × 190Wp panels',
            '3kW inverter',
            '5kWh battery',
            'Typical load 0–6 kWh/day',
            'Full install, maintenance & monitoring',
        ],
    },
    {
        name: 'Masstige',
        price: '₦68,000/mo',
        deposit: 'Deposit from ₦150,000',
        features: [
            '4 × 630Wp panels',
            '5kW inverter',
            '10kWh battery',
            'Typical load 6–12 kWh/day',
            'Full install, maintenance & monitoring',
        ],
    },
    {
        name: 'Premium',
        price: '₦110,000/mo',
        deposit: 'Deposit from ₦250,000',
        features: [
            '6 × 630Wp panels',
            '7.5kW inverter',
            '15kWh battery',
            'Typical load 12–25 kWh/day',
            'Full install, maintenance & monitoring',
        ],
    },
];

const residentialAppliances = [
    { key: 'fridge', label: 'Fridge / Freezer', watts: 150 },
    { key: 'ac', label: 'Air conditioner', watts: 1500 },
    { key: 'tv', label: 'TV / Home theatre', watts: 150 },
    { key: 'fan', label: 'Ceiling fan', watts: 75 },
    { key: 'lights', label: 'Light bulbs (per 10)', watts: 100 },
    { key: 'washing', label: 'Washing machine', watts: 500 },
    { key: 'microwave', label: 'Microwave', watts: 1000 },
    { key: 'iron', label: 'Electric iron', watts: 1000 },
    { key: 'waterPump', label: 'Water pump', watts: 750 },
    { key: 'other', label: 'Other devices', watts: 200 },
];

const commercialAppliances = [
    { key: 'fridge', label: 'Refrigeration / Freezer', watts: 500 },
    { key: 'cctv', label: 'CCTV system', watts: 200 },
    { key: 'pos', label: 'POS terminal', watts: 100 },
    { key: 'ac', label: 'Air conditioning unit', watts: 3000 },
    { key: 'lights', label: 'Lighting', watts: 500 },
    { key: 'machinery', label: 'Small machinery', watts: 2000 },
    { key: 'fan', label: 'Industrial fan', watts: 200 },
    { key: 'waterPump', label: 'Water pump', watts: 1500 },
    { key: 'other', label: 'Other equipment', watts: 500 },
];

const industrialAppliances = [
    { key: 'heavyMachine', label: 'Heavy machinery', watts: 5000 },
    { key: 'cctv', label: 'CCTV system', watts: 500 },
    { key: 'pos', label: 'POS terminal', watts: 100 },
    { key: 'ac', label: 'Industrial A/C', watts: 5000 },
    { key: 'lights', label: 'Workshop lighting', watts: 1000 },
    { key: 'refrigeration', label: 'Industrial refrigeration', watts: 3000 },
    { key: 'waterPump', label: 'Industrial water pump', watts: 3000 },
    { key: 'compressor', label: 'Air compressor', watts: 2000 },
    { key: 'other', label: 'Other equipment', watts: 1000 },
];

const NIGERIAN_STATES = [
    'FCT (Abuja)',
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
];

function getApplianceOptions(buildingType: string) {
    switch (buildingType) {
        case 'Commercial':
            return commercialAppliances;
        case 'Industrial':
            return industrialAppliances;
        default:
            return residentialAppliances;
    }
}

interface ApplyFormData {
    fullName: string;
    phone: string;
    email: string;
    location: LocationData | null;
    billingAddress: BillingAddress | null;
    buildingType: string;
    monthlySalary: string;
    monthlyBill: string;
    monthlyGenerator: string;
    ndpr: boolean;
    appliances: Record<string, number>;
    selectedPlan: string | null;
    password: string;
    confirmPassword: string;
    [key: string]: unknown;
}

function AnimatedStep({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function StepIndicator({
    steps,
    currentStep,
    onStepClick,
}: {
    steps: string[];
    currentStep: number;
    onStepClick: (i: number) => void;
}) {
    return (
        <div className="mt-8 mb-10 overflow-x-auto">
            <div className="flex w-fit rounded-lg border border-border/60 bg-surface p-1 text-sm shadow-sm">
                {steps.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;

                    return (
                        <div key={step} className="flex items-center">
                            <button
                                type="button"
                                onClick={() =>
                                    i < currentStep && onStepClick(i)
                                }
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap transition-all duration-300 ${
                                    active
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : done
                                          ? 'cursor-pointer text-foreground hover:bg-muted'
                                          : 'cursor-default text-muted-foreground'
                                }`}
                            >
                                {done ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <span className="text-xs">{i + 1}</span>
                                )}
                                <span className="hidden sm:inline">{step}</span>
                                <span className="sm:hidden">
                                    {step === 'Your details'
                                        ? 'Details'
                                        : `Step ${i + 1}`}
                                </span>
                            </button>
                            {i < steps.length - 1 && (
                                <span
                                    className={`mx-2 ${done ? 'text-primary' : 'text-muted-foreground/40'}`}
                                >
                                    &middot;
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ServerErrorBanner() {
    const errors = usePage().props.errors as Record<string, string | string[]>;
    const messages = Object.values(errors).flat();

    if (messages.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
                We couldn&apos;t create your account. Please fix the errors
                below and try again.
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-destructive/80">
                {messages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                ))}
            </ul>
        </div>
    );
}

export default function Apply() {
    const [currentStep, setCurrentStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<ApplyFormData>(() => ({
        fullName: '',
        phone: '',
        email: '',
        location: null,
        billingAddress: null,
        buildingType: '',
        monthlySalary: '',
        monthlyBill: '',
        monthlyGenerator: '',
        ndpr: false,
        appliances: Object.fromEntries(
            getApplianceOptions('').map((a) => [a.key, 0]),
        ),
        selectedPlan: null,
        password: '',
        confirmPassword: '',
    }));

    const update =
        (field: keyof ApplyFormData) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value =
                e.target.type === 'checkbox'
                    ? e.target.checked
                    : e.target.value;
            setFormData((prev) => ({ ...prev, [field]: value }));
            setErrors((prev) => ({ ...prev, [field]: '' }));
        };

    const updateAppliance =
        (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = Math.max(0, parseInt(e.target.value) || 0);
            setFormData((prev) => ({
                ...prev,
                appliances: { ...prev.appliances, [key]: value },
            }));
        };

    const applianceOptions = useMemo(
        () => getApplianceOptions(formData.buildingType),
        [formData.buildingType],
    );

    const totalLoad = applianceOptions.reduce(
        (sum, a) => sum + a.watts * (formData.appliances[a.key] || 0),
        0,
    );

    const validateStep = () => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 0) {
            if (!formData.fullName.trim()) {
                newErrors.fullName = 'Required';
            }

            if (!formData.phone.trim()) {
                newErrors.phone = 'Required';
            } else if (
                !/^(\+?234|0)\d{10}$/.test(
                    formData.phone.trim().replace(/\s/g, ''),
                )
            ) {
                newErrors.phone =
                    'Enter a valid Nigerian number (e.g., 0803 123 4567)';
            }

            if (!formData.email.trim()) {
                newErrors.email = 'Required';
            }

            if (!formData.buildingType) {
                newErrors.buildingType = 'Select one';
            }

            if (!formData.ndpr) {
                newErrors.ndpr = 'You must agree to proceed';
            }
        }

        if (currentStep === 1) {
            if (!formData.location) {
                newErrors.location = 'Select the installation location on the map';
            }

            if (
                !formData.billingAddress?.street?.trim() ||
                !formData.billingAddress?.city?.trim() ||
                !formData.billingAddress?.state?.trim()
            ) {
                newErrors.billingAddress = 'Enter your full billing address';
            }
        }

        if (currentStep === 2) {
            if (totalLoad === 0) {
                newErrors.appliances = 'Add at least one appliance';
            }
        }

        if (currentStep === 4) {
            if (!formData.selectedPlan) {
                newErrors.selectedPlan = 'Select a plan';
            }
        }

        if (currentStep === 7) {
            if (!formData.password) {
                newErrors.password = 'Required';
            } else if (formData.password.length < 8) {
                newErrors.password = 'At least 8 characters';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (validateStep()) {
            if (currentStep === 7) {
                router.post('/apply/submit', { data: formData } as never, {
                    preserveScroll: true,
                    onError: () => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    },
                });

                return;
            }

            setCurrentStep((prev) => prev + 1);
            setErrors({});
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        setErrors({});
    };

    const isLastStep = currentStep === steps.length - 1;

    function renderStep() {
        switch (currentStep) {
            case 0:
                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Tell us about you and your power
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                We use this to size your system and pre-fill
                                your credit application.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Full name{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Adaeze Okafor"
                                    value={formData.fullName}
                                    onChange={update('fullName')}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm ${
                                        errors.fullName
                                            ? 'border-destructive'
                                            : 'border-input'
                                    }`}
                                />
                                {errors.fullName && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    WhatsApp number{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="0803 123 4567"
                                    value={formData.phone}
                                    onChange={update('phone')}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm ${
                                        errors.phone
                                            ? 'border-destructive'
                                            : 'border-input'
                                    }`}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Email address{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={update('email')}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm ${
                                        errors.email
                                            ? 'border-destructive'
                                            : 'border-input'
                                    }`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="mb-3 block text-sm font-medium">
                                Building type{' '}
                                <span className="text-primary">*</span>
                            </label>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    {
                                        icon: <Home className="h-5 w-5" />,
                                        title: 'Residential',
                                        sub: 'Home or apartment',
                                    },
                                    {
                                        icon: <Building className="h-5 w-5" />,
                                        title: 'Commercial',
                                        sub: 'Shop, office, SME',
                                    },
                                    {
                                        icon: <Factory className="h-5 w-5" />,
                                        title: 'Industrial',
                                        sub: 'Workshop, factory',
                                    },
                                ].map((type) => (
                                    <motion.button
                                        key={type.title}
                                        type="button"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => {
                                            setFormData((prev) => {
                                                const changed =
                                                    prev.buildingType !== '' &&
                                                    prev.buildingType !==
                                                        type.title;

                                                return {
                                                    ...prev,
                                                    buildingType: type.title,
                                                    ...(changed && {
                                                        appliances:
                                                            Object.fromEntries(
                                                                (type.title ===
                                                                'Commercial'
                                                                    ? commercialAppliances
                                                                    : type.title ===
                                                                        'Industrial'
                                                                      ? industrialAppliances
                                                                      : residentialAppliances
                                                                ).map((a) => [
                                                                    a.key,
                                                                    0,
                                                                ]),
                                                            ),
                                                    }),
                                                };
                                            });
                                            setErrors((prev) => ({
                                                ...prev,
                                                buildingType: '',
                                            }));
                                        }}
                                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:bg-muted/50 hover:shadow-sm ${
                                            formData.buildingType === type.title
                                                ? 'border-primary bg-primary-soft shadow-sm'
                                                : 'border-input bg-transparent'
                                        }`}
                                    >
                                        <span
                                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                                                formData.buildingType ===
                                                type.title
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-primary-soft text-primary'
                                            }`}
                                        >
                                            {type.icon}
                                        </span>
                                        <div>
                                            <div className="text-sm font-medium">
                                                {type.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {type.sub}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                            {errors.buildingType && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.buildingType}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    {formData.buildingType === 'Residential' ||
                                    !formData.buildingType
                                        ? 'Monthly salary (₦)'
                                        : 'Monthly business revenue (₦)'}
                                </label>
                                <input
                                    type="number"
                                    value={formData.monthlySalary}
                                    onChange={update('monthlySalary')}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Monthly grid bill (₦)
                                </label>
                                <input
                                    type="number"
                                    value={formData.monthlyBill}
                                    onChange={update('monthlyBill')}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Monthly generator spend (₦)
                                </label>
                                <input
                                    type="number"
                                    value={formData.monthlyGenerator}
                                    onChange={update('monthlyGenerator')}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm"
                                />
                            </div>
                        </div>

                        <div
                            className={`mt-6 flex items-start gap-3 rounded-lg border p-4 ${
                                errors.ndpr
                                    ? 'border-destructive bg-destructive/5'
                                    : 'border-border/60 bg-muted'
                            }`}
                        >
                            <input
                                type="checkbox"
                                id="ndpr"
                                checked={formData.ndpr}
                                onChange={update('ndpr')}
                                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
                            />
                            <div>
                                <label
                                    htmlFor="ndpr"
                                    className="text-sm leading-relaxed text-muted-foreground"
                                >
                                    I agree to AlwaysON&apos;s privacy notice
                                    and consent to the processing of my data in
                                    accordance with the Nigeria Data Protection
                                    Regulation (NDPR), including sharing with
                                    our financing partner for credit assessment.{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                {errors.ndpr && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.ndpr}
                                    </p>
                                )}
                            </div>
                        </div>
                    </AnimatedStep>
                );

            case 1:
                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Installation location
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Search for your address or drop a pin on the
                                map. Drag the pin to adjust to your exact
                                building. We'll use these coordinates to
                                guide our installer to the right location.
                            </p>
                        </div>

                        <Suspense
                            fallback={
                                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                                    Loading map…
                                </div>
                            }
                        >
                            <LocationPicker
                                value={formData.location}
                                onChange={(location) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        location,
                                    }));
                                    setErrors((prev) => ({
                                        ...prev,
                                        location: '',
                                    }));
                                }}
                            />
                        </Suspense>

                        {errors.location && (
                            <p className="mt-2 text-sm text-destructive">
                                {errors.location}
                            </p>
                        )}

                        <div className="mt-10 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Billing address
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Enter the address on your utility bill. We'll
                                use this to verify your residency.
                            </p>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium">
                                    Street address{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="123 Main Street"
                                    value={
                                        formData.billingAddress?.street ?? ''
                                    }
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            billingAddress: {
                                                street: e.target.value,
                                                city:
                                                    prev.billingAddress?.city ??
                                                    '',
                                                state:
                                                    prev.billingAddress
                                                        ?.state ?? '',
                                                country:
                                                    prev.billingAddress
                                                        ?.country ?? 'Nigeria',
                                            },
                                        }))
                                    }
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm ${
                                        errors.billingAddress
                                            ? 'border-destructive'
                                            : 'border-input'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    City <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Lagos"
                                    value={formData.billingAddress?.city ?? ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            billingAddress: {
                                                street:
                                                    prev.billingAddress
                                                        ?.street ?? '',
                                                city: e.target.value,
                                                state:
                                                    prev.billingAddress
                                                        ?.state ?? '',
                                                country:
                                                    prev.billingAddress
                                                        ?.country ?? 'Nigeria',
                                            },
                                        }))
                                    }
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm ${
                                        errors.billingAddress
                                            ? 'border-destructive'
                                            : 'border-input'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    State{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                <Select
                                    value={formData.billingAddress?.state ?? ''}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            billingAddress: {
                                                street:
                                                    prev.billingAddress
                                                        ?.street ?? '',
                                                city:
                                                    prev.billingAddress?.city ??
                                                    '',
                                                state: value,
                                                country:
                                                    prev.billingAddress
                                                        ?.country ?? 'Nigeria',
                                            },
                                        }))
                                    }
                                >
                                    <SelectTrigger
                                        className={`w-full ${
                                            errors.billingAddress
                                                ? 'border-destructive'
                                                : ''
                                        }`}
                                    >
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NIGERIAN_STATES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {errors.billingAddress && (
                            <p className="mt-2 text-sm text-destructive">
                                {errors.billingAddress}
                            </p>
                        )}
                    </AnimatedStep>
                );

            case 2:
                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                What appliances do you run?
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tell us how many of each appliance you typically
                                power. This helps us size your system.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {applianceOptions.map((app) => (
                                <div
                                    key={app.key}
                                    className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-4 py-3"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {app.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {app.watts}W each
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const curr =
                                                    formData.appliances[
                                                        app.key
                                                    ] || 0;

                                                if (curr > 0) {
                                                    updateAppliance(app.key)({
                                                        target: {
                                                            value: String(
                                                                curr - 1,
                                                            ),
                                                        },
                                                    } as React.ChangeEvent<HTMLInputElement>);
                                                }
                                            }}
                                            className="grid h-7 w-7 place-items-center rounded-md border border-input bg-transparent text-sm transition-colors hover:bg-muted"
                                        >
                                            &minus;
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                                            {formData.appliances[app.key] || 0}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const curr =
                                                    formData.appliances[
                                                        app.key
                                                    ] || 0;
                                                updateAppliance(app.key)({
                                                    target: {
                                                        value: String(curr + 1),
                                                    },
                                                } as React.ChangeEvent<HTMLInputElement>);
                                            }}
                                            className="grid h-7 w-7 place-items-center rounded-md border border-input bg-transparent text-sm transition-colors hover:bg-muted"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {errors.appliances && (
                            <p className="mt-3 text-center text-sm text-destructive">
                                {errors.appliances}
                            </p>
                        )}

                        <div className="mt-6 rounded-lg border border-primary/20 bg-primary-soft p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Estimated total load
                                </span>
                                <span className="font-display text-xl font-bold text-primary">
                                    {totalLoad.toLocaleString()}W
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {totalLoad < 2000
                                    ? 'A Starter system should cover this load.'
                                    : totalLoad < 6000
                                      ? 'A Masstige system is recommended for this load.'
                                      : 'A Premium system is recommended for this load.'}
                            </p>
                        </div>
                    </AnimatedStep>
                );

            case 3:
                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Your load summary
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Here&apos;s a breakdown of your total power
                                requirement.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {applianceOptions
                                .filter(
                                    (a) =>
                                        (formData.appliances[a.key] || 0) > 0,
                                )
                                .map((a) => (
                                    <div
                                        key={a.key}
                                        className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-4 w-4 text-primary" />
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {a.label}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    &times;
                                                    {formData.appliances[a.key]}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm tabular-nums">
                                            {(
                                                a.watts *
                                                formData.appliances[a.key]
                                            ).toLocaleString()}
                                            W
                                        </span>
                                    </div>
                                ))}
                            {applianceOptions.every(
                                (a) => (formData.appliances[a.key] || 0) === 0,
                            ) && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No appliances added yet. Go back to add
                                    them.
                                </p>
                            )}
                        </div>

                        <div className="mt-6 rounded-lg border border-border/60 bg-surface p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-display text-lg font-semibold">
                                    Total power requirement
                                </span>
                                <span className="font-display text-2xl font-bold text-primary">
                                    {totalLoad.toLocaleString()}W
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Estimated daily consumption: ~
                                {((totalLoad * 8) / 1000).toFixed(1)} kWh
                            </p>
                        </div>
                    </AnimatedStep>
                );

            case 4:
                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Choose your system
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Pick the plan that best fits your load. You can
                                change your mind later.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {plans.map((plan) => {
                                const selected =
                                    formData.selectedPlan === plan.name;

                                return (
                                    <motion.button
                                        key={plan.name}
                                        type="button"
                                        whileHover={{ scale: 1.005 }}
                                        whileTap={{ scale: 0.995 }}
                                        onClick={() => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                selectedPlan: plan.name,
                                            }));
                                            setErrors((prev) => ({
                                                ...prev,
                                                selectedPlan: '',
                                            }));
                                        }}
                                        className={`relative flex flex-col rounded-xl border p-5 text-left transition-all duration-200 ${
                                            selected
                                                ? 'border-primary bg-primary-soft shadow-sm ring-1 ring-primary/30'
                                                : 'border-border/60 bg-surface hover:border-primary/40 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-display text-lg font-semibold">
                                                {plan.name}
                                            </h3>
                                            <div className="text-right">
                                                <div className="font-display text-lg font-bold text-primary">
                                                    {plan.price}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {plan.deposit}
                                                </div>
                                            </div>
                                        </div>
                                        <ul className="mt-3 grid gap-1.5">
                                            {plan.features.map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                                >
                                                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        {selected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                        {errors.selectedPlan && (
                            <p className="mt-2 text-sm text-destructive">
                                {errors.selectedPlan}
                            </p>
                        )}
                    </AnimatedStep>
                );

            case 5:
                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Cost comparison
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                See how solar stacks up against what you&apos;re
                                paying now.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/60 bg-surface p-5">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Zap className="h-4 w-4" />
                                    Current monthly spend
                                </div>
                                <div className="mt-2 font-display text-3xl font-bold text-foreground">
                                    ₦
                                    {(
                                        (parseInt(formData.monthlyBill) || 0) +
                                        (parseInt(formData.monthlyGenerator) ||
                                            0)
                                    ).toLocaleString()}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Grid: ₦{formData.monthlyBill || '0'}{' '}
                                    &middot; Generator: ₦
                                    {formData.monthlyGenerator || '0'}
                                </div>
                            </div>

                            <div
                                className={`rounded-xl border p-5 ${
                                    formData.selectedPlan
                                        ? 'border-primary bg-primary-soft'
                                        : 'border-border/60 bg-surface'
                                }`}
                            >
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Sun className="h-4 w-4 text-primary" />
                                    AlwaysON solar
                                </div>
                                <div className="mt-2 font-display text-3xl font-bold text-primary">
                                    {formData.selectedPlan
                                        ? plans.find(
                                              (p) =>
                                                  p.name ===
                                                  formData.selectedPlan,
                                          )?.price || '—'
                                        : 'Select a plan'}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Fixed monthly fee &middot; No fuel &middot;
                                    No maintenance
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-lg border border-success/20 bg-success/5 p-4">
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-success" />
                                <span className="text-sm font-medium text-foreground">
                                    You could save up to{' '}
                                    <strong className="text-success">
                                        ₦
                                        {(
                                            (parseInt(formData.monthlyBill) ||
                                                0) +
                                            (parseInt(
                                                formData.monthlyGenerator,
                                            ) || 0)
                                        ).toLocaleString()}
                                    </strong>{' '}
                                    per month
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Based on your current grid and generator spend.
                            </p>
                        </div>

                        <div className="mt-4 rounded-lg border border-border/60 bg-muted p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">
                                    Indicative deposit:{' '}
                                </span>
                                <span className="text-sm">
                                    {formData.selectedPlan
                                        ? plans.find(
                                              (p) =>
                                                  p.name ===
                                                  formData.selectedPlan,
                                          )?.deposit
                                        : 'Select a plan'}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Collected only after approval — not at sign-up.
                            </p>
                        </div>
                    </AnimatedStep>
                );

            case 6:
                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Confirm your intent
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Please review your details before proceeding.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-lg border border-border/60 bg-surface p-4">
                                <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                    Personal
                                </h3>
                                <div className="grid gap-2 text-sm sm:grid-cols-2">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Name:
                                        </span>{' '}
                                        {formData.fullName}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Phone:
                                        </span>{' '}
                                        {formData.phone}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Email:
                                        </span>{' '}
                                        {formData.email}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Building:
                                        </span>{' '}
                                        {formData.buildingType}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/60 bg-surface p-4">
                                <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                    Installation location
                                </h3>
                                {formData.location ? (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <div>
                                            <p>
                                                {formData.location
                                                    .formattedAddress ||
                                                    `${formData.location.lat.toFixed(5)}, ${formData.location.lng.toFixed(5)}`}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {formData.location.city &&
                                                    `${formData.location.city}, `}
                                                {formData.location.state &&
                                                    `${formData.location.state}, `}
                                                {formData.location.country}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No location selected
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-border/60 bg-surface p-4">
                                <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                    Billing address
                                </h3>
                                {formData.billingAddress ? (
                                    <p className="text-sm">
                                        {formData.billingAddress.street},{' '}
                                        {formData.billingAddress.city},{' '}
                                        {formData.billingAddress.state}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No billing address entered
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-border/60 bg-surface p-4">
                                <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                    Power
                                </h3>
                                <div className="grid gap-2 text-sm sm:grid-cols-3">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Load:
                                        </span>{' '}
                                        {totalLoad.toLocaleString()}W
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Grid bill:
                                        </span>{' '}
                                        ₦{formData.monthlyBill || '0'}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Generator:
                                        </span>{' '}
                                        ₦{formData.monthlyGenerator || '0'}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/60 bg-surface p-4">
                                <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                    Plan
                                </h3>
                                <div className="text-sm">
                                    {formData.selectedPlan ? (
                                        <div className="flex items-center justify-between">
                                            <span>{formData.selectedPlan}</span>
                                            <span className="font-medium text-primary">
                                                {
                                                    plans.find(
                                                        (p) =>
                                                            p.name ===
                                                            formData.selectedPlan,
                                                    )?.price
                                                }
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            No plan selected
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AnimatedStep>
                );

            case 7: {
                const pw = formData.password;
                const cpw = formData.confirmPassword;
                const checks = [
                    { label: 'At least 8 characters', passed: pw.length >= 8 },
                    {
                        label: 'At least 1 uppercase letter',
                        passed: /[A-Z]/.test(pw),
                    },
                    {
                        label: 'At least 1 lowercase letter',
                        passed: /[a-z]/.test(pw),
                    },
                    { label: 'At least 1 number', passed: /[0-9]/.test(pw) },
                    {
                        label: 'At least 1 special character',
                        passed: /[^A-Za-z0-9]/.test(pw),
                    },
                    {
                        label: 'Passwords match',
                        passed: pw.length > 0 && pw === cpw,
                    },
                ];

                return (
                    <AnimatedStep>
                        <div className="mb-8 rounded-lg border border-border/60 bg-muted p-4">
                            <h2 className="font-display text-lg font-semibold">
                                Create your account
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose a strong password &mdash; at least 8
                                characters with a mix of uppercase, lowercase,
                                numbers, and symbols.
                            </p>
                        </div>

                        <ul className="mb-6 space-y-1.5">
                            {checks.map((c) => (
                                <li
                                    key={c.label}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    {c.passed ? (
                                        <Check className="h-3.5 w-3.5 text-success" />
                                    ) : (
                                        <span className="grid h-3.5 w-3.5 place-items-center text-muted-foreground">
                                            &middot;
                                        </span>
                                    )}
                                    <span
                                        className={
                                            c.passed
                                                ? 'text-success'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {c.label}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Password{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="At least 8 characters"
                                    value={formData.password}
                                    onChange={update('password')}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm ${
                                        errors.password
                                            ? 'border-destructive'
                                            : 'border-input'
                                    }`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Confirm password{' '}
                                    <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={update('confirmPassword')}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:text-sm ${
                                        errors.confirmPassword
                                            ? 'border-destructive'
                                            : 'border-input'
                                    }`}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>
                    </AnimatedStep>
                );
            }

            default:
                return null;
        }
    }

    return (
        <>
            <Head title="Apply for AlwaysON Solar" />
            <div className="flex min-h-screen flex-col">
                <MarketingHeader forceScrolled />
                <main className="flex-1">
                    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            &larr; Back to home
                        </Link>
                        <h1 className="mt-4 font-display text-3xl font-semibold">
                            Get your AlwaysON quote
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Takes about 10 minutes.
                        </p>

                        <StepIndicator
                            steps={steps}
                            currentStep={currentStep}
                            onStepClick={setCurrentStep}
                        />

                        <motion.div className="rounded-xl border border-border/60 bg-surface p-8 shadow-sm">
                            <ServerErrorBanner />
                            <form
                                onSubmit={(e) => e.preventDefault()}
                                className="space-y-6"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div key={currentStep}>
                                        {renderStep()}
                                    </motion.div>
                                </AnimatePresence>

                                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                                    <div>
                                        {currentStep > 0 && (
                                            <motion.button
                                                type="button"
                                                onClick={handleBack}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                            >
                                                &larr; Back
                                            </motion.button>
                                        )}
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={handleContinue}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50"
                                    >
                                        {isLastStep
                                            ? 'Create account'
                                            : 'Continue'}
                                        {!isLastStep && (
                                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </main>
            </div>
        </>
    );
}

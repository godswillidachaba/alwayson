import { Head, router, usePage } from '@inertiajs/react';
import { KeyRound, Mail, MoreVertical, Phone, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    isDisabled: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
}

const ROLE_GROUPS = [
    { key: 'all', label: 'All' },
    { key: 'super_admin', label: 'Super Admin' },
    { key: 'operations', label: 'Operations' },
    { key: 'installer', label: 'Installers' },
    { key: 'customer', label: 'Customers' },
];

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    operations: 'Operations',
    installer: 'Installer',
    sales: 'Sales',
    customer: 'Customer',
};

const ROLE_OPTIONS = [
    { value: 'customer', label: 'Customer' },
    { value: 'operations', label: 'Operations' },
    { value: 'installer', label: 'Installer' },
    { value: 'sales', label: 'Sales' },
    { value: 'super_admin', label: 'Super Admin' },
];

export default function AdminUsers() {
    const { users } = usePage().props as unknown as {
        users: User[];
    };

    const [filterRole, setFilterRole] = useState('super_admin');
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [pendingRole, setPendingRole] = useState<{
        userId: number;
        userName: string;
        currentRole: string;
        newRole: string;
    } | null>(null);
    const [pendingDelete, setPendingDelete] = useState<{
        userId: number;
        userName: string;
    } | null>(null);
    const [roleConfirmInput, setRoleConfirmInput] = useState('');
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
    const [pendingPassword, setPendingPassword] = useState<{
        userId: number;
        userName: string;
    } | null>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        phone: '',
    });

    const filteredUsers = users.filter((u) => {
        const matchesRole =
            filterRole === 'all' || u.role === filterRole;
        const term = search.toLowerCase();

        const matchesSearch =
            !term ||
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.phone ?? '').toLowerCase().includes(term) ||
            (ROLE_LABELS[u.role] ?? '').toLowerCase().includes(term);

        return matchesRole && matchesSearch;
    });

    function handleDelete(userId: number) {
        const user = users.find((u) => u.id === userId);

        if (!user) {
            return;
        }

        setPendingDelete({ userId, userName: user.name });
        setDeleteConfirmInput('');
    }

    function handleRoleChange(userId: number, role: string) {
        router.put(
            `/dashboard/users/${userId}`,
            { role },
            {
                onSuccess: () => toast.success('Role updated.'),
                onError: () => toast.error('Failed to update role.'),
            },
        );
    }

    function handleToggleDisable(userId: number, currentDisabled: boolean) {
        router.put(
            `/dashboard/users/${userId}`,
            { is_disabled: !currentDisabled },
            {
                onSuccess: () => {
                    toast.success(
                        currentDisabled ? 'User enabled.' : 'User disabled.',
                    );
                    router.reload();
                },
                onError: () => toast.error('Failed to update user.'),
            },
        );
    }

    function handlePasswordChange() {
        if (!pendingPassword) {
            return;
        }

        router.put(
            `/dashboard/users/${pendingPassword.userId}`,
            { password: passwordInput },
            {
                onSuccess: () => {
                    toast.success('Password changed.');
                    setPendingPassword(null);
                    setPasswordInput('');
                },
                onError: () => toast.error('Failed to change password.'),
            },
        );
    }

    function handleCreate() {
        router.post('/dashboard/users', form, {
            onSuccess: () => {
                toast.success('User created.');
                setOpen(false);
                setForm({
                    name: '',
                    email: '',
                    password: '',
                    role: 'customer',
                    phone: '',
                });
            },
            onError: (errors) => {
                const msgs = Object.values(errors).join(', ');
                toast.error(msgs || 'Failed to create user.');
            },
        });
    }

    return (
        <>
            <Head title="Users" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Users</h1>
                        <p className="text-muted-foreground">
                            Manage all users and roles
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>Add User</Button>
                        </DialogTrigger>
                        <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0">
                            <DialogHeader className="shrink-0 p-6 pb-4">
                                <DialogTitle>Create User</DialogTitle>
                                <DialogDescription>
                                    Add a new user to the platform.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="min-h-0 flex-1 overflow-y-auto px-6">
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    name: e.target.value,
                                                }))
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    email: e.target.value,
                                                }))
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    password: e.target.value,
                                                }))
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Min 8 characters"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Phone
                                        </label>
                                        <input
                                            type="text"
                                            value={form.phone}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    phone: e.target.value,
                                                }))
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="+234..."
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Role
                                        </label>
                                        <Select
                                            value={form.role}
                                            onValueChange={(val) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    role: val,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLE_OPTIONS.map((opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="shrink-0 p-6 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={pendingRole !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setPendingRole(null);
                                setRoleConfirmInput('');
                            }
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Role Change</DialogTitle>
                                <DialogDescription>
                                    Changing{' '}
                                    <strong>{pendingRole?.userName}</strong>'s
                                    role from{' '}
                                    <strong>
                                        {
                                            ROLE_LABELS[
                                                pendingRole?.currentRole ?? ''
                                            ]
                                        }
                                    </strong>{' '}
                                    to{' '}
                                    <strong>
                                        {
                                            ROLE_LABELS[
                                                pendingRole?.newRole ?? ''
                                            ]
                                        }
                                    </strong>
                                    .
                                    <br />
                                    Type <strong>
                                        {pendingRole?.newRole}
                                    </strong>{' '}
                                    below to confirm.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-6 pb-2">
                                <input
                                    type="text"
                                    value={roleConfirmInput}
                                    onChange={(e) =>
                                        setRoleConfirmInput(e.target.value)
                                    }
                                    placeholder={`Type "${pendingRole?.newRole}" to confirm`}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPendingRole(null);
                                        setRoleConfirmInput('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={
                                        roleConfirmInput !==
                                        pendingRole?.newRole
                                    }
                                    onClick={() => {
                                        if (pendingRole) {
                                            handleRoleChange(
                                                pendingRole.userId,
                                                pendingRole.newRole,
                                            );
                                        }

                                        setPendingRole(null);
                                        setRoleConfirmInput('');
                                    }}
                                >
                                    OK
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={pendingDelete !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setPendingDelete(null);
                                setDeleteConfirmInput('');
                            }
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone.
                                    <br />
                                    Type{' '}
                                    <strong>
                                        {pendingDelete?.userName}
                                    </strong>{' '}
                                    below to confirm.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-6 pb-2">
                                <input
                                    type="text"
                                    value={deleteConfirmInput}
                                    onChange={(e) =>
                                        setDeleteConfirmInput(e.target.value)
                                    }
                                    placeholder={`Type "${pendingDelete?.userName}" to confirm`}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPendingDelete(null);
                                        setDeleteConfirmInput('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={
                                        deleteConfirmInput !==
                                        pendingDelete?.userName
                                    }
                                    onClick={() => {
                                        if (pendingDelete) {
                                            router.delete(
                                                `/dashboard/users/${pendingDelete.userId}`,
                                                {
                                                    onSuccess: () =>
                                                        toast.success(
                                                            'User deleted.',
                                                        ),
                                                    onError: (errors) =>
                                                        toast.error(
                                                            (
                                                                errors as Record<
                                                                    string,
                                                                    string
                                                                >
                                                            ).message ??
                                                                'Failed to delete.',
                                                        ),
                                                },
                                            );
                                        }

                                        setPendingDelete(null);
                                        setDeleteConfirmInput('');
                                    }}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={pendingPassword !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setPendingPassword(null);
                                setPasswordInput('');
                            }
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                                <DialogDescription>
                                    Set a new password for{' '}
                                    <strong>
                                        {pendingPassword?.userName}
                                    </strong>
                                    .
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-6 pb-2">
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) =>
                                        setPasswordInput(e.target.value)
                                    }
                                    placeholder="Min 8 characters"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPendingPassword(null);
                                        setPasswordInput('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={passwordInput.length < 8}
                                    onClick={handlePasswordChange}
                                >
                                    Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-col lg:flex-row lg:gap-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav
                            className="flex flex-col gap-1"
                            aria-label="User role filter"
                        >
                            {ROLE_GROUPS.map((group) => (
                                <button
                                    key={group.key}
                                    onClick={() => setFilterRole(group.key)}
                                    className={cn(
                                        'flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        filterRole === group.key
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {group.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

                    <div className="flex-1">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or role..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10 text-center">
                                                #
                                            </TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Verification</TableHead>
                                            <TableHead className="w-12" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user, idx) => (
                                            <TableRow
                                                key={user.id}
                                                className={
                                                    user.isDisabled
                                                        ? 'opacity-50'
                                                        : ''
                                                }
                                            >
                                                <TableCell className="text-center text-sm text-muted-foreground">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {user.phone ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {ROLE_LABELS[user.role] ??
                                                        user.role}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Mail
                                                            className={cn(
                                                                'h-4 w-4',
                                                                user.emailVerified
                                                                    ? 'text-green-500'
                                                                    : 'text-muted-foreground/30',
                                                            )}
                                                        />
                                                        <Phone
                                                            className={cn(
                                                                'h-4 w-4',
                                                                user.phoneVerified
                                                                    ? 'text-green-500'
                                                                    : 'text-muted-foreground/30',
                                                            )}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-44"
                                                        >
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    Change Role
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent>
                                                                    {ROLE_OPTIONS.map(
                                                                        (
                                                                            opt,
                                                                        ) => (
                                                                            <DropdownMenuItem
                                                                                key={
                                                                                    opt.value
                                                                                }
                                                                                onClick={() => {
                                                                                    setPendingRole(
                                                                                        {
                                                                                            userId: user.id,
                                                                                            userName:
                                                                                                user.name,
                                                                                            currentRole:
                                                                                                user.role,
                                                                                            newRole:
                                                                                                opt.value,
                                                                                        },
                                                                                    );
                                                                                    setRoleConfirmInput(
                                                                                        '',
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {
                                                                                    opt.label
                                                                                }
                                                                            </DropdownMenuItem>
                                                                        ),
                                                                    )}
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleToggleDisable(
                                                                        user.id,
                                                                        user.isDisabled,
                                                                    )
                                                                }
                                                            >
                                                            {user.isDisabled
                                                                ? 'Enable'
                                                                : 'Disable'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            disabled={user.emailVerified}
                                                            onClick={() =>
                                                                router.put(
                                                                    `/dashboard/users/${user.id}`,
                                                                    { verify_email: true },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                toast.success(
                                                                                    'Email verified.',
                                                                                );
                                                                                router.reload();
                                                                            },
                                                                        onError:
                                                                            () =>
                                                                                toast.error(
                                                                                    'Failed to verify email.',
                                                                                ),
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Verify Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            disabled={
                                                                user.phoneVerified ||
                                                                !user.phone
                                                            }
                                                            onClick={() =>
                                                                router.put(
                                                                    `/dashboard/users/${user.id}`,
                                                                    { verify_phone: true },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                toast.success(
                                                                                    'Phone verified.',
                                                                                );
                                                                                router.reload();
                                                                            },
                                                                        onError:
                                                                            () =>
                                                                                toast.error(
                                                                                    'Failed to verify phone.',
                                                                                ),
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Phone className="mr-2 h-4 w-4" />
                                                            Verify Phone
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setPendingPassword({
                                                                    userId: user.id,
                                                                    userName: user.name,
                                                                });
                                                                setPasswordInput('');
                                                            }}
                                                        >
                                                            <KeyRound className="mr-2 h-4 w-4" />
                                                            Change Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        user.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminUsers.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Users', href: '#' },
    ],
};

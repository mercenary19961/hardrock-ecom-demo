import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge, Select } from '@/Components/ui';
import { User, PaginatedData } from '@/types/models';
import {
    Edit,
    Trash2,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Users,
    Shield,
    UserCircle,
    Mail,
    Phone,
    Calendar,
    Check,
    Eye,
    LayoutGrid,
    List,
    Hash,
    CheckCircle,
    AlertCircle,
    UserPlus,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling, useResizableColumns } from '@/hooks';
import { StickyScrollWrapper, ResizableTh, SortIcon, ResetColumnsButton } from '@/Components/admin/ResizableTable';

// Default avatar component with initials fallback
function UserAvatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (user.avatar) {
        return (
            <img
                src={user.avatar}
                alt={user.name}
                className={`${sizeClasses[size]} rounded-full object-cover`}
            />
        );
    }

    // Generate a consistent color based on user id
    const colors = [
        'bg-purple-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
    ];
    const colorIndex = user.id % colors.length;

    return (
        <div
            className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}
        >
            {getInitials(user.name)}
        </div>
    );
}

interface Props {
    users: PaginatedData<User>;
    filters: { search?: string; role?: string; per_page?: string; sort?: string; dir?: string };
    roleCounts: { all: number; admin: number; customer: number };
    stats?: {
        total: number;
        admins: number;
        customers: number;
        verified: number;
        unverified: number;
        new_users: number;
    };
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

const perPageOptions = ['4', '8', '16', '32', '64', '80'];

const defaultStats = {
    total: 0,
    admins: 0,
    customers: 0,
    verified: 0,
    unverified: 0,
    new_users: 0,
};

// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export default function UsersIndex({ users, filters, roleCounts, stats: statsProp }: Props) {
    const stats = statsProp ?? defaultStats;
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [perPage, setPerPage] = useState(filters.per_page || '16');
    const [sortField, setSortField] = useState(filters.sort || 'created_at');
    const [sortDir, setSortDir] = useState(filters.dir || 'desc');
    const isFirstRender = useRef(true);
    const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('usersViewMode') as 'table' | 'card') || 'table';
        }
        return 'table';
    });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; user: User } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    // Resizable columns configuration
    const resizable = useResizableColumns({
        storageKey: 'admin-users-table',
        columns: [
            { key: 'user', defaultWidth: 200, minWidth: 150 },
            { key: 'email', defaultWidth: 220, minWidth: 150 },
            { key: 'phone', defaultWidth: 140, minWidth: 100 },
            { key: 'role', defaultWidth: 100, minWidth: 80 },
            { key: 'joined', defaultWidth: 120, minWidth: 90 },
            { key: 'actions', defaultWidth: 120, minWidth: 100 },
        ],
    });

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem('usersViewMode', viewMode);
    }, [viewMode]);

    // Context menu handlers
    const handleContextMenu = useCallback((e: React.MouseEvent, user: User) => {
        e.preventDefault();
        e.stopPropagation();

        // Calculate position, ensuring menu stays within viewport
        const x = Math.min(e.clientX, window.innerWidth - 160);
        const y = Math.min(e.clientY, window.innerHeight - 150);

        setContextMenu({ x, y, user });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Close context menu on click outside or escape key
    useEffect(() => {
        if (!contextMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                closeContextMenu();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeContextMenu();
            }
        };

        const handleScroll = () => {
            closeContextMenu();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [contextMenu, closeContextMenu]);

    const debouncedSearch = useDebounce(search, 300);

    // SPA-style filter function
    const applyFilters = useCallback(
        (searchVal: string, roleVal: string, sortFieldVal: string, sortDirVal: string, perPageVal: string) => {
            router.get(
                '/admin/users',
                {
                    search: searchVal || undefined,
                    role: roleVal || undefined,
                    sort: sortFieldVal !== 'created_at' ? sortFieldVal : undefined,
                    dir: sortDirVal !== 'desc' ? sortDirVal : undefined,
                    per_page: perPageVal !== '16' ? perPageVal : undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        },
        []
    );

    // Auto-filter when debounced search changes
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters(debouncedSearch, role, sortField, sortDir, perPage);
    }, [debouncedSearch, applyFilters]);

    const handleRoleFilter = (newRole: string) => {
        const roleValue = newRole === 'all' ? '' : newRole;
        setRole(roleValue);
        applyFilters(search, roleValue, sortField, sortDir, perPage);
    };

    // Handle sort toggle on column header click
    const handleSortToggle = (field: string) => {
        let newDir = 'desc';
        if (sortField === field) {
            newDir = sortDir === 'asc' ? 'desc' : 'asc';
        }
        setSortField(field);
        setSortDir(newDir);
        applyFilters(search, role, field, newDir, perPage);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters(search, role, sortField, sortDir, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setRole('');
        setSortField('created_at');
        setSortDir('desc');
        applyFilters('', '', 'created_at', 'desc', perPage);
    };

    const hasActiveFilters = filters.search || filters.role || (filters.sort && filters.sort !== 'created_at');

    const handleDelete = (user: User) => {
        if (user.role === 'admin') {
            alert('Admin users cannot be deleted.');
            return;
        }
        if (confirm(`Are you sure you want to delete user "${user.name}"?`)) {
            router.delete(`/admin/users/${user.id}`);
        }
    };

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const successTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-hide success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
        }
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, [successMessage]);

    return (
        <AdminLayout>
            <Head title="Users" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        Users
                    </h1>
                    {/* View Toggle */}
                    <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 ${viewMode === 'table' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            title="Table view"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 ${viewMode === 'card' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            title="Card view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.total}
                                </p>
                            </div>
                            <Hash className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Verified</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.verified} <span className="text-sm font-normal text-gray-400">/ {stats.total}</span>
                                </p>
                            </div>
                            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Unverified</p>
                                <p className={`text-2xl font-bold mt-1 ${stats.unverified > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                    {stats.unverified}
                                </p>
                            </div>
                            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">New (30 days)</p>
                                <p className={`text-2xl font-bold mt-1 ${stats.new_users > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                    {stats.new_users}
                                </p>
                            </div>
                            <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="relative w-full sm:w-1/2">
                                <label htmlFor="users-search" className="sr-only">
                                    Search users
                                </label>
                                <input
                                    id="users-search"
                                    name="search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or email..."
                                    autoComplete="off"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-purple-600 dark:focus:border-purple-400 outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:ml-auto">
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-dashed border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear All Filters
                                    </button>
                                )}
                                <Select
                                    value={role}
                                    onChange={(value) => handleRoleFilter(value || 'all')}
                                    className="w-full sm:w-48"
                                    placeholder="All Roles"
                                    options={[
                                        { value: '', label: `All Roles (${roleCounts.all})` },
                                        { value: 'admin', label: `Admins (${roleCounts.admin})` },
                                        { value: 'customer', label: `Customers (${roleCounts.customer})` },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Card View - shown on mobile always, on desktop when card mode selected */}
                <div className={`${viewMode === 'card' ? 'block' : 'block md:hidden'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {users.data.map((user) => (
                            <Card
                                key={user.id}
                                className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-context-menu"
                                onContextMenu={(e) => handleContextMenu(e, user)}
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <UserAvatar user={user} size="lg" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white truncate">
                                                    {user.name}
                                                </span>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'info'} className="flex-shrink-0">
                                                    {user.role === 'admin' ? (
                                                        <span className="flex items-center gap-1">
                                                            <Shield className="h-3 w-3" />
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        'Customer'
                                                    )}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1 truncate">
                                                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </p>
                                            {user.phone && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                                    {user.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Joined {formatDate(user.created_at)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Link href={`/admin/users/${user.id}`} preserveScroll>
                                                <Button variant="ghost" size="sm" title="View">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/users/${user.id}/edit`} preserveScroll>
                                                <Button variant="ghost" size="sm" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {user.role === 'customer' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(user)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    {users.data.length === 0 && (
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No users found
                            </div>
                        </Card>
                    )}
                </div>

                {/* Desktop Table Layout - hidden on mobile, shown on desktop when table mode selected */}
                <Card className={`${viewMode === 'table' ? 'hidden md:block' : 'hidden'} dark:bg-gray-800 dark:border-gray-700`}>
                    {/* Header bar with reset button */}
                    <div className="flex justify-end items-center px-4 h-10 border-b border-gray-200 dark:border-gray-700">
                        <ResetColumnsButton resizable={resizable} />
                    </div>
                    <StickyScrollWrapper>
                        <table className="w-full table-fixed min-w-[800px]">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <ResizableTh
                                        columnKey="user"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('name')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <UserCircle className="h-3.5 w-3.5" />
                                            User
                                            <SortIcon field="name" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="email"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('email')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Mail className="h-3.5 w-3.5" />
                                            Email
                                            <SortIcon field="email" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="phone"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('phone')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Phone className="h-3.5 w-3.5" />
                                            Phone
                                            <SortIcon field="phone" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="role"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('role')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Shield className="h-3.5 w-3.5" />
                                            Role
                                            <SortIcon field="role" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="joined"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('created_at')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Calendar className="h-3.5 w-3.5" />
                                            Joined
                                            <SortIcon field="created_at" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="actions"
                                        resizable={resizable}
                                        className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        isResizable={false}
                                    >
                                        Actions
                                    </ResizableTh>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-context-menu"
                                        onContextMenu={(e) => handleContextMenu(e, user)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={user} size="sm" />
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {user.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {user.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={user.role === 'admin' ? 'default' : 'info'}>
                                                {user.role === 'admin' ? (
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    'Customer'
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link href={`/admin/users/${user.id}`} preserveScroll>
                                                    <Button variant="ghost" size="sm" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/users/${user.id}/edit`} preserveScroll>
                                                    <Button variant="ghost" size="sm" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {user.role === 'customer' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(user)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </StickyScrollWrapper>
                    {users.data.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No users found
                        </div>
                    )}
                </Card>

                {/* Pagination and Per Page */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {users.last_page > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            {/* Previous Button */}
                            <Link
                                href={users.links[0].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                                    users.links[0].url
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Link>

                            {/* Page Numbers - Smart pagination with ellipsis */}
                            {(() => {
                                const currentPage = users.current_page;
                                const lastPage = users.last_page;
                                const pageLinks = users.links.slice(1, -1);

                                // Build pages to show with different neighbor counts for mobile/desktop
                                const buildPages = (neighborCount: number) => {
                                    const pages: (number | 'ellipsis')[] = [];
                                    for (let i = 1; i <= lastPage; i++) {
                                        const isFirst = i === 1;
                                        const isLast = i === lastPage;
                                        const isCurrent = i === currentPage;
                                        const isNeighbor = Math.abs(i - currentPage) <= neighborCount;

                                        if (isFirst || isLast || isCurrent || isNeighbor) {
                                            const prevShown = pages[pages.length - 1];
                                            if (typeof prevShown === 'number' && i - prevShown > 1) {
                                                pages.push('ellipsis');
                                            }
                                            pages.push(i);
                                        }
                                    }
                                    return pages;
                                };

                                const mobilePages = buildPages(1);  // 1 neighbor on mobile
                                const desktopPages = buildPages(2); // 2 neighbors on desktop

                                // Render helper
                                const renderPage = (item: number | 'ellipsis', index: number, isMobile: boolean) => {
                                    if (item === 'ellipsis') {
                                        return (
                                            <span key={`ellipsis-${isMobile ? 'm' : 'd'}-${index}`} className={`text-gray-400 dark:text-gray-500 ${isMobile ? 'px-1 py-1.5 text-xs' : 'px-2 py-2 text-sm'}`}>
                                                ...
                                            </span>
                                        );
                                    }

                                    const pageNum = item;
                                    const link = pageLinks[pageNum - 1];

                                    return (
                                        <Link
                                            key={`page-${isMobile ? 'm' : 'd'}-${pageNum}`}
                                            href={link?.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`rounded-lg ${isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'} ${
                                                link?.active
                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                    : link?.url
                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {pageNum}
                                        </Link>
                                    );
                                };

                                return (
                                    <>
                                        {/* Mobile: 1 neighbor */}
                                        <span className="flex sm:hidden gap-1">
                                            {mobilePages.map((item, index) => renderPage(item, index, true))}
                                        </span>
                                        {/* Desktop: 2 neighbors */}
                                        <span className="hidden sm:flex gap-1 sm:gap-2">
                                            {desktopPages.map((item, index) => renderPage(item, index, false))}
                                        </span>
                                    </>
                                );
                            })()}

                            {/* Next Button */}
                            <Link
                                href={users.links[users.links.length - 1].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                                    users.links[users.links.length - 1].url
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}
                    <div className="flex-1 flex justify-end">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <label htmlFor="users-per-page" className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Show:
                            </label>
                            <select
                                id="users-per-page"
                                name="per_page"
                                value={perPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-gray-900 dark:focus:border-gray-400 outline-none min-w-[60px] sm:min-w-[80px]"
                            >
                                {perPageOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 pl-4 pr-3 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="font-medium">{successMessage}</span>
                    <Button
                        type="button"
                        onClick={() => setSuccessMessage(null)}
                        className="ml-2 p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </Button>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    {/* View */}
                    <Link
                        href={`/admin/users/${contextMenu.user.id}`}
                        preserveScroll
                        onClick={closeContextMenu}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        View User
                    </Link>

                    {/* Edit */}
                    <Link
                        href={`/admin/users/${contextMenu.user.id}/edit`}
                        preserveScroll
                        onClick={closeContextMenu}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Edit User
                    </Link>

                    {/* Delete - only for customers */}
                    {contextMenu.user.role === 'customer' && (
                        <>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                            <button
                                onClick={() => {
                                    handleDelete(contextMenu.user);
                                    closeContextMenu();
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                            </button>
                        </>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}

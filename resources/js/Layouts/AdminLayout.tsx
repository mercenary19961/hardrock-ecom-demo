import { ReactNode, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    ShoppingCart,
    Ticket,
    Users,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User,
    Store,
    Menu,
    X,
    Home,
    Search,
    Plus,
    Pencil,
    Loader2,
    Star,
    Settings,
    BarChart3,
} from 'lucide-react';
import { User as UserType } from '@/types/models';
import { SiteSettings } from '@/types';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import { SkyToggle } from '@/Components/ui/SkyToggle';
import axios from 'axios';

// Search result types
interface SearchResults {
    products: Array<{
        id: number;
        name: string;
        sku: string;
        price: number;
        stock: number;
        is_active: boolean;
        url: string;
    }>;
    categories: Array<{
        id: number;
        name: string;
        slug: string;
        is_active: boolean;
        products_count: number;
        url: string;
    }>;
    orders: Array<{
        id: number;
        order_number: string;
        customer_name: string;
        total: number;
        status: string;
        created_at: string;
        url: string;
    }>;
}

// Breadcrumb configuration with icons
const breadcrumbConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    'admin': { label: 'Dashboard', icon: Home },
    'products': { label: 'Products', icon: Package },
    'categories': { label: 'Categories', icon: FolderTree },
    'orders': { label: 'Orders', icon: ShoppingCart },
    'coupons': { label: 'Coupons', icon: Ticket },
    'users': { label: 'Users', icon: Users },
    'reviews': { label: 'Reviews', icon: Star },
    'reports': { label: 'Reports', icon: BarChart3 },
    'settings': { label: 'Settings', icon: Settings },
    'create': { label: 'Create', icon: Plus },
    'edit': { label: 'Edit', icon: Pencil },
};

interface AdminLayoutProps {
    children: ReactNode;
}

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Reviews', href: '/admin/reviews', icon: Star },
    { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

// Global sidebar state (persists across navigation)
let globalSidebarOpen = true;

function AdminLayoutContent({ children }: AdminLayoutProps) {
    const { auth, url, siteSettings } = usePage<{ auth: { user: UserType }; url: string; siteSettings?: SiteSettings }>().props;
    const storeName = siteSettings?.store_name || 'HardRock';
    const { toggleTheme, isDark } = useAdminTheme();
    const [sidebarOpen, setSidebarOpen] = useState(globalSidebarOpen);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync sidebar state globally
    useEffect(() => {
        globalSidebarOpen = sidebarOpen;
    }, [sidebarOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger when typing in inputs
            const activeElement = document.activeElement;
            const isInInput = activeElement?.tagName === 'INPUT' ||
                              activeElement?.tagName === 'TEXTAREA' ||
                              activeElement?.tagName === 'SELECT';

            if (isInInput) return;

            // Alt + Left Arrow = Go back
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                window.history.back();
            }

            // Alt + Right Arrow = Go forward
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                window.history.forward();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Debounced search
    const performSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults(null);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get('/admin/search', { params: { q: query } });
            setSearchResults(response.data);
            setShowDropdown(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Handle search input change with debounce
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    // Generate breadcrumbs from URL
    const breadcrumbs = useMemo(() => {
        const pathSegments = url.split('/').filter(Boolean);
        const crumbs: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [];

        let currentPath = '';
        pathSegments.forEach((segment) => {
            currentPath += `/${segment}`;

            // Check if segment is a number (ID) - skip it or label it
            if (/^\d+$/.test(segment)) {
                return; // Skip numeric IDs in breadcrumbs
            }

            const config = breadcrumbConfig[segment];
            if (config) {
                crumbs.push({
                    label: config.label,
                    href: currentPath,
                    icon: config.icon,
                });
            }
        });

        return crumbs;
    }, [url]);

    // Handle search form submit (pressing Enter)
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to products with search query
            router.get('/admin/products', { search: searchQuery.trim() });
            setShowDropdown(false);
        }
    };

    // Handle clicking a search result
    const handleResultClick = (resultUrl: string) => {
        setShowDropdown(false);
        setSearchQuery('');
        router.visit(resultUrl);
    };

    // Check if there are any results
    const hasResults = searchResults && (
        searchResults.products.length > 0 ||
        searchResults.categories.length > 0 ||
        searchResults.orders.length > 0
    );

    const isActive = (href: string) => {
        if (href === '/admin') {
            return url === '/admin';
        }
        return url.startsWith(href);
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-300 admin-scrollbar">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
                >
                    {mobileMenuOpen ? (
                        <X className="h-6 w-6 dark:text-white" />
                    ) : (
                        <Menu className="h-6 w-6 dark:text-white" />
                    )}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 bg-gray-900 text-white transition-all duration-300 ${
                    mobileMenuOpen ? 'w-72' : sidebarOpen ? 'w-72' : 'w-20'
                } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
                        {(sidebarOpen || mobileMenuOpen) && (
                            <Link href="/admin" className="text-xl font-bold ml-12 lg:ml-0 whitespace-nowrap">
                                {storeName} Admin
                            </Link>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-800"
                        >
                            {sidebarOpen ? (
                                <ChevronLeft className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    preserveScroll
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                        active
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {(sidebarOpen || mobileMenuOpen) && <span>{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-gray-800 p-4 space-y-2">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                        >
                            <Store className="h-5 w-5" />
                            {(sidebarOpen || mobileMenuOpen) && <span>View Store</span>}
                        </Link>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center gap-3 w-full px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                        >
                            <LogOut className="h-5 w-5" />
                            {(sidebarOpen || mobileMenuOpen) && <span>Logout</span>}
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main content */}
            <div
                className={`h-screen flex flex-col overflow-hidden transition-all duration-300 ${
                    sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
                }`}
            >
                {/* Top bar */}
                <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-4 lg:px-6 transition-colors duration-300 flex-shrink-0">
                    {/* Breadcrumbs - hidden on mobile */}
                    <nav className="hidden lg:flex items-center gap-1 text-sm">
                        {breadcrumbs.map((crumb, index) => {
                            const Icon = crumb.icon;
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <div key={crumb.href} className="flex items-center gap-1">
                                    {index > 0 && (
                                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    )}
                                    {isLast ? (
                                        <span className="flex items-center gap-1.5 text-gray-900 dark:text-white font-medium">
                                            <Icon className="h-4 w-4" />
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            <Icon className="h-4 w-4" />
                                            {crumb.label}
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Mobile spacer */}
                    <div className="lg:hidden" />

                    <div className="flex items-center gap-3 lg:gap-4">
                        {/* Search field with dropdown */}
                        <div ref={searchRef} className="relative">
                            <form onSubmit={handleSearchSubmit}>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                                )}
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                                    className="w-40 lg:w-64 pl-9 pr-8 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 transition-all"
                                />
                            </form>

                            {/* Search Results Dropdown */}
                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[320px]">
                                    {!hasResults && !isSearching && searchQuery.length >= 2 && (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                            No results found for "{searchQuery}"
                                        </div>
                                    )}

                                    {/* Products */}
                                    {searchResults && searchResults.products.length > 0 && (
                                        <div>
                                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                                <Package className="h-3.5 w-3.5" />
                                                Products
                                            </div>
                                            {searchResults.products.map((product) => (
                                                <button
                                                    key={`product-${product.id}`}
                                                    onClick={() => handleResultClick(product.url)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            SKU: {product.sku} · Stock: {product.stock}
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${product.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                                                        {product.is_active ? 'Active' : 'Draft'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Categories */}
                                    {searchResults && searchResults.categories.length > 0 && (
                                        <div>
                                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                                <FolderTree className="h-3.5 w-3.5" />
                                                Categories
                                            </div>
                                            {searchResults.categories.map((category) => (
                                                <button
                                                    key={`category-${category.id}`}
                                                    onClick={() => handleResultClick(category.url)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {category.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {category.products_count} products
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${category.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                                                        {category.is_active ? 'Active' : 'Draft'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Orders */}
                                    {searchResults && searchResults.orders.length > 0 && (
                                        <div>
                                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                                <ShoppingCart className="h-3.5 w-3.5" />
                                                Orders
                                            </div>
                                            {searchResults.orders.map((order) => (
                                                <button
                                                    key={`order-${order.id}`}
                                                    onClick={() => handleResultClick(order.url)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            #{order.order_number}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {order.customer_name} · {order.created_at}
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                                                        order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Press Enter hint */}
                                    {hasResults && (
                                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                                            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Enter</kbd> to search all products
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <SkyToggle checked={isDark} onChange={toggleTheme} />

                        {/* User info - name hidden on mobile */}
                        <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{auth.user.name}</span>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6 flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <AdminThemeProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminThemeProvider>
    );
}

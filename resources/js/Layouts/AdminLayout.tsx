import { ReactNode, useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User,
    Store,
    Menu,
    X,
    Loader2,
} from 'lucide-react';
import { User as UserType } from '@/types/models';

interface AdminLayoutProps {
    children: ReactNode;
}

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
];

// Global sidebar state (persists across navigation)
let globalSidebarOpen = true;

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { auth, url } = usePage<{ auth: { user: UserType }; url: string }>().props;
    const [sidebarOpen, setSidebarOpen] = useState(globalSidebarOpen);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Sync sidebar state globally
    useEffect(() => {
        globalSidebarOpen = sidebarOpen;
    }, [sidebarOpen]);

    // Listen for Inertia navigation events
    useEffect(() => {
        const removeStartListener = router.on('start', () => setIsNavigating(true));
        const removeFinishListener = router.on('finish', () => setIsNavigating(false));

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    const isActive = (href: string) => {
        if (href === '/admin') {
            return url === '/admin';
        }
        return url.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 bg-white rounded-lg shadow-md"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 bg-gray-900 text-white transition-all duration-300 ${
                    mobileMenuOpen ? 'w-64' : sidebarOpen ? 'w-64' : 'w-20'
                } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
                        {(sidebarOpen || mobileMenuOpen) && (
                            <Link href="/admin" className="text-xl font-bold ml-12 lg:ml-0">
                                HardRock Admin
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
                className={`transition-all duration-300 ${
                    sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                }`}
            >
                {/* Top bar */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
                    <div className="lg:hidden" /> {/* Spacer for mobile menu button */}
                    <div className="flex-1" />
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{auth.user.name}</span>
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                </header>

                {/* Loading indicator */}
                {isNavigating && (
                    <div className="fixed top-0 left-0 right-0 z-50">
                        <div className="h-1 bg-gray-900 animate-pulse" />
                    </div>
                )}

                {/* Page content */}
                <main className={`p-6 transition-opacity duration-150 ${isNavigating ? 'opacity-60' : 'opacity-100'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}

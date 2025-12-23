import { useState, ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ShoppingCart, User, Menu, X, Search, ChevronDown } from 'lucide-react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { CartDrawer } from '@/Components/shop/CartDrawer';
import { SearchBar } from '@/Components/shop/SearchBar';
import { Category, User as UserType } from '@/types/models';

interface ShopLayoutProps {
    children: ReactNode;
}

function ShopLayoutContent({ children }: ShopLayoutProps) {
    const { cart } = useCart();
    const { auth, categories } = usePage<{ auth: { user: UserType | null }; categories?: Category[] }>().props;
    const [cartOpen, setCartOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold text-gray-900">HardRock</span>
                            <span className="ml-1 text-sm text-gray-500">Demo</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link
                                href="/"
                                className="text-gray-700 hover:text-gray-900 font-medium"
                            >
                                Home
                            </Link>
                            {categories?.slice(0, 5).map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/category/${category.slug}`}
                                    className="text-gray-700 hover:text-gray-900 font-medium"
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Search & Actions */}
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block">
                                <SearchBar />
                            </div>

                            {/* Cart */}
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative p-2 text-gray-700 hover:text-gray-900"
                            >
                                <ShoppingCart className="h-6 w-6" />
                                {cart.total_items > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center">
                                        {cart.total_items}
                                    </span>
                                )}
                            </button>

                            {/* User Menu */}
                            {auth.user ? (
                                <div className="relative group">
                                    <button className="flex items-center space-x-1 p-2 text-gray-700 hover:text-gray-900">
                                        <User className="h-6 w-6" />
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <div className="py-2">
                                            <p className="px-4 py-2 text-sm text-gray-500 border-b">
                                                {auth.user.name}
                                            </p>
                                            {auth.user.role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Admin Panel
                                                </Link>
                                            )}
                                            <Link
                                                href="/orders"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                My Orders
                                            </Link>
                                            <Link
                                                href="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                href="/logout"
                                                method="post"
                                                as="button"
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Logout
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="text-gray-700 hover:text-gray-900 font-medium"
                                >
                                    Login
                                </Link>
                            )}

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-gray-700"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t">
                            <div className="mb-4">
                                <SearchBar />
                            </div>
                            <nav className="space-y-2">
                                <Link
                                    href="/"
                                    className="block py-2 text-gray-700 hover:text-gray-900"
                                >
                                    Home
                                </Link>
                                {categories?.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.slug}`}
                                        className="block py-2 text-gray-700 hover:text-gray-900"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4">HardRock Demo</h3>
                            <p className="text-gray-400 text-sm">
                                A demo e-commerce platform showcasing modern web development.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Shop</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><Link href="/" className="hover:text-white">All Products</Link></li>
                                <li><Link href="/category/electronics" className="hover:text-white">Electronics</Link></li>
                                <li><Link href="/category/clothing" className="hover:text-white">Clothing</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Account</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><Link href="/login" className="hover:text-white">Login</Link></li>
                                <li><Link href="/register" className="hover:text-white">Register</Link></li>
                                <li><Link href="/orders" className="hover:text-white">Order History</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>demo@hardrock-co.com</li>
                                <li>Amman, Jordan</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                        <p>&copy; {new Date().getFullYear()} HardRock Marketing & Technology. Demo purposes only.</p>
                    </div>
                </div>
            </footer>

            {/* Cart Drawer */}
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
    );
}

export default function ShopLayout({ children }: ShopLayoutProps) {
    return (
        <CartProvider>
            <ShopLayoutContent>{children}</ShopLayoutContent>
        </CartProvider>
    );
}

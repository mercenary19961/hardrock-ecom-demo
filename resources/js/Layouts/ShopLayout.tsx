import { useState, useEffect, useRef, ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ShoppingCart, User, Menu, X, ChevronDown, Heart, Globe } from 'lucide-react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { WishlistProvider, useWishlist } from '@/contexts/WishlistContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CartDrawer } from '@/Components/shop/CartDrawer';
import { WishlistDrawer } from '@/Components/shop/WishlistDrawer';
import { SearchBar } from '@/Components/shop/SearchBar';
import { Category, User as UserType } from '@/types/models';

interface ShopLayoutProps {
    children: ReactNode;
}

function ShopLayoutContent({ children }: ShopLayoutProps) {
    const { cart } = useCart();
    const { items: wishlistItems } = useWishlist();
    const { language, setLanguage } = useLanguage();
    const { auth, categories } = usePage<{ auth: { user: UserType | null }; categories?: Category[] }>().props;
    const [cartOpen, setCartOpen] = useState(false);
    const [wishlistOpen, setWishlistOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [wishlistPulse, setWishlistPulse] = useState(false);
    const [showCategoryNav, setShowCategoryNav] = useState(true);
    const lastScrollY = useRef(0);

    // Pulse animation every 20 seconds when wishlist has items
    useEffect(() => {
        if (wishlistItems.length === 0) return;

        const triggerPulse = () => {
            setWishlistPulse(true);
            setTimeout(() => setWishlistPulse(false), 1000);
        };

        // Initial pulse after mount
        const initialTimeout = setTimeout(triggerPulse, 2000);

        // Recurring pulse every 20 seconds
        const interval = setInterval(triggerPulse, 20000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [wishlistItems.length]);

    // Show/hide category nav based on scroll direction
    useEffect(() => {
        const SCROLL_THRESHOLD = 10;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollDiff = currentScrollY - lastScrollY.current;

            if (currentScrollY < 50) {
                // Always show when near top
                setShowCategoryNav(true);
            } else if (scrollDiff < -SCROLL_THRESHOLD) {
                // Scrolling up past threshold - show
                setShowCategoryNav(true);
            } else if (scrollDiff > SCROLL_THRESHOLD) {
                // Scrolling down past threshold - hide
                setShowCategoryNav(false);
            }

            // Only update last position if we passed the threshold
            if (Math.abs(scrollDiff) > SCROLL_THRESHOLD) {
                lastScrollY.current = currentScrollY;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center flex-shrink-0">
                            <span className="text-xl font-bold text-gray-900">HardRock</span>
                            <span className="ml-1 text-sm text-gray-500">Demo</span>
                        </Link>

                        {/* Search Bar - Full Width */}
                        <div className="hidden md:block flex-1 max-w-2xl">
                            <SearchBar />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-auto">
                            {/* Wishlist */}
                            <button
                                onClick={() => setWishlistOpen(true)}
                                className={`relative p-2 text-gray-700 hover:text-gray-900 transition-transform duration-300 ${
                                    wishlistPulse ? 'scale-125' : 'scale-100'
                                }`}
                            >
                                <div className="relative h-6 w-6">
                                    <Heart className="h-6 w-6 absolute inset-0" />
                                    {wishlistItems.length > 0 && (
                                        <div className="absolute inset-0 overflow-hidden w-1/2">
                                            <Heart className="h-6 w-6 fill-gray-900 text-gray-900" />
                                        </div>
                                    )}
                                </div>
                            </button>

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

                            {/* Language Toggle */}
                            <button
                                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                                className="flex items-center gap-1 p-2 text-gray-700 hover:text-gray-900 font-medium text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
                            >
                                <Globe className="h-4 w-4" />
                                <span>{language === 'en' ? 'AR' : 'EN'}</span>
                            </button>

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

            {/* Secondary Category Navigation */}
            <div
                className={`hidden md:block bg-white border-b sticky z-30 transition-all duration-300 ease-out ${
                    showCategoryNav ? 'top-16 opacity-100' : '-top-10 opacity-0'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center justify-center gap-8 h-10">
                        {categories?.map((category) => (
                            <Link
                                key={category.id}
                                href={`/category/${category.slug}`}
                                className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4">HardRock</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Reach The Peak - A demo e-commerce platform by HardRock Marketing & Technology.
                            </p>
                            <div className="flex gap-3">
                                <a href="https://web.facebook.com/profile.php?id=61584916708775" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                </a>
                                <a href="https://www.instagram.com/hardrock_agency/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                </a>
                                <a href="https://www.linkedin.com/company/hardrock-agency/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Shop</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><Link href="/" className="hover:text-white">All Products</Link></li>
                                <li><Link href="/category/electronics" className="hover:text-white">Electronics</Link></li>
                                <li><Link href="/category/skincare" className="hover:text-white">Skincare</Link></li>
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
                            <ul className="space-y-3 text-gray-400 text-sm">
                                <li className="flex items-center gap-2">
                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span>Khalda - Amman, Jordan</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <a href="tel:+962791700034" className="hover:text-white">+962 79 170 0034</a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <a href="mailto:sales@hardrock-co.com" className="hover:text-white">sales@hardrock-co.com</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                        <p>&copy; {new Date().getFullYear()} HardRock. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Cart Drawer */}
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

            {/* Wishlist Drawer */}
            <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
        </div>
    );
}

export default function ShopLayout({ children }: ShopLayoutProps) {
    return (
        <LanguageProvider>
            <CartProvider>
                <WishlistProvider>
                    <ShopLayoutContent>{children}</ShopLayoutContent>
                </WishlistProvider>
            </CartProvider>
        </LanguageProvider>
    );
}

import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { CategoryNav } from '@/Components/shop/CategoryNav';
import { Button } from '@/Components/ui';
import { Product, Category } from '@/types/models';
import { ArrowRight } from 'lucide-react';

interface Props {
    featuredProducts: Product[];
    categories: Category[];
}

export default function Home({ featuredProducts, categories }: Props) {
    return (
        <ShopLayout>
            <Head title="Home" />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Welcome to HardRock Demo Store
                        </h1>
                        <p className="text-lg text-gray-300 mb-8">
                            Discover amazing products at great prices. This is a demo e-commerce platform
                            showcasing modern web development with Laravel, React, and TypeScript.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/category/electronics">
                                <Button size="lg">
                                    Shop Now
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/admin">
                                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
                                    View Admin
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
                <CategoryNav categories={categories} />
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                    <Link
                        href="/search"
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                        View all
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <ProductGrid products={featuredProducts} />
            </section>

            {/* Demo Banner */}
            <section className="bg-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        This is a Demo Store
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Built with Laravel 12, Inertia.js, React 18, TypeScript, and Tailwind CSS.
                        Login as admin to explore the full admin panel functionality.
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Admin: admin@hardrock-co.com / demo1234</p>
                        <p>Customer: customer@hardrock-co.com / demo1234</p>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}

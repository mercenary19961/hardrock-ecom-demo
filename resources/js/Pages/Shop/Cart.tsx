import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ShopLayout from '@/Layouts/ShopLayout';
import { Button } from '@/Components/ui';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ArrowLeft, Trash2, Minus, Plus } from 'lucide-react';

function CartContent() {
    const { i18n } = useTranslation();
    const language = i18n.language;
    const { cart, updateQuantity, removeItem, loading } = useCart();

    const handleQuantityChange = async (itemId: number, newQuantity: number, maxStock: number) => {
        if (newQuantity >= 1 && newQuantity <= maxStock) {
            await updateQuantity(itemId, newQuantity);
        }
    };

    const handleRemove = async (itemId: number) => {
        await removeItem(itemId);
    };

    return (
        <>
            <Head title="Shopping Cart" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Continue Shopping
                    </Link>
                </div>

                {cart.items.length === 0 ? (
                    <div className="text-center py-16">
                        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Your cart is empty
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Looks like you haven't added any items to your cart yet.
                        </p>
                        <Link href="/">
                            <Button>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                {cart.items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`p-4 sm:p-6 ${index !== cart.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <Link href={`/product/${item.product.slug}`} className="flex-shrink-0">
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden">
                                                    {item.product.image ? (
                                                        <img
                                                            src={item.product.image}
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="h-8 w-8 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/product/${item.product.slug}`}
                                                            className="font-medium text-gray-900 hover:text-gray-600 line-clamp-2"
                                                        >
                                                            {item.product.name}
                                                        </Link>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {formatPrice(item.product.price, language)} each
                                                        </p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-semibold text-gray-900">
                                                            {formatPrice(item.subtotal, language)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Quantity & Remove */}
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.product.stock)}
                                                            disabled={loading || item.quantity <= 1}
                                                            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-10 text-center font-medium tabular-nums">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.product.stock)}
                                                            disabled={loading || item.quantity >= item.product.stock}
                                                            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemove(item.id)}
                                                        disabled={loading}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Subtotal ({cart.total_items} {cart.total_items === 1 ? 'item' : 'items'})
                                        </span>
                                        <span className="font-medium text-gray-900">{formatPrice(cart.subtotal, language)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Delivery</span>
                                        <span className="text-green-600">Free</span>
                                    </div>
                                </div>
                                <div className="border-t mt-4 pt-4">
                                    <div className="flex justify-between text-base font-semibold">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-gray-900">{formatPrice(cart.subtotal, language)}</span>
                                    </div>
                                </div>
                                <Link href="/checkout" className="block mt-6">
                                    <Button size="lg" className="w-full">
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default function Cart() {
    return (
        <ShopLayout>
            <CartContent />
        </ShopLayout>
    );
}

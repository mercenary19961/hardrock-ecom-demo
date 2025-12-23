import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { CartItem } from '@/Components/shop/CartItem';
import { Button } from '@/Components/ui';
import { Cart as CartType } from '@/types/models';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

interface Props {
    cart: CartType;
}

export default function Cart({ cart }: Props) {
    return (
        <ShopLayout>
            <Head title="Shopping Cart" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="p-4">
                                        <CartItem item={item} />
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/"
                                className="inline-flex items-center text-gray-600 hover:text-gray-900 mt-4"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Continue Shopping
                            </Link>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal ({cart.total_items} items)</span>
                                        <span>{formatPrice(cart.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Tax</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                                        <span>Total</span>
                                        <span>{formatPrice(cart.subtotal)}</span>
                                    </div>
                                </div>
                                <Link href="/checkout">
                                    <Button size="lg" className="w-full">
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}

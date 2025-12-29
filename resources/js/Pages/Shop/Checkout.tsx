import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { Button, Input, Card, CardHeader, CardContent } from '@/Components/ui';
import { Cart, User } from '@/types/models';
import { formatPrice } from '@/lib/utils';
import { Truck, RotateCcw, Clock } from 'lucide-react';

interface Props {
    cart: Cart;
    stockErrors: { product: string; requested: number; available: number }[];
    user: User | null;
}

export default function Checkout({ cart, stockErrors, user }: Props) {
    const [billingSame, setBillingSame] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        customer_name: user?.name || '',
        customer_email: user?.email || '',
        customer_phone: '',
        shipping_street: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postal_code: '',
        shipping_country: 'Jordan',
        billing_same: true,
        billing_street: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        billing_country: 'Jordan',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/checkout');
    };

    const FREE_DELIVERY_THRESHOLD = 100;
    const deliveryFee = cart.subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 5;
    const total = cart.subtotal + deliveryFee;

    return (
        <ShopLayout>
            <Head title="Checkout" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                {stockErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h3 className="text-red-800 font-semibold mb-2">Stock Issues</h3>
                        {stockErrors.map((error, index) => (
                            <p key={index} className="text-red-700 text-sm">
                                {error.product}: Only {error.available} available (you requested {error.requested})
                            </p>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Contact */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">Contact Information</h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Full Name"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            error={errors.customer_name}
                                            required
                                        />
                                        <Input
                                            label="Email"
                                            type="email"
                                            value={data.customer_email}
                                            onChange={(e) => setData('customer_email', e.target.value)}
                                            error={errors.customer_email}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Phone (optional)"
                                        type="tel"
                                        value={data.customer_phone}
                                        onChange={(e) => setData('customer_phone', e.target.value)}
                                        error={errors.customer_phone}
                                    />
                                </CardContent>
                            </Card>

                            {/* Shipping */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">Shipping Address</h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input
                                        label="Street Address"
                                        value={data.shipping_street}
                                        onChange={(e) => setData('shipping_street', e.target.value)}
                                        error={errors.shipping_street}
                                        required
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="City"
                                            value={data.shipping_city}
                                            onChange={(e) => setData('shipping_city', e.target.value)}
                                            error={errors.shipping_city}
                                            required
                                        />
                                        <Input
                                            label="State/Province"
                                            value={data.shipping_state}
                                            onChange={(e) => setData('shipping_state', e.target.value)}
                                            error={errors.shipping_state}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Postal Code"
                                            value={data.shipping_postal_code}
                                            onChange={(e) => setData('shipping_postal_code', e.target.value)}
                                            error={errors.shipping_postal_code}
                                            required
                                        />
                                        <Input
                                            label="Country"
                                            value={data.shipping_country}
                                            onChange={(e) => setData('shipping_country', e.target.value)}
                                            error={errors.shipping_country}
                                            required
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Billing */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Billing Address</h2>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={billingSame}
                                                onChange={(e) => {
                                                    setBillingSame(e.target.checked);
                                                    setData('billing_same', e.target.checked);
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600">Same as shipping</span>
                                        </label>
                                    </div>
                                </CardHeader>
                                {!billingSame && (
                                    <CardContent className="space-y-4">
                                        <Input
                                            label="Street Address"
                                            value={data.billing_street}
                                            onChange={(e) => setData('billing_street', e.target.value)}
                                            error={errors.billing_street}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="City"
                                                value={data.billing_city}
                                                onChange={(e) => setData('billing_city', e.target.value)}
                                                error={errors.billing_city}
                                            />
                                            <Input
                                                label="Postal Code"
                                                value={data.billing_postal_code}
                                                onChange={(e) => setData('billing_postal_code', e.target.value)}
                                                error={errors.billing_postal_code}
                                            />
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Notes */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">Order Notes (optional)</h2>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none"
                                        placeholder="Special instructions for your order..."
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">Order Summary</h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 mb-6">
                                        {cart.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {item.product.name} × {item.quantity}
                                                </span>
                                                <span>{formatPrice(item.subtotal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span>{formatPrice(cart.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Delivery</span>
                                            {deliveryFee === 0 ? (
                                                <span className="text-green-600">Free</span>
                                            ) : (
                                                <span>{formatPrice(deliveryFee)}</span>
                                            )}
                                        </div>
                                        <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                                            <span>Total</span>
                                            <span>{formatPrice(total)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full mt-6"
                                        disabled={processing || stockErrors.length > 0}
                                    >
                                        Place Order (Demo)
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        This is a demo. No payment will be processed.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Delivery & Returns Policy */}
                            <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Truck className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Free Delivery</p>
                                        <p className="text-xs text-gray-500">On orders over {formatPrice(FREE_DELIVERY_THRESHOLD)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Fast Delivery</p>
                                        <p className="text-xs text-gray-500">Same day or next day delivery. Available Saturday to Thursday.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <RotateCcw className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                                        <p className="text-xs text-gray-500">14-day return policy for unused items</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </ShopLayout>
    );
}

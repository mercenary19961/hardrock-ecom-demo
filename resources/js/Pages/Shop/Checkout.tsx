import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ShopLayout from '@/Layouts/ShopLayout';
import { Button, Input, Card, CardHeader, CardContent } from '@/Components/ui';
import { Cart, User } from '@/types/models';
import { formatPrice } from '@/lib/utils';
import { Truck, RotateCcw, Clock, ArrowLeft } from 'lucide-react';

interface Props {
    cart: Cart;
    stockErrors: { product: string; requested: number; available: number }[];
    user: User | null;
}

export default function Checkout({ cart, stockErrors, user }: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;
    const { data, setData, post, processing, errors } = useForm({
        customer_name: user?.name || '',
        customer_email: user?.email || '',
        customer_phone: '',
        delivery_area: '',
        delivery_street: '',
        delivery_building: '',
        delivery_notes: '',
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
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Cart
                    </Link>
                </div>

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
                                            id="customer_name"
                                            name="customer_name"
                                            label="Full Name"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            error={errors.customer_name}
                                            placeholder="e.g., Ahmad Mohammad"
                                            autoComplete="name"
                                            required
                                        />
                                        <Input
                                            id="customer_email"
                                            name="customer_email"
                                            label="Email"
                                            type="email"
                                            value={data.customer_email}
                                            onChange={(e) => setData('customer_email', e.target.value)}
                                            error={errors.customer_email}
                                            placeholder="e.g., ahmad@example.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                    <Input
                                        id="customer_phone"
                                        name="customer_phone"
                                        label="Phone Number"
                                        type="tel"
                                        value={data.customer_phone}
                                        onChange={(e) => setData('customer_phone', e.target.value)}
                                        error={errors.customer_phone}
                                        placeholder="e.g., 079 123 4567"
                                        autoComplete="tel"
                                        required
                                    />
                                </CardContent>
                            </Card>

                            {/* Delivery Address */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">Delivery Address</h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input
                                        id="delivery_area"
                                        name="delivery_area"
                                        label="Area / Neighborhood"
                                        value={data.delivery_area}
                                        onChange={(e) => setData('delivery_area', e.target.value)}
                                        error={errors.delivery_area}
                                        placeholder="e.g., Khalda, Abdoun, Sweifieh"
                                        autoComplete="address-level2"
                                        required
                                    />
                                    <Input
                                        id="delivery_street"
                                        name="delivery_street"
                                        label="Street Name"
                                        value={data.delivery_street}
                                        onChange={(e) => setData('delivery_street', e.target.value)}
                                        error={errors.delivery_street}
                                        placeholder="e.g., King Abdullah II Street"
                                        autoComplete="street-address"
                                        required
                                    />
                                    <Input
                                        id="delivery_building"
                                        name="delivery_building"
                                        label="Building / Floor / Apartment"
                                        value={data.delivery_building}
                                        onChange={(e) => setData('delivery_building', e.target.value)}
                                        error={errors.delivery_building}
                                        placeholder="e.g., Building 15, Floor 3, Apt 5"
                                        autoComplete="address-line2"
                                        required
                                    />
                                    <div>
                                        <label htmlFor="delivery_notes" className="block text-sm font-medium text-gray-700 mb-1">
                                            Delivery Instructions (optional)
                                        </label>
                                        <textarea
                                            id="delivery_notes"
                                            name="delivery_notes"
                                            value={data.delivery_notes}
                                            onChange={(e) => setData('delivery_notes', e.target.value)}
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none text-sm"
                                            placeholder="e.g., Ring the doorbell twice, leave at the door, etc."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes */}
                            <Card>
                                <CardHeader>
                                    <label htmlFor="order_notes" className="text-lg font-semibold">
                                        Order Notes (optional)
                                    </label>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        id="order_notes"
                                        name="notes"
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
                                                <span>{formatPrice(item.subtotal, language)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span>{formatPrice(cart.subtotal, language)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Delivery</span>
                                            {deliveryFee === 0 ? (
                                                <span className="text-green-600">Free</span>
                                            ) : (
                                                <span>{formatPrice(deliveryFee, language)}</span>
                                            )}
                                        </div>
                                        <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                                            <span>Total</span>
                                            <span>{formatPrice(total, language)}</span>
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
                                        <p className="text-xs text-gray-500">On orders over {formatPrice(FREE_DELIVERY_THRESHOLD, language)}</p>
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

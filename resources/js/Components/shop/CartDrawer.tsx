import { Fragment } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from './CartItem';
import { Button } from '@/Components/ui';
import { formatPrice } from '@/lib/utils';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { i18n } = useTranslation();
    const language = i18n.language;
    const { cart, loading } = useCart();

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-white shadow-xl">
                                        <div className="flex items-center justify-between px-4 py-4 border-b">
                                            <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                                                <ShoppingBag className="h-5 w-5" />
                                                Cart ({cart.total_items})
                                            </Dialog.Title>
                                            <button
                                                onClick={onClose}
                                                className="p-2 rounded-lg hover:bg-gray-100"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-4 py-4">
                                            {cart.items.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center">
                                                    <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                                                    <p className="text-gray-500">Your cart is empty</p>
                                                    <Link
                                                        href="/"
                                                        className="mt-4 text-gray-900 underline"
                                                        onClick={onClose}
                                                    >
                                                        Continue shopping
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {cart.items.map((item) => (
                                                        <CartItem key={item.id} item={item} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {cart.items.length > 0 && (
                                            <div className="border-t px-4 py-4 space-y-4">
                                                <div className="flex justify-between text-lg font-semibold">
                                                    <span>Subtotal</span>
                                                    <span>{formatPrice(cart.subtotal)}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Shipping and taxes calculated at checkout.
                                                </p>
                                                <div className="space-y-2">
                                                    <Link href="/checkout" onClick={onClose}>
                                                        <Button className="w-full" size="lg">
                                                            Checkout
                                                        </Button>
                                                    </Link>
                                                    <Link href="/cart" onClick={onClose}>
                                                        <Button variant="outline" className="w-full">
                                                            View Cart
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

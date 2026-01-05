import { Fragment } from 'react';
import { Link } from '@inertiajs/react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/Components/ui';
import { formatPrice, getImageUrl } from '@/lib/utils';
import { Product } from '@/types/models';

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

function WishlistItem({ product, onClose }: { product: Product; onClose: () => void }) {
    const { removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    // Get image URL - check primary_image first, then images array
    const getProductImageUrl = () => {
        if (product.primary_image?.url) {
            return product.primary_image.url;
        }
        if (product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            // Use url property if available, otherwise fallback to getImageUrl
            if (firstImage.url) {
                return firstImage.url;
            }
            return getImageUrl(firstImage.path, product.id, firstImage.sort_order);
        }
        return '/images/placeholder.jpg';
    };

    const imageUrl = getProductImageUrl();

    const handleAddToCart = async () => {
        try {
            await addToCart(product.id, 1);
            removeFromWishlist(product.id);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    return (
        <div className="flex gap-4 py-4 border-b border-gray-100">
            <Link
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="flex-shrink-0"
            >
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-20 h-20 object-contain rounded-lg bg-gray-50"
                />
            </Link>
            <div className="flex-1 min-w-0">
                <Link
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="text-sm font-medium text-gray-900 hover:text-gray-600 line-clamp-2"
                >
                    {product.name}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                    </span>
                    {product.compare_price && product.compare_price > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.compare_price)}
                        </span>
                    )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <button
                        onClick={handleAddToCart}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        <ShoppingCart className="h-3 w-3" />
                        Add to Cart
                    </button>
                    <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove from wishlist"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
    const { items, clearWishlist } = useWishlist();

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
                                                <Heart className="h-5 w-5" />
                                                Wishlist ({items.length})
                                            </Dialog.Title>
                                            <button
                                                onClick={onClose}
                                                className="p-2 rounded-lg hover:bg-gray-100"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-4">
                                            {items.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center">
                                                    <Heart className="h-16 w-16 text-gray-300 mb-4" />
                                                    <p className="text-gray-500">Your wishlist is empty</p>
                                                    <Link
                                                        href="/"
                                                        className="mt-4 text-gray-900 underline"
                                                        onClick={onClose}
                                                    >
                                                        Start shopping
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div>
                                                    {items.map((product) => (
                                                        <WishlistItem
                                                            key={product.id}
                                                            product={product}
                                                            onClose={onClose}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {items.length > 0 && (
                                            <div className="border-t px-4 py-4">
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={clearWishlist}
                                                >
                                                    Clear Wishlist
                                                </Button>
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

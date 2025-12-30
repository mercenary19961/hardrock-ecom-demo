import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { QuantitySelector } from '@/Components/shop/QuantitySelector';
import { Button, Badge } from '@/Components/ui';
import { useCart } from '@/contexts/CartContext';
import { Product as ProductType, Breadcrumb } from '@/types/models';
import { formatPrice, getImageUrl, getDiscountPercentage } from '@/lib/utils';
import { ChevronRight, ShoppingCart, Check, Bell, Star } from 'lucide-react';

function StarRating({ rating, count }: { rating: number; count: number }) {
    if (count === 0) return null;

    const getStarFill = (starPosition: number) => {
        if (rating >= starPosition) return 'full';
        if (rating >= starPosition - 0.5) return 'half';
        return 'empty';
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                    const fill = getStarFill(star);
                    return (
                        <div key={star} className="relative h-5 w-5">
                            {/* Background empty star */}
                            <Star className="absolute inset-0 h-full w-full fill-gray-200 text-gray-200" />
                            {/* Filled portion */}
                            {fill !== 'empty' && (
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: fill === 'half' ? '50%' : '100%' }}
                                >
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <span className="text-sm text-gray-600">
                {rating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
            </span>
        </div>
    );
}

interface Props {
    product: ProductType;
    relatedProducts: ProductType[];
    breadcrumbs: Breadcrumb[];
}

function ProductContent({ product, relatedProducts, breadcrumbs }: Props) {
    const { addToCart, loading } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [added, setAdded] = useState(false);

    // Check localStorage for previously requested notifications
    const storageKey = `notify_product_${product.id}`;
    const [notifyRequested, setNotifyRequested] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(storageKey) === 'true';
        }
        return false;
    });

    const handleNotifyRequest = () => {
        setNotifyRequested(true);
        localStorage.setItem(storageKey, 'true');
    };

    const images = product.images || [];
    const hasDiscount = product.compare_price && product.compare_price > product.price;

    const handleAddToCart = async () => {
        try {
            await addToCart(product.id, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (error) {
            console.error('Failed to add to cart');
        }
    };

    return (
        <>
            <Head title={product.name} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-gray-900">Home</Link>
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.slug} className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4" />
                            {index === breadcrumbs.length - 1 ? (
                                <span className="text-gray-900 line-clamp-1">{crumb.name}</span>
                            ) : (
                                <Link href={`/category/${crumb.slug}`} className="hover:text-gray-900">
                                    {crumb.name}
                                </Link>
                            )}
                        </span>
                    ))}
                </nav>

                {/* Product Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Images */}
                    <div>
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                            {images[selectedImage] ? (
                                <img
                                    src={getImageUrl(images[selectedImage].path, product.id, images[selectedImage].sort_order)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-400">No image available</span>
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                            selectedImage === index
                                                ? 'border-gray-900'
                                                : 'border-transparent'
                                        }`}
                                    >
                                        <img
                                            src={getImageUrl(image.path, product.id, image.sort_order)}
                                            alt={image.alt_text || product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        {product.category && (
                            <div className="mb-4">
                                <Link
                                    href={`/category/${product.category.slug}`}
                                    className="text-sm text-gray-500 hover:text-gray-900"
                                >
                                    {product.category.name}
                                </Link>
                            </div>
                        )}

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                        {product.rating_count > 0 && (
                            <div className="mb-4">
                                <StarRating rating={product.average_rating} count={product.rating_count} />
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(product.price)}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-xl text-gray-400 line-through">
                                        {formatPrice(product.compare_price!)}
                                    </span>
                                    <Badge variant="danger">
                                        Save {getDiscountPercentage(product.price, product.compare_price!)}%
                                    </Badge>
                                </>
                            )}
                        </div>

                        <div className="mb-6">
                            {product.stock > 0 ? (
                                <Badge variant="success">In Stock</Badge>
                            ) : (
                                <Badge variant="danger">Out of Stock</Badge>
                            )}
                        </div>

                        {product.short_description && (
                            <p className="text-gray-600 mb-6">{product.short_description}</p>
                        )}

                        {/* Add to Cart or Notify Me */}
                        {product.stock > 0 ? (
                            <div className="flex items-center gap-4 mb-8">
                                <QuantitySelector
                                    quantity={quantity}
                                    onChange={setQuantity}
                                    max={product.stock}
                                />
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={loading || added}
                                    size="lg"
                                    className="flex-1"
                                >
                                    {added ? (
                                        <>
                                            <Check className="mr-2 h-5 w-5" />
                                            Added to Cart
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="mr-2 h-5 w-5" />
                                            Add to Cart
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="mb-8">
                                <Button
                                    onClick={handleNotifyRequest}
                                    disabled={notifyRequested}
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                >
                                    {notifyRequested ? (
                                        <>
                                            <Check className="mr-2 h-5 w-5" />
                                            Request Submitted
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="mr-2 h-5 w-5" />
                                            Notify Me When Available
                                        </>
                                    )}
                                </Button>
                                {notifyRequested && (
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        We'll let you know when this product is back in stock.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div className="mt-8 pt-8 border-t">
                                <h2 className="text-lg font-semibold mb-4">Description</h2>
                                <div className="prose prose-sm text-gray-600 whitespace-pre-line">
                                    {product.description}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
                        <ProductGrid products={relatedProducts} />
                    </section>
                )}
            </div>
        </>
    );
}

export default function Product({ product, relatedProducts, breadcrumbs }: Props) {
    return (
        <ShopLayout>
            <ProductContent
                product={product}
                relatedProducts={relatedProducts}
                breadcrumbs={breadcrumbs}
            />
        </ShopLayout>
    );
}

import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { QuantitySelector } from '@/Components/shop/QuantitySelector';
import { Button, Badge } from '@/Components/ui';
import { useCart } from '@/contexts/CartContext';
import { useLocalized } from '@/hooks/useLocalized';
import { Product as ProductType, Breadcrumb } from '@/types/models';
import { formatPrice, formatNumber, getImageUrl, getDiscountPercentage } from '@/lib/utils';
import { ChevronRight, ShoppingCart, Check, Bell, Star } from 'lucide-react';

function StarRating({ rating, count, language }: { rating: number; count: number; language: string }) {
    if (count === 0 || rating == null) return null;

    const ratingValue = Number(rating) || 0;

    const getStarFill = (starPosition: number) => {
        if (ratingValue >= starPosition) return 'full';
        if (ratingValue >= starPosition - 0.5) return 'half';
        return 'empty';
    };

    const isArabic = language === 'ar';
    const formattedRating = new Intl.NumberFormat(isArabic ? 'ar-JO' : 'en-JO', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(ratingValue);

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
                {formattedRating} ({formatNumber(count, language)} {count === 1 ? (isArabic ? 'تقييم' : 'review') : (isArabic ? 'تقييمات' : 'reviews')})
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
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const { addToCart, loading } = useCart();
    const { getProductName, getProductDescription, getProductShortDescription, getCategoryName } = useLocalized();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [added, setAdded] = useState(false);

    // Get localized content
    const productName = getProductName(product);
    const productDescription = getProductDescription(product);
    const productShortDescription = getProductShortDescription(product);
    const categoryName = product.category ? getCategoryName(product.category) : '';

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
            <Head title={productName} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-hidden">
                    <Link href="/" className="hover:text-gray-900 flex-shrink-0">{t('common:home')}</Link>
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.slug} className="flex items-center gap-2 min-w-0">
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            {index === breadcrumbs.length - 1 ? (
                                <span
                                    className="text-gray-900 truncate max-w-[150px] sm:max-w-none cursor-default"
                                    title={crumb.name}
                                >
                                    {crumb.name}
                                </span>
                            ) : (
                                <Link href={`/category/${crumb.slug}`} className="hover:text-gray-900 whitespace-nowrap flex-shrink-0">
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
                                    alt={productName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-400">No image available</span>
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                                            selectedImage === index
                                                ? 'border-brand-purple'
                                                : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        <img
                                            src={getImageUrl(image.path, product.id, image.sort_order)}
                                            alt={image.alt_text || productName}
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
                                    {categoryName}
                                </Link>
                            </div>
                        )}

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{productName}</h1>

                        {product.rating_count > 0 && (
                            <div className="mb-4">
                                <StarRating rating={product.average_rating} count={product.rating_count} language={language} />
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(product.price, language)}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-xl text-gray-400 line-through">
                                        {formatPrice(product.compare_price!, language)}
                                    </span>
                                    <Badge variant="danger">
                                        {t('common:savePercent', { percent: getDiscountPercentage(product.price, product.compare_price!) })}
                                    </Badge>
                                </>
                            )}
                        </div>

                        <div className="mb-6">
                            {product.stock > 0 ? (
                                <Badge variant="success">{t('common:inStock')}</Badge>
                            ) : (
                                <Badge variant="danger">{t('common:outOfStock')}</Badge>
                            )}
                        </div>

                        {productShortDescription && (
                            <p className="text-gray-600 mb-6">{productShortDescription}</p>
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
                                            <Check className="me-2 h-5 w-5" />
                                            {t('common:addedToCart')}
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="me-2 h-5 w-5" />
                                            {t('common:addToCart')}
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
                                            <Check className="me-2 h-5 w-5" />
                                            {t('shop:requestSubmitted')}
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="me-2 h-5 w-5" />
                                            {t('shop:notifyMe')}
                                        </>
                                    )}
                                </Button>
                                {notifyRequested && (
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        {t('shop:notifyMeDescription')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {productDescription && (
                            <div className="mt-8 pt-8 border-t">
                                <h2 className="text-lg font-semibold mb-4">{t('shop:description')}</h2>
                                <div className="prose prose-sm text-gray-600 whitespace-pre-line">
                                    {productDescription}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('shop:relatedProducts')}</h2>
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

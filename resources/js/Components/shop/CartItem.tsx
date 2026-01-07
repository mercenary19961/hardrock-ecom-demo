import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/models';
import { useCart } from '@/contexts/CartContext';
import { QuantitySelector } from './QuantitySelector';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
    item: CartItemType;
    showRemove?: boolean;
}

export function CartItem({ item, showRemove = true }: CartItemProps) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const { updateQuantity, removeItem, loading } = useCart();

    // Get localized product name
    const productName = language === 'ar' && item.product.name_ar ? item.product.name_ar : item.product.name;

    const handleQuantityChange = async (quantity: number) => {
        await updateQuantity(item.id, quantity);
    };

    const handleRemove = async () => {
        await removeItem(item.id);
    };

    return (
        <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
            <Link href={`/product/${item.product.slug}`} className="flex-shrink-0">
                <img
                    src={item.product.image || '/images/placeholder.jpg'}
                    alt={productName}
                    className="w-20 h-20 object-cover rounded-lg"
                />
            </Link>
            <div className="flex-1 min-w-0">
                <Link
                    href={`/product/${item.product.slug}`}
                    className="font-medium text-gray-900 hover:text-gray-600 line-clamp-1"
                >
                    {productName}
                </Link>
                <p className="text-sm text-gray-500 mt-0.5">
                    {formatPrice(item.product.price, language)}
                </p>
                <div className="flex items-center justify-between mt-2">
                    <QuantitySelector
                        quantity={item.quantity}
                        onChange={handleQuantityChange}
                        max={item.product.stock}
                        disabled={loading}
                    />
                    {showRemove && (
                        <button
                            onClick={handleRemove}
                            disabled={loading}
                            className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50"
                            title={t('common:cart.removeFromCart')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className="text-right">
                <p className="font-medium">{formatPrice(item.subtotal, language)}</p>
            </div>
        </div>
    );
}

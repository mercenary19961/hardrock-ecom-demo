import { useLanguage } from '@/contexts/LanguageContext';
import { Product, Category } from '@/types/models';

/**
 * Hook to get localized content based on current language
 */
export function useLocalized() {
    const { language } = useLanguage();
    const isArabic = language === 'ar';

    /**
     * Get localized product name
     */
    const getProductName = (product: Product): string => {
        return isArabic && product.name_ar ? product.name_ar : product.name;
    };

    /**
     * Get localized product description
     */
    const getProductDescription = (product: Product): string | null => {
        return isArabic && product.description_ar ? product.description_ar : product.description;
    };

    /**
     * Get localized product short description
     */
    const getProductShortDescription = (product: Product): string | null => {
        return isArabic && product.short_description_ar ? product.short_description_ar : product.short_description;
    };

    /**
     * Get localized category name
     */
    const getCategoryName = (category: Category): string => {
        return isArabic && category.name_ar ? category.name_ar : category.name;
    };

    /**
     * Get localized category description
     */
    const getCategoryDescription = (category: Category | undefined): string | null => {
        if (!category) return null;
        return isArabic && category.description_ar ? category.description_ar : category.description;
    };

    return {
        isArabic,
        getProductName,
        getProductDescription,
        getProductShortDescription,
        getCategoryName,
        getCategoryDescription,
    };
}

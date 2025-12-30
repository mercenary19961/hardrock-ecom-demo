import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Navigation
        'nav.search': 'Search products...',
        'nav.login': 'Login',
        'nav.logout': 'Logout',
        'nav.profile': 'Profile',
        'nav.orders': 'My Orders',
        'nav.admin': 'Admin Panel',
        'nav.wishlist': 'Wishlist',
        'nav.cart': 'Cart',

        // Common
        'common.home': 'Home',
        'common.shop_now': 'Shop Now',
        'common.view_all': 'View all',
        'common.add_to_cart': 'Add to Cart',
        'common.added_to_cart': 'Added to Cart',
        'common.out_of_stock': 'Out of Stock',
        'common.in_stock': 'In Stock',
        'common.price': 'Price',
        'common.quantity': 'Quantity',
        'common.total': 'Total',
        'common.subtotal': 'Subtotal',
        'common.continue_shopping': 'Continue Shopping',
        'common.clear_all': 'Clear All',

        // Product
        'product.related': 'Related Products',
        'product.description': 'Description',
        'product.reviews': 'reviews',
        'product.notify_me': 'Notify Me When Available',
        'product.request_submitted': 'Request Submitted',

        // Cart
        'cart.title': 'Shopping Cart',
        'cart.empty': 'Your cart is empty',
        'cart.checkout': 'Checkout',
        'cart.remove': 'Remove',

        // Wishlist
        'wishlist.title': 'Wishlist',
        'wishlist.empty': 'Your wishlist is empty',
        'wishlist.start_shopping': 'Start shopping',
        'wishlist.clear': 'Clear Wishlist',

        // Checkout
        'checkout.title': 'Checkout',
        'checkout.contact': 'Contact Information',
        'checkout.delivery': 'Delivery Address',
        'checkout.order_notes': 'Order Notes (optional)',
        'checkout.place_order': 'Place Order',
        'checkout.name': 'Full Name',
        'checkout.email': 'Email',
        'checkout.phone': 'Phone Number',
        'checkout.area': 'Area / Neighborhood',
        'checkout.street': 'Street Name',
        'checkout.building': 'Building / Floor / Apartment',
        'checkout.delivery_notes': 'Delivery Instructions (optional)',
        'checkout.order_summary': 'Order Summary',
        'checkout.delivery_fee': 'Delivery',
        'checkout.free': 'Free',

        // Category
        'category.filter': 'Filters',
        'category.sort': 'Sort',
        'category.price_range': 'Price Range',
        'category.clear_filters': 'Clear All',
        'category.no_products': 'No products found',
        'category.products': 'products',

        // Footer
        'footer.shop': 'Shop',
        'footer.account': 'Account',
        'footer.contact': 'Contact',
        'footer.all_products': 'All Products',
        'footer.order_history': 'Order History',
        'footer.rights': 'All rights reserved.',
    },
    ar: {
        // Navigation
        'nav.search': 'ابحث عن المنتجات...',
        'nav.login': 'تسجيل الدخول',
        'nav.logout': 'تسجيل الخروج',
        'nav.profile': 'الملف الشخصي',
        'nav.orders': 'طلباتي',
        'nav.admin': 'لوحة التحكم',
        'nav.wishlist': 'قائمة الرغبات',
        'nav.cart': 'السلة',

        // Common
        'common.home': 'الرئيسية',
        'common.shop_now': 'تسوق الآن',
        'common.view_all': 'عرض الكل',
        'common.add_to_cart': 'أضف إلى السلة',
        'common.added_to_cart': 'تمت الإضافة',
        'common.out_of_stock': 'نفذ من المخزون',
        'common.in_stock': 'متوفر',
        'common.price': 'السعر',
        'common.quantity': 'الكمية',
        'common.total': 'المجموع',
        'common.subtotal': 'المجموع الفرعي',
        'common.continue_shopping': 'متابعة التسوق',
        'common.clear_all': 'مسح الكل',

        // Product
        'product.related': 'منتجات ذات صلة',
        'product.description': 'الوصف',
        'product.reviews': 'تقييم',
        'product.notify_me': 'أعلمني عند التوفر',
        'product.request_submitted': 'تم إرسال الطلب',

        // Cart
        'cart.title': 'سلة التسوق',
        'cart.empty': 'سلة التسوق فارغة',
        'cart.checkout': 'إتمام الشراء',
        'cart.remove': 'إزالة',

        // Wishlist
        'wishlist.title': 'قائمة الرغبات',
        'wishlist.empty': 'قائمة الرغبات فارغة',
        'wishlist.start_shopping': 'ابدأ التسوق',
        'wishlist.clear': 'مسح القائمة',

        // Checkout
        'checkout.title': 'إتمام الشراء',
        'checkout.contact': 'معلومات التواصل',
        'checkout.delivery': 'عنوان التوصيل',
        'checkout.order_notes': 'ملاحظات الطلب (اختياري)',
        'checkout.place_order': 'تأكيد الطلب',
        'checkout.name': 'الاسم الكامل',
        'checkout.email': 'البريد الإلكتروني',
        'checkout.phone': 'رقم الهاتف',
        'checkout.area': 'المنطقة / الحي',
        'checkout.street': 'اسم الشارع',
        'checkout.building': 'المبنى / الطابق / الشقة',
        'checkout.delivery_notes': 'تعليمات التوصيل (اختياري)',
        'checkout.order_summary': 'ملخص الطلب',
        'checkout.delivery_fee': 'التوصيل',
        'checkout.free': 'مجاني',

        // Category
        'category.filter': 'تصفية',
        'category.sort': 'ترتيب',
        'category.price_range': 'نطاق السعر',
        'category.clear_filters': 'مسح الكل',
        'category.no_products': 'لا توجد منتجات',
        'category.products': 'منتج',

        // Footer
        'footer.shop': 'تسوق',
        'footer.account': 'الحساب',
        'footer.contact': 'تواصل معنا',
        'footer.all_products': 'جميع المنتجات',
        'footer.order_history': 'سجل الطلبات',
        'footer.rights': 'جميع الحقوق محفوظة.',
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('language');
            return (saved as Language) || 'en';
        }
        return 'en';
    });

    const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = direction;
    }, [language, direction]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    verified_via?: 'email' | 'google' | null;
    role?: 'admin' | 'editor' | 'customer';
}

export interface SiteSettings {
    store_name: string;
    store_name_ar: string;
    store_email: string;
    store_phone: string;
    store_address: string;
    store_address_ar: string;
    currency_code: string;
    currency_symbol: string;
    currency_symbol_ar: string;
    low_stock_threshold: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    siteSettings?: SiteSettings;
};

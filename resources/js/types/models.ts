export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'customer';
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    parent_id: number | null;
    sort_order: number;
    is_active: boolean;
    products_count?: number;
    children?: Category[];
    parent?: Category;
    created_at: string;
    updated_at: string;
}

export interface ProductImage {
    id: number;
    product_id: number;
    path: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
    url: string;
}

export interface Product {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    price: number;
    compare_price: number | null;
    sku: string;
    stock: number;
    is_active: boolean;
    is_featured: boolean;
    category?: Category;
    images?: ProductImage[];
    primary_image?: ProductImage;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: number;
    quantity: number;
    subtotal: number;
    product: {
        id: number;
        name: string;
        slug: string;
        price: number;
        stock: number;
        image: string | null;
    };
}

export interface Cart {
    items: CartItem[];
    total_items: number;
    subtotal: number;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number | null;
    product_name: string;
    product_sku: string;
    price: number;
    quantity: number;
    subtotal: number;
    product?: Product;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
    id: number;
    user_id: number | null;
    order_number: string;
    status: OrderStatus;
    subtotal: number;
    tax: number;
    total: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    shipping_address: Address;
    billing_address: Address | null;
    notes: string | null;
    items?: OrderItem[];
    user?: User;
    status_color?: string;
    created_at: string;
    updated_at: string;
}

export interface Breadcrumb {
    name: string;
    slug: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface DashboardStats {
    total_products: number;
    total_categories: number;
    total_orders: number;
    total_customers: number;
    revenue: number;
    pending_orders: number;
}

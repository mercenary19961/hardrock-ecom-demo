export interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "customer";
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    name_ar: string | null;
    slug: string;
    description: string | null;
    description_ar: string | null;
    image: string | null;
    parent_id: number | null;
    sort_order: number;
    is_active: boolean;
    low_stock_threshold: number;
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

export interface SizeStock {
    [size: string]: number;
}

export interface Product {
    id: number;
    category_id: number;
    name: string;
    name_ar: string | null;
    slug: string;
    description: string | null;
    description_ar: string | null;
    short_description: string | null;
    short_description_ar: string | null;
    price: number;
    compare_price: number | null;
    sku: string;
    stock: number;
    low_stock_threshold: number | null;
    is_active: boolean;
    is_featured: boolean;
    times_purchased: number;
    average_rating: number;
    rating_count: number;
    view_count: number;
    // Variant fields
    color?: string | null;
    color_hex?: string | null;
    available_sizes?: string[] | null;
    size_stock?: SizeStock | null;
    product_group?: string | null;
    // Relations
    category?: Category;
    images?: ProductImage[];
    primary_image?: ProductImage;
    color_variants?: Product[];
    reviews?: Review[];
    effective_low_stock_threshold?: number;
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
        name_ar?: string;
        slug: string;
        price: number;
        compare_price: number | null;
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
    area: string;
    street: string;
    building: string;
    delivery_notes?: string;
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

export type OrderStatus =
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

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

export interface Review {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    title: string | null;
    title_ar: string | null;
    comment: string | null;
    comment_ar: string | null;
    is_verified_purchase: boolean;
    helpful_count: number;
    is_helpful: boolean;
    language: string;
    user?: User;
    product?: Product;
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

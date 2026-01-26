import { createContext, useContext, ReactNode } from "react";
import { router, usePage } from "@inertiajs/react";
import { Cart } from "@/types/models";
import { PageProps } from "@/types";

interface AddToCartOptions {
    color?: string | null;
    colorHex?: string | null;
    size?: string | null;
    selectedImageId?: number | null;
}

interface CartContextType {
    cart: Cart;
    loading: boolean;
    addToCart: (productId: number, quantity?: number, options?: AddToCartOptions) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    refreshCart: () => Promise<void>;
    isInCart: (productId: number, color?: string | null, size?: string | null) => boolean;
}

const defaultCart: Cart = {
    items: [],
    total_items: 0,
    subtotal: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { cart = defaultCart } = usePage<any>().props;

    const refreshCart = async () => {
        router.reload({ only: ["cart"] });
    };

    const addToCart = async (productId: number, quantity = 1, options?: AddToCartOptions) => {
        router.post(
            "/cart/add",
            {
                product_id: productId,
                quantity,
                color: options?.color || null,
                color_hex: options?.colorHex || null,
                size: options?.size || null,
                selected_image_id: options?.selectedImageId || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        router.patch(
            `/cart/${itemId}`,
            { quantity },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const removeItem = async (itemId: number) => {
        router.delete(`/cart/${itemId}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const isInCart = (productId: number, color?: string | null, size?: string | null) => {
        return cart.items.some((item: any) => {
            const productMatch = item.product.id === productId;
            // If no variant specified, just check product id
            if (!color && !size) {
                return productMatch;
            }
            // If variants specified, check for exact match
            return productMatch && item.color === color && item.size === size;
        });
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                loading: false, // Inertia handles its own loading state
                addToCart,
                updateQuantity,
                removeItem,
                refreshCart,
                isInCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

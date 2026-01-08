import { createContext, useContext, ReactNode } from "react";
import { router, usePage } from "@inertiajs/react";
import { Cart } from "@/types/models";
import { PageProps } from "@/types";

interface CartContextType {
    cart: Cart;
    loading: boolean;
    addToCart: (productId: number, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    refreshCart: () => Promise<void>;
    isInCart: (productId: number) => boolean;
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

    const addToCart = async (productId: number, quantity = 1) => {
        router.post(
            "/cart/add",
            {
                product_id: productId,
                quantity,
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

    const isInCart = (productId: number) => {
        return cart.items.some((item: any) => item.product.id === productId);
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

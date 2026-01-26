import { createContext, useContext, ReactNode, useState, useCallback, useRef, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { Cart, CartItem } from "@/types/models";
import { PageProps } from "@/types";

interface AddToCartOptions {
    color?: string | null;
    colorHex?: string | null;
    size?: string | null;
    selectedImageId?: number | null;
}

// Optimistic state for pending updates
interface OptimisticUpdate {
    itemId: number;
    quantity: number;
    originalQuantity: number;
}

interface CartContextType {
    cart: Cart;
    loading: boolean;
    addToCart: (productId: number, quantity?: number, options?: AddToCartOptions) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    refreshCart: () => Promise<void>;
    isInCart: (productId: number, color?: string | null, size?: string | null) => boolean;
    getOptimisticQuantity: (itemId: number) => number | null;
    pendingRemovals: Set<number>;
}

const defaultCart: Cart = {
    items: [],
    total_items: 0,
    subtotal: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { cart: serverCart = defaultCart } = usePage<any>().props;

    // Optimistic updates state
    const [optimisticUpdates, setOptimisticUpdates] = useState<Map<number, OptimisticUpdate>>(new Map());
    const [pendingRemovals, setPendingRemovals] = useState<Set<number>>(new Set());

    // Debounce timers for quantity updates
    const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

    // Compute optimistic cart by merging server state with pending updates
    const cart: Cart = {
        ...serverCart,
        items: serverCart.items
            .filter((item: CartItem) => !pendingRemovals.has(item.id))
            .map((item: CartItem) => {
                const optimistic = optimisticUpdates.get(item.id);
                if (optimistic) {
                    const newQuantity = optimistic.quantity;
                    return {
                        ...item,
                        quantity: newQuantity,
                        subtotal: item.product.price * newQuantity,
                    };
                }
                return item;
            }),
        total_items: serverCart.items
            .filter((item: CartItem) => !pendingRemovals.has(item.id))
            .reduce((sum: number, item: CartItem) => {
                const optimistic = optimisticUpdates.get(item.id);
                return sum + (optimistic ? optimistic.quantity : item.quantity);
            }, 0),
        subtotal: serverCart.items
            .filter((item: CartItem) => !pendingRemovals.has(item.id))
            .reduce((sum: number, item: CartItem) => {
                const optimistic = optimisticUpdates.get(item.id);
                const qty = optimistic ? optimistic.quantity : item.quantity;
                return sum + (item.product.price * qty);
            }, 0),
    };

    // Clear optimistic state when server state confirms the update
    useEffect(() => {
        setOptimisticUpdates(prev => {
            const next = new Map(prev);
            let changed = false;

            prev.forEach((update, itemId) => {
                const serverItem = serverCart.items.find((item: CartItem) => item.id === itemId);
                // If server has caught up with our optimistic update, clear it
                if (serverItem && serverItem.quantity === update.quantity) {
                    next.delete(itemId);
                    changed = true;
                }
            });

            return changed ? next : prev;
        });

        // Clear pending removals for items no longer in server cart
        setPendingRemovals(prev => {
            const serverItemIds = new Set(serverCart.items.map((item: CartItem) => item.id));
            const next = new Set<number>();
            let changed = false;

            prev.forEach(id => {
                if (serverItemIds.has(id)) {
                    next.add(id);
                } else {
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [serverCart]);

    // Get optimistic quantity for an item (used by CartItem component)
    const getOptimisticQuantity = useCallback((itemId: number): number | null => {
        const optimistic = optimisticUpdates.get(itemId);
        return optimistic ? optimistic.quantity : null;
    }, [optimisticUpdates]);

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
        // Find original quantity from server state
        const serverItem = serverCart.items.find((item: CartItem) => item.id === itemId);
        const originalQuantity = serverItem?.quantity ?? quantity;

        // Apply optimistic update immediately
        setOptimisticUpdates(prev => {
            const next = new Map(prev);
            next.set(itemId, { itemId, quantity, originalQuantity });
            return next;
        });

        // Clear any existing debounce timer for this item
        const existingTimer = debounceTimers.current.get(itemId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Debounce the server request (300ms delay for rapid clicks)
        const timer = setTimeout(() => {
            debounceTimers.current.delete(itemId);

            router.patch(
                `/cart/${itemId}`,
                { quantity },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ["cart"],
                    onError: () => {
                        // Rollback on error
                        setOptimisticUpdates(prev => {
                            const next = new Map(prev);
                            next.delete(itemId);
                            return next;
                        });
                    },
                }
            );
        }, 300);

        debounceTimers.current.set(itemId, timer);
    };

    const removeItem = async (itemId: number) => {
        // Apply optimistic removal immediately
        setPendingRemovals(prev => new Set(prev).add(itemId));

        router.delete(`/cart/${itemId}`, {
            preserveState: true,
            preserveScroll: true,
            only: ["cart"],
            onError: () => {
                // Rollback on error
                setPendingRemovals(prev => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });
            },
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
                getOptimisticQuantity,
                pendingRemovals,
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

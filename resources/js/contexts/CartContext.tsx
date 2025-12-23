import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Cart, CartItem } from '@/types/models';

interface CartContextType {
    cart: Cart;
    loading: boolean;
    addToCart: (productId: number, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    refreshCart: () => Promise<void>;
}

const defaultCart: Cart = {
    items: [],
    total_items: 0,
    subtotal: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<Cart>(defaultCart);
    const [loading, setLoading] = useState(false);

    const refreshCart = async () => {
        try {
            const response = await axios.get('/cart/data');
            setCart(response.data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    };

    const addToCart = async (productId: number, quantity = 1) => {
        setLoading(true);
        try {
            const response = await axios.post('/cart/add', {
                product_id: productId,
                quantity,
            });
            setCart(response.data.cart);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/cart/${itemId}`, { quantity });
            setCart(response.data.cart);
        } catch (error) {
            console.error('Failed to update quantity:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (itemId: number) => {
        setLoading(true);
        try {
            const response = await axios.delete(`/cart/${itemId}`);
            setCart(response.data.cart);
        } catch (error) {
            console.error('Failed to remove item:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCart();
    }, []);

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                addToCart,
                updateQuantity,
                removeItem,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

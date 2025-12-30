import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types/models';

interface WishlistContextType {
    items: Product[];
    loading: boolean;
    isInWishlist: (productId: number) => boolean;
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: number) => void;
    toggleWishlist: (product: Product) => void;
    clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'hardrock_wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Load wishlist from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load wishlist:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, loading]);

    const isInWishlist = (productId: number) => {
        return items.some(item => item.id === productId);
    };

    const addToWishlist = (product: Product) => {
        if (!isInWishlist(product.id)) {
            setItems(prev => [...prev, product]);
        }
    };

    const removeFromWishlist = (productId: number) => {
        setItems(prev => prev.filter(item => item.id !== productId));
    };

    const toggleWishlist = (product: Product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const clearWishlist = () => {
        setItems([]);
    };

    return (
        <WishlistContext.Provider
            value={{
                items,
                loading,
                isInWishlist,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                clearWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}

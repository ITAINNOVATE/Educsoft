import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const platformId = import.meta.env.VITE_PLATFORM_ID;

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!platformId) {
                throw new Error("VITE_PLATFORM_ID est manquant dans les variables d'environnement.");
            }

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('platform_id', platformId);

            if (error) {
                throw error;
            }

            console.log("Produits récupérés depuis Supabase (EDUSOFT) :", data);
            setProducts(data || []);
        } catch (err) {
            console.error("Erreur lors de la récupération des produits :", err);
            setError(err.message);
            // Fallback: array vide
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <ProductContext.Provider value={{ products, loading, error, fetchProducts }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

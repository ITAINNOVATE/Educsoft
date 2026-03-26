import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = `${config.API_URL}/auth`;

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password, establishmentCode) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password, establishmentCode });
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
                error: error.response?.data?.error || null,
            };
        }
    };

    const switchEstablishment = async (establishmentId) => {
        try {
            const token = user?.token;
            const response = await axios.post(`${API_URL}/switch-establishment`, 
                { establishmentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            return { success: true };
        } catch (error) {
            console.error("Switch failed:", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Switch failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, switchEstablishment, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

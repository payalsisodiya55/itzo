import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { getWithDedupe } from '@core/api/dedupe';
import { isTokenExpired } from '@core/utils/token';

const AuthContext = createContext(undefined);

const ROLE_STORAGE_KEYS = {
    customer: 'auth_customer',
    seller: 'auth_seller',
    admin: 'auth_admin',
    delivery: 'auth_delivery'
};

const LEGACY_ROLE_STORAGE_KEYS = {
    customer: ['user_accessToken', 'accessToken'],
    seller: ['seller_accessToken'],
    admin: ['admin_accessToken'],
    delivery: ['delivery_accessToken']
};

const extractProfilePayload = (response) => {
    const raw = response?.data?.result ?? response?.data?.data ?? null;
    if (raw && typeof raw === 'object' && raw.user) {
        return raw.user;
    }
    return raw;
};

const getProfileEndpoint = (role) => {
    if (role === 'seller') return '/seller/profile';
    return '/auth/me';
};

export const AuthProvider = ({ children }) => {
    // Current role based on URL
    const getCurrentRoleFromUrl = () => {
        const path = window.location.pathname;
        if (path.startsWith('/seller')) return 'seller';
        if (path.startsWith('/admin')) return 'admin';
        if (path.startsWith('/delivery')) return 'delivery';
        return 'customer';
    };

    const getSafeToken = (key) => {
        const val = localStorage.getItem(ROLE_STORAGE_KEYS[key]);
        const fallbackVal =
            val ||
            LEGACY_ROLE_STORAGE_KEYS[key]?.map((storageKey) => localStorage.getItem(storageKey)).find(Boolean) ||
            null;
        if (!fallbackVal) return null;
        const normalizedVal = fallbackVal;
        if (normalizedVal.startsWith('{')) {
            try { return JSON.parse(normalizedVal).token; } catch { return normalizedVal; }
        }
        return normalizedVal;
    };

    const [authData, setAuthData] = useState({
        customer: getSafeToken('customer'),
        seller: getSafeToken('seller'),
        admin: getSafeToken('admin'),
        delivery: getSafeToken('delivery'),
    });

    const currentRole = getCurrentRoleFromUrl();
    const [user, setUser] = useState(null);
    const token = authData[currentRole];
    const [isLoading, setIsLoading] = useState(Boolean(authData[currentRole]));
    const isAuthenticated = !!token && !isTokenExpired(token);

    // Fetch user profile on mount or token change
    useEffect(() => {
        const fetchProfile = async () => {
            if (token) {
                setIsLoading(true);
                try {
                    // Use deduplicated fetch to avoid multiple simultaneous profile calls
                    const requestConfig = { ttl: 5000, contextModule: currentRole };
                    if (token) {
                        requestConfig.headers = { Authorization: `Bearer ${token}` };
                    }
                    const response = await getWithDedupe(
                        getProfileEndpoint(currentRole),
                        {},
                        requestConfig
                    );
                    setUser(extractProfilePayload(response));
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    // If 401, axios interceptor will handle it
                } finally {
                    setIsLoading(false);
                }
            } else {
                setUser(null);
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [token, currentRole]);

    const login = (userData) => {
        const role = userData.role?.toLowerCase() || 'customer';
        const storageKey = ROLE_STORAGE_KEYS[role];

        if (storageKey && userData.token) {
            // Save ONLY the token string as requested by the user
            localStorage.setItem(storageKey, userData.token);

            setAuthData(prev => ({ ...prev, [role]: userData.token }));
            setUser(userData); // Set full data initially
        } else {
            console.error('Invalid role or missing token for login:', role);
        }
    };

    const logout = () => {
        // Clear all role-specific tokens from localStorage
        Object.values(ROLE_STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        Object.values(LEGACY_ROLE_STORAGE_KEYS).flat().forEach(key => {
            localStorage.removeItem(key);
        });

        const path = window.location.pathname;

        // Also clear common/compat keys used by older module code.
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        ['admin', 'seller', 'delivery', 'user'].forEach((module) => {
            localStorage.removeItem(`${module}_accessToken`);
            localStorage.removeItem(`${module}_refreshToken`);
            localStorage.removeItem(`${module}_authenticated`);
            localStorage.removeItem(`${module}_user`);
        });

        // Reset auth state for all roles to null
        setAuthData({
            customer: null,
            seller: null,
            admin: null,
            delivery: null,
        });

        // Clear the current user profile from memory
        setUser(null);

        // Final fallback: redirect based on current path if needed
        // (ProtectedRoute usually handles this, but explicit navigation is safer for some UI edge cases)
        if (path.startsWith('/admin')) window.location.href = '/admin/login';
        else if (path.startsWith('/seller')) window.location.href = '/seller/auth';
        else if (path.startsWith('/delivery')) window.location.href = '/delivery/auth';
        else window.location.href = '/user/auth/login';
    };

    const refreshUser = async () => {
        if (token) {
            try {
                const response = await axiosInstance.get(getProfileEndpoint(currentRole));
                const payload = extractProfilePayload(response);
                setUser(payload);
                return payload;
            } catch (error) {
                console.error('Failed to refresh profile:', error);
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token, // Added token to context
            role: currentRole,
            isAuthenticated,
            isLoading,
            authData,
            login,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

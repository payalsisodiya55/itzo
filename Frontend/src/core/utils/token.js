import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
    try {
        return jwtDecode(token);
    } catch (error) {
        return null;
    }
};

export const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        if (!decoded.exp) return false;
        const now = Date.now() / 1000;
        return decoded.exp < now;
    } catch (error) {
        return true;
    }
};

export const getRoleFromToken = (token) => {
    const decoded = decodeToken(token);
    return decoded?.role || null;
};

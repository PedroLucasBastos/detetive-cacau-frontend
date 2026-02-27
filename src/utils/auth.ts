import Cookies from 'js-cookie';

export const setAuthCookies = (token: string, user: any) => {
    // 8h = 8/24
    Cookies.set('token', token, { expires: 8 / 24 });
    Cookies.set('user', JSON.stringify(user), { expires: 8 / 24 });
    window.dispatchEvent(new Event('authStateChange'));// altera o estado de autenticação
};

export const clearAuthCookies = (dispatch = true) => {
    Cookies.remove('token');
    Cookies.remove('user');
    if (dispatch) {
        window.dispatchEvent(new Event('authStateChange'));
    }
};

export const getAuthToken = () => {
    return Cookies.get('token');
};

export const getAuthUser = () => {
    const userStr = Cookies.get('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

export const isTokenValid = () => {
    const token = getAuthToken();
    if (!token) {
        return false; //verifica se o token é válido
    }

    try {
        // pega a segunda parte do token (payload) onde tem a informação de expiração
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            return false;
        }

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); //decodifica o token
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);

        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
};

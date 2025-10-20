import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { api } from '../services/api';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const history = useHistory();

    const login = async (email: string, password: string) => {
        try {
            console.log('🔐 useAuth: Starting login process...');
            const response = await api.post('/auth/login', { email, password });
            console.log('✅ useAuth: Login API response received:', response.data);
            
            setUser(response.data.user);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            
            console.log('💾 useAuth: Data stored in localStorage');
            console.log('👤 useAuth: User role:', response.data.user?.role);
            
            // Route based on role
            const role = response.data.user?.role;
            if (role === 'coordinator') {
                console.log('🎯 useAuth: Redirecting to /coordinator');
                history.push('/coordinator');
            } else if (role === 'teacher') {
                console.log('🎯 useAuth: Redirecting to /teacher');
                history.push('/teacher');
            } else if (role === 'student') {
                console.log('🎯 useAuth: Redirecting to /student');
                history.push('/student');
            } else {
                console.log('🎯 useAuth: Default redirect to /coordinator');
                history.push('/coordinator');
            }
        } catch (error) {
            console.error('❌ useAuth: Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        history.push('/login');
    };

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            try {
                // Set default auth header
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                // Try to use stored user data first
                const userData = JSON.parse(storedUser);
                setUser(userData);
                
                // Optionally verify with server (can be commented out for faster load)
                // const response = await api.get('/auth/profile');
                // if (response.data?.user) {
                //     setUser(response.data.user);
                //     localStorage.setItem('user', JSON.stringify(response.data.user));
                // }
            } catch (error) {
                console.error('Auth check failed:', error);
                // Clear invalid auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                delete api.defaults.headers.common['Authorization'];
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return { user, loading, login, logout };
};

export default useAuth;
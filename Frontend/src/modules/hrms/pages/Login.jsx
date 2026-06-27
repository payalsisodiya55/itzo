import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { sellerApi } from '@/modules/seller/services/sellerApi'; // reusing axios instance or we should use common axios
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Button } from '@food/components/ui/Button';
import { Input } from '@food/components/ui/Input';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('/auth/admin/login', { email, password });
            
            const payload = response.data?.data || response.data?.result || response.data;
            const user = payload?.admin || payload?.user || payload;

            if (user?.role === 'HRMS_EMPLOYEE') {
                const loginData = {
                    ...user,
                    token: payload?.accessToken || payload?.token
                };
                login(loginData);
                toast.success('Login successful');
                navigate('/hrms/dashboard');
            } else {
                toast.error('Access denied. Please use the ECS Admin portal.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Portal</h1>
                    <p className="text-sm text-gray-500 mt-2">Sign in to access your HRMS dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                placeholder="employee@itzofood.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/hrms/signup')} className="text-primary font-medium hover:underline">
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}

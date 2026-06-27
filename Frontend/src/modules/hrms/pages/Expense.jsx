import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Button } from '@food/components/ui/Button';
import { Input } from '@food/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@food/components/ui/Card';
import { ArrowLeft, Wallet } from 'lucide-react';

export default function Expense() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: 'Travel',
        amount: '',
        expenseDate: '',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('/hrms/expenses', formData);
            toast.success('Expense submitted successfully');
            navigate('/hrms/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit expense');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
                <Button variant="ghost" className="mb-6 -ml-4 text-gray-600" onClick={() => navigate('/hrms/dashboard')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Submit Travel / Visit Expense
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Category</label>
                                    <select name="category" value={formData.category} onChange={handleChange} className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                        <option value="Travel">Travel</option>
                                        <option value="Meals">Meals</option>
                                        <option value="Accommodation">Accommodation</option>
                                        <option value="Miscellaneous">Miscellaneous</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
                                    <Input type="number" name="amount" value={formData.amount} onChange={handleChange} min="1" required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Date of Expense</label>
                                <Input type="date" name="expenseDate" value={formData.expenseDate} onChange={handleChange} required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Description / Details</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    className="w-full min-h-[100px] p-3 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    placeholder="Add any relevant details..."
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Claim'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

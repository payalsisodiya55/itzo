import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Button } from '@food/components/ui/Button';
import { Input } from '@food/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@food/components/ui/Card';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';

export default function Leave() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('/hrms/leaves', formData);
            toast.success('Leave application submitted successfully');
            navigate('/hrms/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit leave application');
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
                            <Calendar className="w-5 h-5 text-primary" />
                            Apply for Leave
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Leave Type</label>
                                <select name="leaveType" value={formData.leaveType} onChange={handleChange} className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Earned Leave">Earned Leave</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                                    <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">End Date</label>
                                    <Input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Reason</label>
                                <textarea 
                                    name="reason" 
                                    value={formData.reason} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full min-h-[100px] p-3 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    placeholder="Please provide a reason for your leave request..."
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

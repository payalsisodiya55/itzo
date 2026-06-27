import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Button } from '@food/components/ui/Button';
import { Input } from '@food/components/ui/Input';
import { Lock, Mail, User, Phone, Briefcase, Calendar, MapPin, Building } from 'lucide-react';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        designation: '',
        employmentType: 'Full-Time',
        joiningDate: '',
        officeLocation: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('/hrms/employees/register', formData);
            toast.success('Onboarding successful! Please log in.');
            navigate('/hrms/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-12">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Onboarding</h1>
                    <p className="text-sm text-gray-500 mt-2">Complete your profile to access the HRMS portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Personal Details */}
                        <div className="space-y-1 md:col-span-2">
                            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Account Details</h3>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="text" name="name" value={formData.name} onChange={handleChange} className="pl-9" placeholder="Jane Doe" required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Email Address *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="email" name="email" value={formData.email} onChange={handleChange} className="pl-9" placeholder="employee@domain.com" required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="password" name="password" value={formData.password} onChange={handleChange} className="pl-9" placeholder="••••••••" required minLength={6} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="pl-9" placeholder="+1234567890" />
                            </div>
                        </div>

                        {/* Professional Details */}
                        <div className="space-y-1 md:col-span-2 mt-4">
                            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Professional Details</h3>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Joining Date *</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="pl-9" required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Department</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="text" name="department" value={formData.department} onChange={handleChange} className="pl-9" placeholder="e.g. Engineering" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Designation</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="text" name="designation" value={formData.designation} onChange={handleChange} className="pl-9" placeholder="e.g. Software Engineer" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Employment Type</label>
                            <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                            </select>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Office Location / Zone</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="text" name="officeLocation" value={formData.officeLocation} onChange={handleChange} className="pl-9" placeholder="e.g. Headquarters" />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 mt-6 text-base font-semibold" disabled={loading}>
                        {loading ? 'Submitting Details...' : 'Complete Onboarding'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Already onboarded?{' '}
                    <button onClick={() => navigate('/hrms/login')} className="text-primary font-bold hover:underline">
                        Log In Here
                    </button>
                </div>
            </div>
        </div>
    );
}

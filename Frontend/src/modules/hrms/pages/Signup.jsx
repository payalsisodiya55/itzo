import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import {
    Building2, User, Mail, Phone, Lock, MapPin, FileText,
    GraduationCap, Briefcase, CreditCard, Heart, ChevronLeft,
    ChevronRight, Check, AlertCircle, Eye, EyeOff
} from 'lucide-react';

const STEPS = [
    { title: 'Personal Info', icon: User },
    { title: 'Address & KYC', icon: MapPin },
    { title: 'Qualifications', icon: GraduationCap },
    { title: 'Bank & Emergency', icon: CreditCard },
];

export default function Signup() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        fullName: '', email: '', phone: '', password: '',
        dateOfBirth: '', gender: '',
        street: '', city: '', state: '', pincode: '',
        aadhaarNumber: '', panNumber: '',
        qualification: '', experience: '',
        preferredDepartment: '', preferredDesignation: '',
        accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', upiId: '',
        emergencyName: '', emergencyRelation: '', emergencyPhone: '',
    });

    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const validateStep = () => {
        switch (currentStep) {
            case 0:
                if (!form.fullName.trim()) { toast.error('Full name is required'); return false; }
                if (!form.email.trim()) { toast.error('Email is required'); return false; }
                if (!form.phone.trim()) { toast.error('Phone is required'); return false; }
                if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
                return true;
            case 1: return true;
            case 2: return true;
            case 3: return true;
            default: return true;
        }
    };

    const nextStep = () => {
        if (validateStep()) setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setLoading(true);
        try {
            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password,
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender || undefined,
                address: {
                    street: form.street, city: form.city,
                    state: form.state, pincode: form.pincode
                },
                aadhaarNumber: form.aadhaarNumber || undefined,
                panNumber: form.panNumber || undefined,
                qualification: form.qualification || undefined,
                experience: form.experience || undefined,
                preferredDepartment: form.preferredDepartment || undefined,
                preferredDesignation: form.preferredDesignation || undefined,
                bankDetails: {
                    accountHolderName: form.accountHolderName,
                    accountNumber: form.accountNumber,
                    bankName: form.bankName,
                    ifscCode: form.ifscCode,
                    upiId: form.upiId
                },
                emergencyContact: {
                    name: form.emergencyName,
                    relation: form.emergencyRelation,
                    phone: form.emergencyPhone
                }
            };

            await axiosInstance.post('/hrms/joining-requests/register', payload);
            setSubmitted(true);
            toast.success('Application submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white/[0.06] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500" />
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Application Submitted!</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Your joining request has been received. Our team will review your application and you'll be notified once it's approved. You cannot login until approved.
                        </p>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-amber-300/80 text-left">
                                    Status: <span className="font-semibold text-amber-300">Pending Approval</span>. You will receive access once an admin approves your application.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/hrms/login')}
                            className="w-full h-11 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all text-sm border border-white/10"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const inputClass = "w-full h-11 px-4 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-all text-sm";
    const labelClass = "text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-8">
            <div className="w-full max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/20">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Join ItzoFood</h1>
                    <p className="text-sm text-slate-400 mt-1">Submit your joining request</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                i < currentStep ? 'bg-emerald-500 text-white'
                                : i === currentStep ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-white/10 text-slate-500'
                            }`}>
                                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`hidden sm:block text-xs font-medium ${i === currentStep ? 'text-white' : 'text-slate-500'}`}>
                                {step.title}
                            </span>
                            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < currentStep ? 'bg-emerald-500' : 'bg-white/10'}`} />}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white/[0.06] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
                    <div className="p-6 sm:p-8">
                        {/* Step 1: Personal Info */}
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Full Name *</label>
                                        <input className={inputClass} value={form.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="Enter full name" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email *</label>
                                        <input type="email" className={inputClass} value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="your@email.com" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone *</label>
                                        <input type="tel" className={inputClass} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+91 XXXXXXXXXX" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Password *</label>
                                        <div className="relative">
                                            <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pr-10`} value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="Min 6 characters" required />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Date of Birth</label>
                                        <input type="date" className={inputClass} value={form.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Gender</label>
                                        <div className="flex gap-4">
                                            {['Male', 'Female', 'Other'].map(g => (
                                                <label key={g} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={e => updateField('gender', e.target.value)} className="accent-orange-500" />
                                                    <span className="text-sm text-slate-300">{g}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Address & KYC */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Address & KYC Documents</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Street Address</label>
                                        <input className={inputClass} value={form.street} onChange={e => updateField('street', e.target.value)} placeholder="Street / House No." />
                                    </div>
                                    <div>
                                        <label className={labelClass}>City</label>
                                        <input className={inputClass} value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="City" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>State</label>
                                        <input className={inputClass} value={form.state} onChange={e => updateField('state', e.target.value)} placeholder="State" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Pincode</label>
                                        <input className={inputClass} value={form.pincode} onChange={e => updateField('pincode', e.target.value)} placeholder="XXXXXX" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Aadhaar Number</label>
                                        <input className={inputClass} value={form.aadhaarNumber} onChange={e => updateField('aadhaarNumber', e.target.value)} placeholder="XXXX XXXX XXXX" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>PAN Number</label>
                                        <input className={inputClass} value={form.panNumber} onChange={e => updateField('panNumber', e.target.value)} placeholder="ABCDE1234F" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Qualifications */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Qualifications & Preferences</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Highest Qualification</label>
                                        <input className={inputClass} value={form.qualification} onChange={e => updateField('qualification', e.target.value)} placeholder="e.g., B.Tech, MBA, 12th Pass" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Experience</label>
                                        <input className={inputClass} value={form.experience} onChange={e => updateField('experience', e.target.value)} placeholder="e.g., 3 years in Sales" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Preferred Department</label>
                                        <input className={inputClass} value={form.preferredDepartment} onChange={e => updateField('preferredDepartment', e.target.value)} placeholder="e.g., Engineering, Sales" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Preferred Designation</label>
                                        <input className={inputClass} value={form.preferredDesignation} onChange={e => updateField('preferredDesignation', e.target.value)} placeholder="e.g., Associate, Manager" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Bank & Emergency */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">Bank Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Account Holder Name</label>
                                            <input className={inputClass} value={form.accountHolderName} onChange={e => updateField('accountHolderName', e.target.value)} placeholder="Name as per bank" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Account Number</label>
                                            <input className={inputClass} value={form.accountNumber} onChange={e => updateField('accountNumber', e.target.value)} placeholder="Account number" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Bank Name</label>
                                            <input className={inputClass} value={form.bankName} onChange={e => updateField('bankName', e.target.value)} placeholder="Bank name" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>IFSC Code</label>
                                            <input className={inputClass} value={form.ifscCode} onChange={e => updateField('ifscCode', e.target.value)} placeholder="IFSC code" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className={labelClass}>UPI ID (Optional)</label>
                                            <input className={inputClass} value={form.upiId} onChange={e => updateField('upiId', e.target.value)} placeholder="name@upi" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">Emergency Contact</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelClass}>Name</label>
                                            <input className={inputClass} value={form.emergencyName} onChange={e => updateField('emergencyName', e.target.value)} placeholder="Contact name" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Relation</label>
                                            <input className={inputClass} value={form.emergencyRelation} onChange={e => updateField('emergencyRelation', e.target.value)} placeholder="e.g., Father" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone</label>
                                            <input type="tel" className={inputClass} value={form.emergencyPhone} onChange={e => updateField('emergencyPhone', e.target.value)} placeholder="Phone number" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                            <button
                                onClick={currentStep === 0 ? () => navigate('/hrms/login') : prevStep}
                                className="flex items-center gap-2 px-5 h-11 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all text-sm border border-white/10"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                {currentStep === 0 ? 'Login' : 'Previous'}
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-5 h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 h-11 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        <>
                                            Submit Application
                                            <Check className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

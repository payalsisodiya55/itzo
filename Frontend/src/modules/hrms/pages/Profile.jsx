import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { User, Loader2, Building2, Phone, Mail, MapPin, CreditCard, Heart, GraduationCap } from 'lucide-react';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosInstance.get('/hrms/employees/me');
                setProfile(res.data?.data || null);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
    if (!profile?.employee) return <div className="p-8 text-center text-slate-500">Profile not found</div>;

    const emp = profile.employee;
    const admin = emp.adminId;
    const manager = emp.managerId;

    const Section = ({ icon: Icon, title, children }) => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><Icon className="w-4 h-4 text-orange-600" /></div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );

    const Field = ({ label, value }) => (
        <div>
            <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/15">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm border border-white/20">
                        {admin?.name?.[0]?.toUpperCase() || 'E'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{admin?.name || 'Employee'}</h1>
                        <p className="text-orange-100 mt-0.5">{emp.designation || 'Employee'} · {emp.department || 'General'}</p>
                        <p className="text-orange-100/80 text-sm mt-1">ID: {emp.employeeId}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section icon={User} title="Personal Details">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Full Name" value={admin?.name} />
                        <Field label="Employee ID" value={emp.employeeId} />
                        <Field label="Email" value={admin?.email} />
                        <Field label="Phone" value={admin?.phone} />
                        <Field label="Role" value={emp.hrmsRole} />
                        <Field label="Status" value={emp.status} />
                    </div>
                </Section>

                <Section icon={Building2} title="Professional Details">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Department" value={emp.department} />
                        <Field label="Designation" value={emp.designation} />
                        <Field label="Employment Type" value={emp.employmentType} />
                        <Field label="Shift" value={emp.shift} />
                        <Field label="Joining Date" value={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN') : '—'} />
                        <Field label="Manager" value={manager?.adminId?.name || '—'} />
                        <Field label="Office Location" value={emp.officeLocation} />
                        <Field label="CTC" value={emp.ctc ? `₹${emp.ctc.toLocaleString()}` : '—'} />
                    </div>
                </Section>

                <Section icon={MapPin} title="Address">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Street" value={emp.address?.street} />
                        <Field label="City" value={emp.address?.city} />
                        <Field label="State" value={emp.address?.state} />
                        <Field label="Pincode" value={emp.address?.pincode} />
                    </div>
                </Section>

                <Section icon={CreditCard} title="Bank Details">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Account Holder" value={emp.bankDetails?.accountHolderName} />
                        <Field label="Account Number" value={emp.bankDetails?.accountNumber} />
                        <Field label="Bank" value={emp.bankDetails?.bankName} />
                        <Field label="IFSC" value={emp.bankDetails?.ifscCode} />
                        <Field label="UPI ID" value={emp.bankDetails?.upiId} />
                    </div>
                </Section>

                <Section icon={Heart} title="Emergency Contact">
                    <div className="grid grid-cols-3 gap-4">
                        <Field label="Name" value={emp.emergencyContact?.name} />
                        <Field label="Relation" value={emp.emergencyContact?.relation} />
                        <Field label="Phone" value={emp.emergencyContact?.phone} />
                    </div>
                </Section>

                <Section icon={GraduationCap} title="Qualifications">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Qualification" value={emp.qualification} />
                        <Field label="Experience" value={emp.experience} />
                    </div>
                </Section>
            </div>
        </div>
    );
}

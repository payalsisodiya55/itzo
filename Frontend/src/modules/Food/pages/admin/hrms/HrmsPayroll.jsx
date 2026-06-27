import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { Card, CardContent } from '@food/components/ui/Card';
import { Banknote, Loader2 } from 'lucide-react';

export default function HrmsPayroll() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const res = await axiosInstance.get('/hrms/expenses');
                setExpenses(res.data.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payroll & Expenses</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage employee reimbursements and run payroll.</p>
                </div>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors">
                    Run Payroll
                </button>
            </div>

            <h2 className="text-lg font-bold mb-4">Travel & Expense Claims</h2>
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Banknote className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Expense Claims</h3>
                            <p className="text-gray-500 text-sm max-w-sm">There are no pending expense claims from employees.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Employee</th>
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold">Category</th>
                                        <th className="px-6 py-4 font-semibold">Amount</th>
                                        <th className="px-6 py-4 font-semibold">Description</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(exp => (
                                        <tr key={exp._id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{exp.employeeId?.adminId?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{exp.category}</td>
                                            <td className="px-6 py-4 text-gray-900 font-medium">₹{exp.amount}</td>
                                            <td className="px-6 py-4 truncate max-w-[200px]">{exp.description || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${exp.status === 'Approved' || exp.status === 'Reimbursed' ? 'bg-emerald-100 text-emerald-700' : exp.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    {exp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { Card, CardContent } from '@food/components/ui/Card';
import { Calendar, Loader2 } from 'lucide-react';

export default function HrmsAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [attRes, leaveRes] = await Promise.all([
                    axiosInstance.get('/hrms/attendance'),
                    axiosInstance.get('/hrms/leaves')
                ]);
                setAttendance(attRes.data.data || []);
                setLeaves(leaveRes.data.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Attendance & Leaves</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor daily attendance and manage leave requests.</p>
            </div>

            <h2 className="text-lg font-bold mb-4">Leave Requests</h2>
            <Card className="mb-8">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                    ) : leaves.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No leave requests found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Employee</th>
                                        <th className="px-6 py-4 font-semibold">Type</th>
                                        <th className="px-6 py-4 font-semibold">Duration</th>
                                        <th className="px-6 py-4 font-semibold">Reason</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(l => (
                                        <tr key={l._id} className="border-b">
                                            <td className="px-6 py-4 font-medium text-gray-900">{l.employeeId?.adminId?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">{l.leaveType}</td>
                                            <td className="px-6 py-4">{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} Days)</td>
                                            <td className="px-6 py-4 max-w-[200px] truncate">{l.reason}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    {l.status}
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

            <h2 className="text-lg font-bold mb-4">Attendance Logs</h2>
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                    ) : attendance.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No attendance records found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Employee</th>
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold">Check In</th>
                                        <th className="px-6 py-4 font-semibold">Check Out</th>
                                        <th className="px-6 py-4 font-semibold">Working Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map(a => (
                                        <tr key={a._id} className="border-b">
                                            <td className="px-6 py-4 font-medium text-gray-900">{a.employeeId?.adminId?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">{new Date(a.date).toDateString()}</td>
                                            <td className="px-6 py-4">{a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString() : '-'}</td>
                                            <td className="px-6 py-4">{a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString() : '-'}</td>
                                            <td className="px-6 py-4">{a.workingHours ? `${a.workingHours} hrs` : '-'}</td>
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '@core/context/AuthContext';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { Button } from '@food/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@food/components/ui/Card';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [attendanceRecord, setAttendanceRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [elapsedTime, setElapsedTime] = useState("0:00");

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await axiosInstance.get('/hrms/attendance/me');
            const records = res.data.data;
            if (records && records.length > 0) {
                // Check if the most recent record is today
                const latest = records[0];
                const recordDate = new Date(latest.date).toDateString();
                const today = new Date().toDateString();
                
                if (recordDate === today) {
                    setAttendanceRecord(latest);
                }
            }
        } catch (error) {
            console.error("Failed to fetch attendance", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        if (attendanceRecord && attendanceRecord.checkInTime && !attendanceRecord.checkOutTime) {
            // Check-in timer calculation
            const updateTimer = () => {
                const now = new Date();
                const checkInDate = new Date(attendanceRecord.checkInTime);
                const diffMs = now - checkInDate;
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                setElapsedTime(`${hours}:${mins.toString().padStart(2, '0')}`);
            };
            updateTimer();
            interval = setInterval(updateTimer, 60000); // Update every minute
        } else if (attendanceRecord && attendanceRecord.checkOutTime) {
            setElapsedTime(`${attendanceRecord.workingHours?.toFixed(1) || '0.0'} hr`);
        } else {
            setElapsedTime("0:00");
        }
        return () => clearInterval(interval);
    }, [attendanceRecord]);

    const handleCheckIn = async () => {
        setActionLoading(true);
        try {
            const res = await axiosInstance.post('/hrms/attendance/check-in');
            setAttendanceRecord(res.data.data);
            toast.success("Successfully checked in!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Check-in failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setActionLoading(true);
        try {
            const res = await axiosInstance.post('/hrms/attendance/check-out');
            setAttendanceRecord(res.data.data);
            toast.success("Successfully checked out!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Check-out failed");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">{user?.name || 'Employee'}</h2>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                </div>
                <Button variant="ghost" className="text-gray-600 hover:text-red-600 hover:bg-red-50 gap-2" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </header>

            {/* Content */}
            <main className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'Employee'}!</h1>
                    <p className="text-gray-500 mt-1">Here is your daily attendance and HRMS overview.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Check In Widget */}
                    <Card className={`shadow-sm border-t-4 ${attendanceRecord?.checkOutTime ? 'border-t-gray-400' : attendanceRecord?.checkInTime ? 'border-t-emerald-500' : 'border-t-orange-500'}`}>
                        <CardContent className="p-6 text-center">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <>
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 ${attendanceRecord?.checkOutTime ? 'border-gray-100 bg-gray-50 text-gray-500' : attendanceRecord?.checkInTime ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-orange-100 bg-orange-50 text-orange-500'}`}>
                                        <span className="text-2xl font-bold">{elapsedTime}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        {attendanceRecord?.checkOutTime ? 'Shift Completed' : attendanceRecord?.checkInTime ? 'Checked In' : 'Not Checked In'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        {attendanceRecord?.checkOutTime 
                                            ? `You checked out at ${new Date(attendanceRecord.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                                            : attendanceRecord?.checkInTime 
                                                ? `You checked in at ${new Date(attendanceRecord.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                                : 'Click below to start your workday.'}
                                    </p>
                                    
                                    {!attendanceRecord?.checkInTime && (
                                        <Button 
                                            onClick={handleCheckIn} 
                                            disabled={actionLoading} 
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base font-semibold"
                                        >
                                            {actionLoading ? 'Processing...' : 'Check In'}
                                        </Button>
                                    )}

                                    {attendanceRecord?.checkInTime && !attendanceRecord?.checkOutTime && (
                                        <Button 
                                            onClick={handleCheckOut} 
                                            disabled={actionLoading} 
                                            variant="destructive" 
                                            className="w-full h-12 text-base font-semibold"
                                        >
                                            {actionLoading ? 'Processing...' : 'Check Out'}
                                        </Button>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
                            <div className="space-y-3">
                                <Button onClick={() => navigate('/hrms/leave')} variant="outline" className="w-full justify-start text-gray-600">Apply for Leave</Button>
                                <Button onClick={() => navigate('/hrms/expense')} variant="outline" className="w-full justify-start text-gray-600">Submit Travel Expense</Button>
                                <Button onClick={() => navigate('/hrms/payslip')} variant="outline" className="w-full justify-start text-gray-600">Download Payslip</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

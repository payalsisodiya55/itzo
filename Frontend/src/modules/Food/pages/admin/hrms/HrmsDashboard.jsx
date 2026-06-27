import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@food/components/ui/Card';

export default function HrmsDashboard() {
    const [metrics, setMetrics] = useState({
        totalEmployees: 0,
        presentToday: 0,
        onLeave: 0,
        pendingApprovals: 0
    });

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // To keep it simple, we fetch all and calculate on the frontend for now
                const [empRes, attRes, leaveRes, expRes] = await Promise.all([
                    axiosInstance.get('/hrms/employees'),
                    axiosInstance.get('/hrms/attendance'),
                    axiosInstance.get('/hrms/leaves'),
                    axiosInstance.get('/hrms/expenses')
                ]);

                const employees = empRes.data.data || [];
                const attendance = attRes.data.data || [];
                const leaves = leaveRes.data.data || [];
                const expenses = expRes.data.data || [];

                const today = new Date().toDateString();

                const presentToday = attendance.filter(a => new Date(a.date).toDateString() === today).length;
                const onLeave = leaves.filter(l => 
                    l.status === 'Approved' && 
                    new Date(l.startDate) <= new Date() && 
                    new Date(l.endDate) >= new Date()
                ).length;

                const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
                const pendingExpenses = expenses.filter(e => e.status === 'Pending').length;

                setMetrics({
                    totalEmployees: employees.length,
                    presentToday,
                    onLeave,
                    pendingApprovals: pendingLeaves + pendingExpenses
                });
            } catch (error) {
                console.error("Failed to fetch dashboard metrics", error);
            }
        };
        fetchMetrics();
    }, []);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">HRMS Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Enterprise overview of employee metrics.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{metrics.totalEmployees}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Present Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{metrics.presentToday}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">On Leave</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{metrics.onLeave}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Approvals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{metrics.pendingApprovals}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

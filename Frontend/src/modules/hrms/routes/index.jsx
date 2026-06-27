import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HrmsGuard from '../guards/HrmsGuard';

const Login = lazy(() => import('../pages/Login'));
const Signup = lazy(() => import('../pages/Signup'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Leave = lazy(() => import('../pages/Leave'));
const Expense = lazy(() => import('../pages/Expense'));
const Payslip = lazy(() => import('../pages/Payslip'));

export default function HrmsEmployeeApp() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="w-8 h-8 animate-spin border-4 border-primary border-t-transparent rounded-full" /></div>}>
            <Routes>
                {/* Public Routes */}
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />

                {/* Protected Routes - Only accessible by HRMS_EMPLOYEE role */}
                <Route
                    path="*"
                    element={
                        <HrmsGuard>
                            <Routes>
                                <Route path="/" element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="leave" element={<Leave />} />
                                <Route path="expense" element={<Expense />} />
                                <Route path="payslip" element={<Payslip />} />
                            </Routes>
                        </HrmsGuard>
                    }
                />
            </Routes>
        </Suspense>
    );
}

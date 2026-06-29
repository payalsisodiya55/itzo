import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HrmsGuard from '../guards/HrmsGuard';

const Login = lazy(() => import('../pages/Login'));
const Signup = lazy(() => import('../pages/Signup'));
const HrmsLayout = lazy(() => import('../components/HrmsLayout'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Attendance = lazy(() => import('../pages/Attendance'));
const Leave = lazy(() => import('../pages/Leave'));
const Salary = lazy(() => import('../pages/Salary'));
const Documents = lazy(() => import('../pages/Documents'));
const Expense = lazy(() => import('../pages/Expense'));
const Profile = lazy(() => import('../pages/Profile'));

export default function HrmsEmployeeApp() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="w-8 h-8 animate-spin border-4 border-orange-500 border-t-transparent rounded-full" /></div>}>
            <Routes>
                {/* Public Routes */}
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />

                {/* Protected Routes - Only accessible by HRMS_EMPLOYEE role */}
                <Route
                    element={
                        <HrmsGuard>
                            <HrmsLayout />
                        </HrmsGuard>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="leave" element={<Leave />} />
                    <Route path="salary" element={<Salary />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="expenses" element={<Expense />} />
                    <Route path="profile" element={<Profile />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </Suspense>
    );
}

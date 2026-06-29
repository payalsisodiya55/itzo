import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Loader from "@food/components/Loader";

const HrmsDashboard = lazy(() => import("./HrmsDashboard"));
const HrmsJoiningRequests = lazy(() => import("./HrmsJoiningRequests"));
const HrmsEmployees = lazy(() => import("./HrmsEmployees"));
const HrmsAttendance = lazy(() => import("./HrmsAttendance"));
const HrmsPayroll = lazy(() => import("./HrmsPayroll"));
const HrmsSettings = lazy(() => import("./HrmsSettings"));

export default function HrmsRouter() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route path="/" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<HrmsDashboard />} />
                <Route path="joining-requests" element={<HrmsJoiningRequests />} />
                <Route path="employees" element={<HrmsEmployees />} />
                <Route path="attendance" element={<HrmsAttendance />} />
                <Route path="payroll" element={<HrmsPayroll />} />
                <Route path="settings" element={<HrmsSettings />} />
            </Routes>
        </Suspense>
    );
}

import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Loader from "@food/components/Loader";

const HrmsDashboard = lazy(() => import("./HrmsDashboard"));
const HrmsJoiningRequests = lazy(() => import("./HrmsJoiningRequests"));
const HrmsEmployees = lazy(() => import("./HrmsEmployees"));
const HrmsEmployeeDocs = lazy(() => import("./HrmsEmployeeDocs"));
const HrmsAttendance = lazy(() => import("./HrmsAttendance"));
const HrmsPayroll = lazy(() => import("./HrmsPayroll"));
const HrmsSettings = lazy(() => import("./HrmsSettings"));
const SupportDashboard = lazy(() => import("./support/SupportDashboard"));
const SupportRequests = lazy(() => import("./support/SupportRequests"));
const SupportSettings = lazy(() => import("./support/SupportSettings"));
const SupportAdminDetails = lazy(() => import("./support/SupportAdminDetails"));

export default function HrmsRouter() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route path="/" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<HrmsDashboard />} />
                <Route path="joining-requests" element={<HrmsJoiningRequests />} />
                <Route path="employees" element={<HrmsEmployees />} />
                <Route path="employee-docs" element={<HrmsEmployeeDocs />} />
                <Route path="attendance" element={<HrmsAttendance />} />
                <Route path="payroll" element={<HrmsPayroll />} />
                <Route path="settings" element={<HrmsSettings />} />

                {/* Support Center */}
                <Route path="support" element={<Navigate to="dashboard" replace />} />
                <Route path="support/dashboard" element={<SupportDashboard />} />
                <Route path="support/requests" element={<SupportRequests />} />
                <Route path="support/requests/:id" element={<SupportAdminDetails />} />
                <Route path="support/settings" element={<SupportSettings />} />
            </Routes>
        </Suspense>
    );
}

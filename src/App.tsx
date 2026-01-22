import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Skeleton from './components/Skeleton'
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
// Lazy-load heavy admin routes to reduce initial bundle size
const SessionManagement = lazy(() => import('./pages/admin/SessionManagement'))
const CreateSession = lazy(() => import('./pages/admin/CreateSession'))
const EditSession = lazy(() => import('./pages/admin/EditSession'))
const CalendarView = lazy(() => import('./pages/admin/CalendarView'))
const WaitlistManagement = lazy(() => import('./pages/admin/WaitlistManagement'))
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'))
const GlobalStudentManagement = lazy(() => import('./pages/admin/GlobalStudentManagement'))
const Attendance = lazy(() => import('./pages/admin/Attendance'))
const AttendanceList = lazy(() => import('./pages/admin/AttendanceList'))
const TermManagement = lazy(() => import('./pages/admin/TermManagement'))

import StudentSignup from './pages/StudentSignup';
import AccountSettings from './pages/AccountSettings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<StudentSignup />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Account Settings Route */}
          <Route
            path="/account-settings"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8 text-center">Loading sessions...</div>}>
                  <SessionManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8 text-center">Loading calendar...</div>}>
                  <CalendarView />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/create"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8 text-center">Loading editor...</div>}>
                  <CreateSession />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:id/edit"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8 text-center">Loading editor...</div>}>
                  <EditSession />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:sessionId/waitlist"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8 text-center">Loading waitlist...</div>}>
                  <WaitlistManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Skeleton variant="sessions" />}>
                  <AttendanceList />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance/:sessionId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Skeleton variant="attendance" />}>
                  <Attendance />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/waitlist"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Skeleton variant="sessions" />}>
                  <GlobalStudentManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/admitted"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Skeleton variant="sessions" />}>
                  <GlobalStudentManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/withdrawn"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Skeleton variant="sessions" />}>
                  <GlobalStudentManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Skeleton variant="staff" />}>
                  <StaffManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/terms"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Skeleton variant="terms" />}>
                  <TermManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

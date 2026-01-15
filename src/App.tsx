import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SessionManagement from './pages/admin/SessionManagement';
import CreateSession from './pages/admin/CreateSession';
import EditSession from './pages/admin/EditSession';
import CalendarView from './pages/admin/CalendarView';
import WaitlistManagement from './pages/admin/WaitlistManagement';
import StudentSignup from './pages/StudentSignup';
import AccountSettings from './pages/AccountSettings';
import StudentSignups from './pages/admin/StudentSignups';
import EditStudent from './pages/admin/EditStudent';
import ViewStudent from './pages/admin/ViewStudent';
import StaffManagement from './pages/admin/StaffManagement';
import GlobalStudentManagement from './pages/admin/GlobalStudentManagement';
import Attendance from './pages/admin/Attendance';
import AttendanceList from './pages/admin/AttendanceList';

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
                <SessionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute>
                <CalendarView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/create"
            element={
              <ProtectedRoute>
                <CreateSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:id/edit"
            element={
              <ProtectedRoute>
                <EditSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:sessionId/waitlist"
            element={
              <ProtectedRoute>
                <WaitlistManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute>
                <AttendanceList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance/:sessionId"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/waitlist"
            element={
              <ProtectedRoute>
                <GlobalStudentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/admitted"
            element={
              <ProtectedRoute>
                <GlobalStudentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/withdrawn"
            element={
              <ProtectedRoute>
                <GlobalStudentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute>
                <StaffManagement />
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

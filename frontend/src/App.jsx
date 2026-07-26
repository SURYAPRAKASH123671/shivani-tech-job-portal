import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import RegisterCandidate from './pages/RegisterCandidate.jsx'
import VerifyOtp from './pages/VerifyOtp.jsx'
import RegisterCompany from './pages/RegisterCompany.jsx'
import JobSearch from './pages/JobSearch.jsx'
import JobDetail from './pages/JobDetail.jsx'
import MyApplications from './pages/MyApplications.jsx'
import CandidateDashboard from './pages/CandidateDashboard.jsx'
import CandidateProfile from './pages/CandidateProfile.jsx'
import EmployerDashboard from './pages/EmployerDashboard.jsx'
import AdminCompanies from './pages/AdminCompanies.jsx'
import AdminJobs from './pages/AdminJobs.jsx'
import AdminLookups from './pages/AdminLookups.jsx'
import AdminEmployees from './pages/AdminEmployees.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminNotifications from './pages/AdminNotifications.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/jobs" element={<JobSearch />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/candidate" element={<RegisterCandidate />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/register/company" element={<RegisterCompany />} />
        <Route
          path="/applications"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/profile"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <CandidateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute allowedRole="EMPLOYER">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminCompanies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lookups"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLookups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminNotifications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

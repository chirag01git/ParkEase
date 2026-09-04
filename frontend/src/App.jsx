import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import MallBrowse from './pages/user/MallBrowse';
import MallDetail from './pages/user/MallDetail';
import BookingCreate from './pages/user/BookingCreate';
import MyBookings from './pages/user/MyBookings';
import BookingDetail from './pages/user/BookingDetail';

// Guard Pages
import GuardDashboard from './pages/guard/GuardDashboard';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import CreateMall from './pages/owner/CreateMall';
import MyMalls from './pages/owner/MyMalls';
import ManageSlots from './pages/owner/ManageSlots';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import MallApprovals from './pages/admin/MallApprovals';
import ManageUsers from './pages/admin/ManageUsers';

const RootRedirect = () => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;

  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'MALL_OWNER') return <Navigate to="/owner/dashboard" replace />;
  if (user.role === 'GUARD') return <Navigate to="/guard/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <div className="main-layout">
            <Sidebar />
            <main className="content-area">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<RootRedirect />} />

                {/* USER Routes */}
                <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN']} />}>
                  <Route path="/user/dashboard" element={<UserDashboard />} />
                  <Route path="/user/malls" element={<MallBrowse />} />
                  <Route path="/user/malls/:id" element={<MallDetail />} />
                  <Route path="/user/book/:mallId" element={<BookingCreate />} />
                  <Route path="/user/bookings" element={<MyBookings />} />
                  <Route path="/user/bookings/:id" element={<BookingDetail />} />
                </Route>

                {/* GUARD Routes */}
                <Route element={<ProtectedRoute allowedRoles={['GUARD', 'ADMIN']} />}>
                  <Route path="/guard/dashboard" element={<GuardDashboard />} />
                </Route>

                {/* MALL OWNER Routes */}
                <Route element={<ProtectedRoute allowedRoles={['MALL_OWNER', 'ADMIN']} />}>
                  <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                  <Route path="/owner/create-mall" element={<CreateMall />} />
                  <Route path="/owner/malls" element={<MyMalls />} />
                  <Route path="/owner/slots/:mallId" element={<ManageSlots />} />
                </Route>

                {/* ADMIN Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/approvals" element={<MallApprovals />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

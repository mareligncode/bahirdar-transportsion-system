import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import FAQ from './pages/public/FAQ';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';    

// Passenger Pages
import PassengerDashboard from './pages/passenger/Dashboard';
import BookTrip from './pages/passenger/BookTrip';
import MyBookings from './pages/passenger/MyBookings';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Schedules from './pages/admin/Schedules';
//import Drivers from './pages/admin/Drivers';
import Vehicles from './pages/admin/Vehicles';

// Profile Pages
import Profile from './pages/profile/Profile';
import ChangePassword from './pages/profile/ChangePassword';

// Super Admin Pages
import AllUsers from './pages/admin/AllUsers';
import RoleManagement from './pages/admin/RoleManagement';
import Stations from './pages/admin/Stations';

// Station Admin Pages
import StationDashboard from './pages/station/Dashboard';
import StationUsers from './pages/station/Users';
import StationReports from './pages/station/Reports';
import Drivers from './pages/station/Drivers';


// Error Pages
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';








// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


  function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/faq" element={<Layout><FAQ /></Layout>} />
          
          {/* ===== AUTHENTICATION ROUTES ===== */}
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
    
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />




          {/* ===== PROFILE ROUTES (Authenticated Users) ===== */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout showSidebar>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/change-password" element={
            <ProtectedRoute>
              <Layout showSidebar>
                <ChangePassword />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* ===== PASSENGER ROUTES =====*/}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <Layout showSidebar>
                <PassengerDashboard />
              </Layout>
            </ProtectedRoute>
          } /> 
          
           <Route path="/passenger/dashboard" element={
             <ProtectedRoute allowedRoles={['passenger']}>
              <Layout showSidebar>
                <PassengerDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/passenger/book-trip" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <Layout showSidebar>
                <BookTrip />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/passenger/book-trip/:tripId" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <Layout showSidebar>
                <BookTrip />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/passenger/my-bookings" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <Layout showSidebar>
                <MyBookings />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* ===== DRIVER ROUTES ===== */}
          <Route path="/driver/dashboard" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Layout showSidebar>
                <DriverDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* ===== STATION ADMIN ROUTES ===== */}
          <Route path="/station/dashboard" element={
            <ProtectedRoute allowedRoles={['station_admin']}>
              <Layout showSidebar>
                <StationDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
     <Route
     path="/station/drivers"
     element={
    <ProtectedRoute allowedRoles={['station_admin']}>
      <Layout showSidebar>
        <Drivers />
      </Layout>
    </ProtectedRoute>
  }
/>


          <Route path="/station/users" element={
            <ProtectedRoute allowedRoles={['station_admin']}>
              <Layout showSidebar>
                <StationUsers />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/station/reports" element={
            <ProtectedRoute allowedRoles={['station_admin']}>
              <Layout showSidebar>
                <StationReports />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* ===== ADMIN ROUTES (Shared for station_admin & super_admin) ===== */}
      
          <Route path="/admin/schedules" element={
            <ProtectedRoute allowedRoles={['station_admin', 'super_admin']}>
              <Layout showSidebar>
                <Schedules />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/drivers" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout showSidebar>
                <Drivers />
              </Layout>
            </ProtectedRoute>
          } />


                    <Route path="/admin/stations" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout showSidebar>
                <Stations />
              </Layout>
            </ProtectedRoute>
          } />
          




          <Route path="/admin/vehicles" element={
            <ProtectedRoute allowedRoles={['station_admin', 'super_admin']}>
              <Layout showSidebar>
                <Vehicles />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* ===== SUPER ADMIN EXCLUSIVE ROUTES ===== */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout showSidebar>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/AllUsers" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout showSidebar>
                <AllUsers />
              </Layout>
            </ProtectedRoute>
          } />



          // Add this route
<Route 
  path="/admin/role-management" 
  element={
    <ProtectedRoute allowedRoles={['super_admin']}>
      <Layout showSidebar>
        <RoleManagement />
      </Layout>
    </ProtectedRoute>
  } 
/>
          
          
          {/* ===== ERROR ROUTES ===== */}
          <Route path="/unauthorized" element={<Layout><Unauthorized /></Layout>} />
          
          {/* ===== 404 ROUTE ===== */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // ADD Navigate here
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationProvider } from './contexts/NotificationContext'; // ADD THIS
import './styles/dark-mode.css';
import SettingsPage from './pages/SettingsPage';

// Layout
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Passenger Pages
import PassengerDashboard from './pages/passenger/Dashboard';
import BookTrip from './pages/passenger/BookTrip';
import MyBookings from './pages/passenger/MyBookings';
import BookingConfirmation from './pages/passenger/BookingConfirmation';
import BookingGuide from './pages/passenger/BookingGuide';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
// import Schedules from './pages/admin/Schedules';
import Vehicles from './pages/admin/Vehicles';

// Profile Pages
import Profile from './pages/profile/Profile';

// Super Admin Pages
import AllUsers from './pages/admin/AllUsers';
import RoleManagement from './pages/admin/RoleManagement';
import Stations from './pages/admin/Stations';
import RoutesPage from './pages/admin/Routes';
import AdminReports from './pages/admin/Reports';

// Station Admin Pages
import StationDashboard from './pages/station/Dashboard';
import QueueManagement from './pages/station/QueueManagement';
import StationUsers from './pages/station/Users';
// import StationReports from './pages/station/Reports';
import Drivers from './pages/station/Drivers';
// import Trips from './pages/station/Trips';
import Vehicle from './pages/station/Vehicles';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';
import DriverQueue from './pages/driver/DriverQueue';
import MyTrips from './pages/driver/MyTrips';
import TripDetails from './pages/driver/TripDetails';
import MyVehicle from './pages/driver/MyVehicle';
import DriverReports from './pages/driver/Reports';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import FAQ from './pages/public/FAQ';
import LiveMap from './pages/public/LiveMap';

// Notification Pages - ADD THIS
import NotificationsPage from './pages/notifications/NotificationsPage';

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
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* ADD NOTIFICATION PROVIDER - wrap everything that needs notifications */}
          <NotificationProvider>
            <Routes>
              {/* ===== PUBLIC ROUTES ===== */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/about" element={<Layout><About /></Layout>} />
              <Route path="/contact" element={<Layout><Contact /></Layout>} />
              <Route path="/faq" element={<Layout><FAQ /></Layout>} />
              <Route path="/live-map" element={<Layout><LiveMap /></Layout>} />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout showSidebar>
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ===== AUTHENTICATION ROUTES ===== */}
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/register" element={<Layout><Register /></Layout>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* ===== CHAPA REDIRECT ROUTE - ADD THIS ===== */}
              <Route
                path="/booking/confirmation"
                element={<Navigate to="/passenger/booking-confirmation" replace />}
              />

              {/* ===== PROFILE ROUTES (Authenticated Users) ===== */}
              <Route
                path="/passenger/booking-confirmation"
                element={
                  <ProtectedRoute allowedRoles={['passenger']}>
                    <Layout showSidebar>
                      <BookingConfirmation />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout showSidebar>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ===== NOTIFICATION ROUTES - ADD THIS ===== */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Layout showSidebar>
                      <NotificationsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ===== PASSENGER ROUTES =====*/}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['passenger']}>
                    <Layout showSidebar>
                      <PassengerDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/passenger/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['passenger']}>
                    <Layout showSidebar>
                      <PassengerDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/passenger/book-trip"
                element={
                  <ProtectedRoute allowedRoles={['passenger']}>
                    <Layout showSidebar>
                      <BookTrip />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/passenger/book-trip/:tripId"
                element={
                  <ProtectedRoute allowedRoles={['passenger']}>
                    <Layout showSidebar>
                      <BookTrip />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/passenger/my-booking"
                element={
                  <ProtectedRoute allowedRoles={['passenger']}>
                    <Layout showSidebar>
                      <MyBookings />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/passenger/support"
                element={
                  <ProtectedRoute allowedRoles={['passenger']}>
                    <Layout showSidebar>
                      <BookingGuide />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ===== DRIVER ROUTES ===== */}
              <Route
                path="/driver/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <Layout showSidebar>
                      <DriverDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/driver/queue"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <Layout showSidebar>
                      <DriverQueue />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/driver/trips"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <Layout showSidebar>
                      <MyTrips />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/driver/trip/:tripId"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <Layout showSidebar>
                      <TripDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/driver/vehicle"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <Layout showSidebar>
                      <MyVehicle />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/driver/reports"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <Layout showSidebar>
                      <DriverReports />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ===== STATION ADMIN ROUTES ===== */}
              <Route
                path="/station/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['station_admin']}>
                    <Layout showSidebar>
                      <StationDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/station/queue"
                element={
                  <ProtectedRoute allowedRoles={['station_admin']}>
                    <Layout showSidebar>
                      <QueueManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

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

              <Route
                path="/station/users"
                element={
                  <ProtectedRoute allowedRoles={['station_admin']}>
                    <Layout showSidebar>
                      <StationUsers />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* <Route
                path="/station/Trips"
                element={
                  <ProtectedRoute allowedRoles={['station_admin']}>
                    <Layout showSidebar>
                      <Trips />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              <Route
                path="/station/vehicles"
                element={
                  <ProtectedRoute allowedRoles={['station_admin']}>
                    <Layout showSidebar>
                      <Vehicle />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              ?

              {/* ===== ADMIN ROUTES (Shared for station_admin & super_admin) ===== */}
              {/* <Route
                path="/admin/schedules"
                element={
                  <ProtectedRoute allowedRoles={['station_admin', 'super_admin']}>
                    <Layout showSidebar>
                      <Schedules />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              <Route
                path="/admin/drivers"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Layout showSidebar>
                      <Drivers />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/stations"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Layout showSidebar>
                      <Stations />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/vehicles"
                element={
                  <ProtectedRoute allowedRoles={['station_admin', 'super_admin']}>
                    <Layout showSidebar>
                      <Vehicles />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/routes"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'station_admin']}>
                    <Layout showSidebar>
                      <RoutesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ===== SUPER ADMIN EXCLUSIVE ROUTES ===== */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Layout showSidebar>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/AllUsers"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Layout showSidebar>
                      <AllUsers />
                    </Layout>
                  </ProtectedRoute>
                }
              />

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

              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Layout showSidebar>
                      <AdminReports />
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
          </NotificationProvider> {/* CLOSE NOTIFICATION PROVIDER */}
        </BrowserRouter>
      </QueryClientProvider>
    </SettingsProvider>
  );
}

export default App;
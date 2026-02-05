import { NavLink, useNavigate, useLocation} from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Car, 
  Ticket, 
  BarChart3,
  Settings,
  MapPin,
  FileText,
  UserCircle,
  Shield,
  Bell,
  HelpCircle,
  CreditCard,
  MessageSquare,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ userRole }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    // Common items for all roles
    const commonItems = [

      { icon: UserCircle, label: 'Profile', path: '/profile' },
      { icon: Bell, label: 'Notifications', path: '/notifications' },
    ];

    // Passenger specific items
    const passengerItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Ticket, label: 'Book Trip', path: '/passenger/book-trip' },
      { icon: Calendar, label: 'My Trips', path: '/passenger/trips' },
      { icon: CreditCard, label: 'Payment Methods', path: '/passenger/payments' },
      { icon: MessageSquare, label: 'Support', path: '/passenger/support' },
     
    ];

    // Driver specific items
    const driverItems = [
     { icon: LayoutDashboard, label: 'Dashboard', path: '/driver/dashboard' },
      { icon: Car, label: 'Assigned Trips', path: '/driver/trips' },
      { icon: MapPin, label: 'Trip Tracking', path: '/driver/tracking' },
      { icon: BarChart3, label: 'Earnings', path: '/driver/earnings' },
      { icon: Calendar, label: 'Availability', path: '/driver/availability' },
      { icon: FileText, label: 'Documents', path: '/driver/documents' },
       
    ];

    // Station Admin specific items
    const stationAdminItems = [
       { icon: LayoutDashboard, label: 'Dashboard', path: '/station/dashboard' },
      { icon: Users, label: 'User Management', path: '/station/users' },
      { icon: Car, label: 'Drivers', path: '/station/drivers' },
      { icon: Calendar, label: 'Trip Management', path: '/station/trips' },
      { icon: BarChart3, label: 'Station Reports', path: '/station/reports' },
      { icon: Settings, label: 'Station Settings', path: '/station/settings' },
      
    ];

    // Super Admin specific items
    const superAdminItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
       { icon: Shield, label: 'Role Management', path: '/admin/role-management' },
      { icon: Users, label: 'All Users', path: '/admin/AllUsers' },
      { icon: Calendar, label: 'Schedules', path: '/admin/schedules' },
      { icon: Car, label: 'All Drivers', path: '/admin/drivers' },
      { icon: MapPin, label: 'Stations', path: '/admin/stations' },
      { icon: BarChart3, label: 'System Reports', path: '/admin/reports' },
      { icon: Settings, label: 'System Settings', path: '/admin/settings' },
      { icon: FileText, label: 'Audit Logs', path: '/admin/audit-logs' },
    ];

    // Combine items based on role
    switch(userRole) {
      case 'passenger':
        return [ ...passengerItems,...commonItems];
      case 'driver':
        return [...driverItems,...commonItems];
      case 'station_admin':
        return [...stationAdminItems,...commonItems];
      case 'super_admin':
        return [...superAdminItems,...commonItems];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  // Get panel title based on role
  const getPanelTitle = () => {
    switch(userRole) {
      case 'passenger': return 'Passenger Dashboard';
      case 'driver': return 'Driver Dashboard';
      case 'station_admin': return 'Station Admin Panel';
      case 'super_admin': return 'Super Admin Panel';
      default: return 'Dashboard';
    }
  };

  return (
    <aside className="w-64 bg-white border-r shadow-sm">
      <div className="p-6">
        {/* User Info Section */}
        {user && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-primary-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {user.role?.replace('_', ' ')}
                </p>
                {user.stationID && (
                  <p className="text-xs text-gray-500 mt-1">
                    Station: {user.stationID}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel Title */}
        <h2 className="text-lg font-semibold mb-6 text-gray-800">
          {getPanelTitle()}
        </h2>

        {/* Navigation Menu */}
        <nav className="space-y-1">
         {menuItems.map((item) => (
  <NavLink
    key={item.path}
    to={item.path}
    end={item.path === '/dashboard'}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600 shadow-sm'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-l-4 hover:border-gray-300'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <item.icon className={`w-5 h-5 ${
          isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
        }`} />
        <span className="font-medium">{item.label}</span>
      </>
    )}
  </NavLink>
))}

          {/* Support Link */}
          <NavLink
  to="/help"
  className={({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-6 ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
    }`
  }
>
  {({ isActive }) => (
    <>
      <HelpCircle className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
      <span className="font-medium">Help & Support</span>
    </>
  )}
</NavLink>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        {/* Role Badge */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account Type
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              userRole === 'super_admin' ? 'bg-purple-100 text-purple-800' :
              userRole === 'station_admin' ? 'bg-blue-100 text-blue-800' :
              userRole === 'driver' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {userRole === 'super_admin' ? 'Super Admin' : 
               userRole === 'station_admin' ? 'Station Admin' : 
               userRole === 'driver' ? 'Driver' : 'Passenger'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
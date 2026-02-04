import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Car, 
  DollarSign, 
  Calendar,
  UserPlus,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/auth.service';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    todayBookings: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users data based on admin role
      let usersData;
      if (user?.role === 'super_admin') {
        const response = await authService.getAllUsers();
        usersData = response.users || [];
      } else if (user?.role === 'station_admin') {
        const response = await authService.getStationUsers();
        usersData = response.users || [];
      } else {
        usersData = [];
      }

      // Calculate statistics
      const totalUsers = usersData.length;
      const activeDrivers = usersData.filter(u => 
        u.role === 'driver' && u.isActive
      ).length;
      
      // For now, use mock data for revenue and bookings
      // TODO: Replace with actual APIs when available
      const totalRevenue = 85000; // ETB
      const todayBookings = 1284;

      // Get recent users (last 5)
      const recentUsersList = usersData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(user => ({
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          status: user.isActive ? 'Active' : 'Inactive',
          statusColor: user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
          createdAt: new Date(user.createdAt).toLocaleDateString()
        }));

      setStats({
        totalUsers,
        activeDrivers,
        totalRevenue,
        todayBookings
      });

      setRecentUsers(recentUsersList);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getRoleDisplay = (role) => {
    const roleMap = {
      'passenger': 'Passenger',
      'driver': 'Driver',
      'station_admin': 'Station Admin',
      'super_admin': 'Super Admin'
    };
    return roleMap[role] || role;
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  const getDashboardTitle = () => {
    if (!user) return 'Dashboard';
    
    switch(user.role) {
      case 'super_admin': return 'Super Admin Dashboard';
      case 'station_admin': return 'Station Admin Dashboard';
      case 'driver': return 'Driver Dashboard';
      case 'passenger': return 'Passenger Dashboard';
      default: return 'Dashboard';
    }
  };

  const getWelcomeMessage = () => {
    if (!user) return 'Welcome back!';
    
    const time = new Date().getHours();
    let greeting = 'Good ';
    
    if (time < 12) greeting += 'Morning';
    else if (time < 18) greeting += 'Afternoon';
    else greeting += 'Evening';
    
    return `${greeting}, ${user.fullName?.split(' ')[0] || 'Admin'}! Here's what's happening today.`;
  };

  const getStatsCards = () => {
    if (user?.role === 'passenger' || user?.role === 'driver') {
      return [
        { 
          icon: Calendar, 
          label: 'My Trips', 
          value: '0',
          change: 'No trips yet',
          color: 'bg-blue-50',
          iconColor: 'text-blue-600'
        },
        { 
          icon: Users, 
          label: 'Notifications', 
          value: '0',
          change: 'All caught up',
          color: 'bg-green-50',
          iconColor: 'text-green-600'
        },
        { 
          icon: DollarSign, 
          label: 'Account Balance', 
          value: 'ETB 0',
          change: '+0 this month',
          color: 'bg-purple-50',
          iconColor: 'text-purple-600'
        },
        { 
          icon: Settings, 
          label: 'Pending Actions', 
          value: '0',
          change: 'All done',
          color: 'bg-orange-50',
          iconColor: 'text-orange-600'
        }
      ];
    }

    return [
      { 
        icon: Users, 
        label: 'Total Users', 
        value: stats.totalUsers,
        change: '+0 today',
        color: 'bg-blue-50',
        iconColor: 'text-blue-600'
      },
      { 
        icon: Car, 
        label: 'Active Drivers', 
        value: stats.activeDrivers,
        change: stats.activeDrivers > 0 ? '+0 on duty' : 'No drivers',
        color: 'bg-green-50',
        iconColor: 'text-green-600'
      },
      { 
        icon: DollarSign, 
        label: 'Total Revenue', 
        value: formatCurrency(stats.totalRevenue),
        change: '+8.5% from yesterday',
        color: 'bg-purple-50',
        iconColor: 'text-purple-600'
      },
      { 
        icon: Calendar, 
        label: 'Today\'s Bookings', 
        value: stats.todayBookings,
        change: '+12% from yesterday',
        color: 'bg-orange-50',
        iconColor: 'text-orange-600'
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = getStatsCards();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
          <p className="text-gray-600">{getWelcomeMessage()}</p>
        </div>
        
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <button 
              onClick={fetchDashboardData}
              className="ml-2 p-1 hover:bg-gray-100 rounded"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{stat.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users/Activity */}
      {(user?.role === 'super_admin' || user?.role === 'station_admin') && recentUsers.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Users</h2>
            <span className="text-sm text-gray-500">
              Showing {recentUsers.length} of {stats.totalUsers} users
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Joined</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <div className="font-medium">{user.name}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-600">{user.createdAt}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.statusColor}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions based on role */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {user?.role === 'super_admin' && (
            <>
              <button className="btn-primary py-3 flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
              <button className="btn-primary py-3 flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Manage Roles
              </button>
            </>
          )}
          
          {user?.role === 'station_admin' && (
            <>
              <button className="btn-primary py-3 flex items-center justify-center gap-2">
                <Car className="w-4 h-4" />
                Assign Driver
              </button>
              <button className="btn-primary py-3 flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                View Passengers
              </button>
            </>
          )}
          
          {(user?.role === 'super_admin' || user?.role === 'station_admin') && (
            <>
              <button className="btn-primary py-3 flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                View Reports
              </button>
              <button className="btn-primary py-3 flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </>
          )}
          
          {user?.role === 'driver' && (
            <>
              <button className="btn-primary py-3">Start Trip</button>
              <button className="btn-primary py-3">View Schedule</button>
              <button className="btn-primary py-3">My Earnings</button>
              <button className="btn-primary py-3">Update Status</button>
            </>
          )}
          
          {user?.role === 'passenger' && (
            <>
              <button className="btn-primary py-3">Book Trip</button>
              <button className="btn-primary py-3">My Bookings</button>
              <button className="btn-primary py-3">Payment Methods</button>
              <button className="btn-primary py-3">Help Center</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
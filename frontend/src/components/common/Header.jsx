import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, Bell, LogOut, MapPin, Bus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Format user display name
  const getDisplayName = () => {
    if (!user) return '';
    return user.fullName || user.email.split('@')[0];
  };

  // Get user role display
  const getRoleDisplay = () => {
    if (!user) return '';
    const roleMap = {
      'passenger': 'Passenger',
      'driver': 'Driver',
      'station_admin': 'Station Admin',
      'super_admin': 'Super Admin'
    };
    return roleMap[user.role] || user.role;
  };

  return (
    <header 
      className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 shadow-xl"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(49, 46, 129, 0.95) 100%),
          url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2360a5fa' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")
        `,
        backgroundSize: 'cover, 200px'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white group-hover:text-cyan-100 transition-colors">
                Bahir Dar Meneharia
              </span>
              <span className="text-xs text-blue-200 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                Smart City Transport
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated && (
              <>
                {user?.role === 'super_admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                  >
                    <span className="relative z-10">Admin Dashboard</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </Link>
                )}
                {user?.role === 'station_admin' && (
                  <Link 
                    to="/station/dashboard" 
                    className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                  >
                    <span className="relative z-10">Station Control</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </Link>
                )}
                {user?.role === 'driver' && (
                  <Link 
                    to="/driver/dashboard" 
                    className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                  >
                    <span className="relative z-10">Driver Hub</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                >
                  <span className="relative z-10">My Profile</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </Link>
              </>
            )}
          </nav>

          {/* Enhanced User Actions */}
          <div className="flex items-center space-x-6">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-6">
                {/* Enhanced Notifications */}
                <button className="relative p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group">
                  <Bell className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    0
                  </span>
                </button>

                {/* Enhanced User Info */}
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                    <p className="text-xs text-blue-200 bg-blue-900/30 px-2 py-0.5 rounded-full inline-block">
                      {getRoleDisplay()}
                    </p>
                  </div>
                  <div className="relative group">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/30 ring-offset-2 ring-offset-blue-900 group-hover:ring-cyan-400 transition-all duration-300">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>

                {/* Enhanced Logout */}
                <button
                  onClick={handleLogout}
                  className="p-3 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 text-white hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 group"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link 
                  to="/login" 
                  className="text-white/90 hover:text-white px-6 py-2.5 rounded-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden group"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 group-hover:animate-shine"></div>
                </Link>
              </div>
            )}

            {/* Enhanced Mobile Menu Button */}
            <button className="md:hidden p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>

      {/* Add this CSS for the shine animation */}
      <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .animate-shine {
          animation: shine 1.5s ease-out;
        }
      `}</style>
    </header>
  );
}
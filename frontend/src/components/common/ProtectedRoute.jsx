import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles = [] 
}) {
  const { isAuthenticated, user, loading } = useAuth();
  const { t } = useTranslation(); // ✅ ADD THIS
  const location = useLocation();

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-200 border-t-primary-600"></div>
        <p className="mt-4 text-gray-600">{t('checking_authentication')}</p> {/* ✅ TRANSLATED */}
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check if user is active (from backend)
  if (user && !user.isActive) {
    // Log out inactive users
    setTimeout(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login?error=account_inactive';
    }, 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.928-.833-2.698 0L4.398 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('account_deactivated')}</h2> {/* ✅ TRANSLATED */}
          <p className="text-gray-600 mb-4">{t('account_deactivated_message')}</p> {/* ✅ TRANSLATED */}
          <p className="text-sm text-gray-500">{t('redirecting_to_login')}</p> {/* ✅ TRANSLATED */}
        </div>
      </div>
    );
  }

  // Role-based access control
  if (requiredRole || allowedRoles.length > 0) {
    const userRole = user?.role;
    let hasAccess = false;

    console.log('ROLE DEBUG - User role:', userRole, 'Required:', requiredRole, 'Allowed:', allowedRoles);

    // Check specific required role
    if (requiredRole) {
      // Super admin can access everything
      if (userRole === 'super_admin') {
        hasAccess = true;
      }
      // Station admin can access station_admin routes
      else if (requiredRole === 'station_admin' && userRole === 'station_admin') {
        hasAccess = true;
      }
      // Check exact match
      else {
        hasAccess = userRole === requiredRole;
      }
    }
    
    // Check allowed roles array
    if (allowedRoles.length > 0) {
      // Super admin can access everything
      if (userRole === 'super_admin') {
        hasAccess = true;
      }
      // Check if user role is in allowed roles
      else {
        hasAccess = allowedRoles.includes(userRole);
      }
    }

    // If no access, redirect to appropriate dashboard
    if (!hasAccess) {
      console.warn(`Access denied. User role: ${userRole}, Required: ${requiredRole}, Allowed: ${allowedRoles}`);
      
      // Redirect based on user's role
      switch (userRole) {
        case 'passenger':
          return <Navigate to="/dashboard" replace />;
        case 'driver':
          return <Navigate to="/driver/dashboard" replace />;
        case 'station_admin':
          return <Navigate to="/station/dashboard" replace />;
        case 'super_admin':
          return <Navigate to="/admin/dashboard" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
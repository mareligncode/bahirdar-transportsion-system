import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import NotificationBell from '../notifications/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Menu, X } from 'lucide-react';

export default function Layout({ children, showSidebar = false }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const shouldShowSidebar = showSidebar && isAuthenticated && user &&
    ['super_admin', 'station_admin', 'driver', 'passenger'].includes(user.role);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${settings.themeMode === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}>
      <Header
        onMenuClick={shouldShowSidebar ? (() => setSidebarOpen(!sidebarOpen)) : null}
        isMenuOpen={sidebarOpen}
      />


      <div className="flex flex-1 min-h-0">
        {shouldShowSidebar && (
          <>
            {/* Mobile Overlay when sidebar is open */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-[60] md:hidden backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
                aria-label={t('close_overlay')}
              />
            )}

            {/* Sidebar */}
            <div className={`
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              md:translate-x-0 md:relative
              fixed md:static top-0 left-0 h-full z-[70]
              transition-transform duration-300 ease-in-out
              overflow-y-auto
              md:overflow-visible
              w-72 max-w-[80%] md:w-auto
            `}>
              <Sidebar userRole={user.role} />
            </div>
          </>
        )}

        <main className="flex-1 min-h-0 overflow-y-auto">
          {/* Remove the py-8 padding to eliminate spacing, and add negative margin if needed */}
          <div className="container mx-auto px-2 sm:px-4">
            {children}
          </div>
        </main>
      </div>

      {/* Notification Bell - Only show for authenticated users */}
      {isAuthenticated && (
        <div className="fixed top-20 right-6 z-50 md:top-24 md:right-8">
          <NotificationBell />
        </div>
      )}

      <Footer />
    </div>
  );
}
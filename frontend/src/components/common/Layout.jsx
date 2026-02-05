import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { Menu, X } from 'lucide-react';

export default function Layout({ children, showSidebar = false }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const shouldShowSidebar = showSidebar && isAuthenticated && user && 
    ['super_admin', 'station_admin', 'driver','passenger'].includes(user.role);
    ['super_admin', 'station_admin', 'driver'].includes(user.role);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Mobile Menu Toggle Button */}
      {shouldShowSidebar && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all duration-300 flex items-center justify-center"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}
      
      <div className="flex flex-1 min-h-0">
        {shouldShowSidebar && (
          <>
            {/* Mobile Overlay when sidebar is open */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/30 z-30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar - Scrollable only on mobile */}
            <div className={`
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              md:translate-x-0 md:relative
              fixed md:static top-0 left-0 h-full w-64 bg-white border-r shadow-sm z-40
              transition-transform duration-300 ease-in-out
              overflow-y-auto  /* Makes sidebar scrollable */
              md:overflow-visible  /* Removes scrollbar on desktop */
            `}>
              <Sidebar userRole={user.role} />
            </div>
          </>
        )}
        
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
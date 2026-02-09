// Authentication Routes
export const AUTH_ROUTES = {
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  FORGOT_PASSWORD: '/(auth)/forgot-password',
} as const;

// Main App Routes
export const MAIN_ROUTES = {
  HOME: '/(main)/home',
  TRIPS: {
    INDEX: '/(main)/trips',
    SEARCH: '/(main)/trips/search',
    DETAILS: '/(main)/trips/[id]',
    SEAT_SELECTION: '/(main)/trips/seat-selection',
  },
  BOOKING: {
    INDEX: '/(main)/booking',
    DETAILS: '/(main)/booking/[id]',
    CANCEL: '/(main)/booking/cancel-reschedule',
  },
  PAYMENT: {
    CHECKOUT: '/(main)/payment/checkout',
    SUCCESS: '/(main)/payment/success',
    HISTORY: '/(main)/payment/history',
  },
  TICKETS: {
    INDEX: '/(main)/tickets',
    DETAILS: '/(main)/tickets/[id]',
  },
  TRACKING: {
    LIVE: '/(main)/tracking/live-tracking',
  },
  SUPPORT: {
    CONTACT: '/(main)/support/contact',
    FEEDBACK: '/(main)/support/feedback',
    HELP: '/(main)/support/help',
  },
} as const;

// Profile & Settings Routes
export const PROFILE_ROUTES = {
  PROFILE: '/(main)/profile',
  EDIT_PROFILE: '/(main)/profile/edit-profile',
  BOOKINGS: '/(main)/profile/bookings',
  SETTINGS: '/(main)/profile/settings',
} as const;

export const SETTINGS_ROUTES = {
  NOTIFICATIONS: '/(main)/profile/settings/notifications',
  LANGUAGE: '/(main)/profile/settings/language',
  PRIVACY: '/(main)/profile/settings/privacy-security',
  ABOUT: '/(main)/profile/settings/about',
} as const;

// Navigation Constants
export const TAB_ROUTES = [
  { name: 'Home', route: MAIN_ROUTES.HOME, icon: 'home' },
  { name: 'Trips', route: MAIN_ROUTES.TRIPS.INDEX, icon: 'bus' },
  { name: 'Tickets', route: MAIN_ROUTES.TICKETS.INDEX, icon: 'ticket' },
  { name: 'Profile', route: PROFILE_ROUTES.PROFILE, icon: 'user' },
] as const;

// Unified route constants for backward compatibility or direct usage
export const ROUTES = {
  // Auth routes
  LOGIN: AUTH_ROUTES.LOGIN,
  REGISTER: AUTH_ROUTES.REGISTER,
  FORGOT_PASSWORD: AUTH_ROUTES.FORGOT_PASSWORD,
  
  // Main routes
  HOME: MAIN_ROUTES.HOME,
  SEARCH: MAIN_ROUTES.TRIPS.SEARCH,
  TRIPS: MAIN_ROUTES.TRIPS.INDEX,
  TRIP_DETAILS: MAIN_ROUTES.TRIPS.DETAILS,
  SEAT_SELECTION: MAIN_ROUTES.TRIPS.SEAT_SELECTION,
  BOOKINGS: MAIN_ROUTES.BOOKING.INDEX,
  BOOKING_DETAILS: MAIN_ROUTES.BOOKING.DETAILS,
  CHECKOUT: MAIN_ROUTES.PAYMENT.CHECKOUT,
  TICKET_DETAILS: MAIN_ROUTES.TICKETS.DETAILS,
  
  // Profile routes
  PROFILE: PROFILE_ROUTES.PROFILE,
  PROFILE_BOOKINGS: PROFILE_ROUTES.BOOKINGS,
} as const;

// Type definitions
export type AuthRoute = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES];
export type MainRoute = typeof MAIN_ROUTES[keyof typeof MAIN_ROUTES];
export type ProfileRoute = typeof PROFILE_ROUTES[keyof typeof PROFILE_ROUTES];
export type SettingsRoute = typeof SETTINGS_ROUTES[keyof typeof SETTINGS_ROUTES];
export type Route = typeof ROUTES[keyof typeof ROUTES];
export type TabRoute = typeof TAB_ROUTES[number];

// App Constants
export const APP_CONSTANTS = {
  APP_NAME: 'Bahir Dar Transport',
  VERSION: '1.0.0',
  CONTACT_EMAIL: 'support@bahirdartransport.com',
  PHONE_PREFIX: '+251',
  AUTH_PREFIX: '/(auth)',
  MAIN_PREFIX: '/(main)',
  PROFILE_PREFIX: '/(main)/profile',
} as const;

// Default export for easy imports
export default {
  AUTH_ROUTES,
  MAIN_ROUTES,
  PROFILE_ROUTES,
  SETTINGS_ROUTES,
  TAB_ROUTES,
  ROUTES,
  APP_CONSTANTS,
};
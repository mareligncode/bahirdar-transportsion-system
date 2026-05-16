export const AUTH_ROUTES = {
  LOGIN: '/auth/Login',
  REGISTER: '/auth/Register',
  FORGOT_PASSWORD: '/auth/Forgot-Password',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

export const MAIN_ROUTES = {
  HOME: '/tabs/home',
  TRIPS: {
    INDEX: '/tabs/trips',
    SEARCH: '/tabs/trips/search',
    DETAILS: '/tabs/trips/[id]',
    SEAT_SELECTION: '/tabs/trips/seat-selection',
  },
  BOOKING: {
    INDEX: '/(screens)/booking',
    DETAILS: '/(screens)/booking/id',
    CANCEL: '/(screens)/booking/cancel',
    CONFIRMATION: '/(screens)/booking/confirmation',
    PASSENGER_DETAILS: '/(screens)/booking/passenger-details',
  },
  PAYMENT: {
    CHECKOUT: '/(screens)/payment/checkout',
    SUCCESS: '/(screens)/payment/success',
    HISTORY: '/(screens)/payment/history',
  },
  TICKETS: {
    INDEX: '/tabs/tickets',
    DETAILS: '/tabs/tickets/[id]',
    BOOKINGS: '/tabs/tickets/bookings',
  },
  SUPPORT: {
    INDEX: '/menu/support',
    CONTACT: '/menu/support/contact',
    FEEDBACK: '/menu/support/feedback',
    HELP: '/menu/support/help',
  },
} as const;

export const PROFILE_ROUTES = {
  PROFILE: '/tabs/profile',
  SETTINGS: '/menu/settings',
  BOOKINGS: '/tabs/tickets',
} as const;

export const SETTINGS_ROUTES = {
  INDEX: '/menu/settings',
  NOTIFICATIONS: '/menu/settings/notifications',
  LANGUAGE: '/menu/settings/language',
  PRIVACY: '/menu/settings/privacy-security',
  ABOUT: '/menu/about',
} as const;

export const TAB_ROUTES = [
  { name: 'Home', route: MAIN_ROUTES.HOME, icon: 'home' },
  { name: 'Trips', route: MAIN_ROUTES.TRIPS.INDEX, icon: 'bus' },
  { name: 'Tickets', route: MAIN_ROUTES.TICKETS.INDEX, icon: 'ticket' },
  { name: 'Profile', route: PROFILE_ROUTES.PROFILE, icon: 'user' },
] as const;

export const ROUTES = {

  LOGIN: AUTH_ROUTES.LOGIN,
  REGISTER: AUTH_ROUTES.REGISTER,
  FORGOT_PASSWORD: AUTH_ROUTES.FORGOT_PASSWORD,

  HOME: MAIN_ROUTES.HOME,
  SEARCH: MAIN_ROUTES.TRIPS.SEARCH,
  TRIPS: MAIN_ROUTES.TRIPS.INDEX,
  TRIP_DETAILS: MAIN_ROUTES.TRIPS.DETAILS,
  SEAT_SELECTION: MAIN_ROUTES.TRIPS.SEAT_SELECTION,
  BOOKINGS: MAIN_ROUTES.BOOKING.INDEX,
  BOOKING_DETAILS: MAIN_ROUTES.BOOKING.DETAILS,
  CHECKOUT: MAIN_ROUTES.PAYMENT.CHECKOUT,
  TICKET_DETAILS: MAIN_ROUTES.TICKETS.DETAILS,

  PROFILE: PROFILE_ROUTES.PROFILE,
  PROFILE_BOOKINGS: PROFILE_ROUTES.BOOKINGS,
} as const;

export type AuthRoute = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES];
export type MainRoute = typeof MAIN_ROUTES[keyof typeof MAIN_ROUTES];
export type ProfileRoute = typeof PROFILE_ROUTES[keyof typeof PROFILE_ROUTES];
export type SettingsRoute = typeof SETTINGS_ROUTES[keyof typeof SETTINGS_ROUTES];
export type Route = typeof ROUTES[keyof typeof ROUTES];
export type TabRoute = typeof TAB_ROUTES[number];

export const APP_CONSTANTS = {
  APP_NAME: 'Bahir Dar Transport',
  VERSION: '1.0.0',
  CONTACT_EMAIL: 'support@bahirdartransport.com',
  PHONE_PREFIX: '+251',
  AUTH_PREFIX: '/auth',
  MAIN_PREFIX: '/tabs',
  PROFILE_PREFIX: '/tabs/profile',
} as const;

export default {
  AUTH_ROUTES,
  MAIN_ROUTES,
  PROFILE_ROUTES,
  SETTINGS_ROUTES,
  TAB_ROUTES,
  ROUTES,
  APP_CONSTANTS,
};
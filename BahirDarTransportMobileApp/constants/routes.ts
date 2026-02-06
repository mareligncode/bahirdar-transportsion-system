
export const ROUTES = {
  // Auth routes
  LOGIN: '/auth/Login',
  REGISTER: '/auth/Register',
  FORGOT_PASSWORD: '/auth/Forgot-Password',
  
  // Main routes
  HOME: '/',
  SEARCH: '/main/search',
  TRIPS: '/main/trips',
  TRIP_DETAILS: '/main/trips/[id]',
  SEAT_SELECTION: '/main/trips/seat-selection',
  BOOKINGS: '/main/booking',
  BOOKING_DETAILS: '/main/booking/[id]',
  CHECKOUT: '/main/payment/checkout',
  TICKET_DETAILS: '/main/tickets/[id]',
  
  // Profile routes
  PROFILE: '/profile',
  PROFILE_BOOKINGS: '/profile/bookings',
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];

// Add any other constants you might need
export const APP_CONSTANTS = {
  APP_NAME: 'Bahir Dar Transport',
  VERSION: '1.0.0',
  CONTACT_EMAIL: 'support@bahirdartransport.com',
  PHONE_PREFIX: '+251',
} as const;
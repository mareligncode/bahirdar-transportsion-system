import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';

type SeatColors = typeof COLORS.seat;
type TripStatusColors = typeof COLORS.tripStatus;
type BookingColors = typeof COLORS.booking;

type ColorStrings = {
  [K in keyof typeof COLORS]: typeof COLORS[K] extends string ? string : typeof COLORS[K];
};

const theme = {
  colors: {
    ...COLORS,
  } as any,

  typography: TYPOGRAPHY,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  borders: {
    radius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      '2xl': 24,
      full: 9999,
    },
    width: {
      none: 0,
      thin: 1,
      medium: 2,
      thick: 3,
    },
  },

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: COLORS.gray900,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: COLORS.gray900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: COLORS.gray900,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    },
  },

  components: {
    button: {
      primary: {
        backgroundColor: COLORS.primary,
        textColor: COLORS.white,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
      secondary: {
        backgroundColor: COLORS.gray100,
        textColor: COLORS.gray800,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: COLORS.primary,
        borderWidth: 1,
        textColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
      sizes: {
        sm: {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
        },
        md: {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
        },
        lg: {
          paddingVertical: 16,
          paddingHorizontal: 32,
          fontSize: 18,
        },
      },
    },

    card: {
      backgroundColor: COLORS.cardBackground,
      borderRadius: 12,
      padding: 16,
      defaultShadow: 'md',
    },

    input: {
      backgroundColor: COLORS.white,
      borderColor: COLORS.gray300,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      textColor: COLORS.textPrimary,
      placeholderColor: COLORS.gray400,
      focus: {
        borderColor: COLORS.primary,
      },
      error: {
        borderColor: COLORS.danger,
      },
    },

    badge: {
      success: {
        backgroundColor: `${COLORS.success}20`,
        textColor: COLORS.success,
      },
      warning: {
        backgroundColor: `${COLORS.warning}20`,
        textColor: COLORS.warning,
      },
      danger: {
        backgroundColor: `${COLORS.danger}20`,
        textColor: COLORS.danger,
      },
      info: {
        backgroundColor: `${COLORS.info}20`,
        textColor: COLORS.info,
      },
    },
  },

  layout: {
    containerMaxWidth: 1200,
    screenPadding: 16,
    headerHeight: 64,
    tabBarHeight: 56,
  },

  animation: {
    timing: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },

  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
};
export const THEME = theme;

export type Theme = any;
export type Color =
  | keyof Omit<typeof COLORS, 'seat' | 'tripStatus' | 'booking'>
  | 'seat'
  | 'tripStatus'
  | 'booking';
export type ThemeColor =
  | string
  | SeatColors
  | TripStatusColors
  | BookingColors;

export type ThemeSpacing = keyof typeof THEME.spacing;
export type ThemeBorderRadius = keyof typeof THEME.borders.radius;
export type ThemeShadow = keyof typeof THEME.shadows;
export type ThemeTypographyVariant = keyof typeof THEME.typography;

export const getColor = (color: keyof typeof COLORS): string | object => {
  return COLORS[color];
};

export const getColorString = (color: keyof Omit<typeof COLORS, 'seat' | 'tripStatus' | 'booking'>): string => {
  return COLORS[color] as string;
};

export const getSpacing = (size: ThemeSpacing): number => THEME.spacing[size];
export const getBorderRadius = (radius: ThemeBorderRadius): number => THEME.borders.radius[radius];
export const getFontSize = (variant: ThemeTypographyVariant): number => THEME.typography[variant].fontSize;

export const getShadow = (shadow: ThemeShadow) => {
  return THEME.shadows[shadow];
};

export const lightTheme: Theme = THEME;

export const darkTheme: Theme = {
  ...THEME,
  colors: {
    ...COLORS,
    background: COLORS.gray900,
    cardBackground: COLORS.gray800,
    textPrimary: COLORS.gray100,
    textSecondary: COLORS.gray300,
    textTertiary: COLORS.gray400,
    inputBackground: COLORS.gray800,
    border: COLORS.gray700,
    borderLight: COLORS.gray800,
    borderDark: COLORS.gray600,
  },
  components: {
    ...THEME.components,
    card: {
      ...THEME.components.card,
      backgroundColor: COLORS.gray800,
    },
    input: {
      ...THEME.components.input,
      backgroundColor: COLORS.gray800,
      borderColor: COLORS.gray600,
      textColor: COLORS.gray100,
      placeholderColor: COLORS.gray500,
    },
  },
};
export default THEME;
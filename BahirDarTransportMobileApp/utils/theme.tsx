import { COLORS } from '../constants/colors';

// Define the theme structure first
const theme = {
  // Colors
  colors: COLORS,
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Borders
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
  
  // Shadows
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
  
  // Components
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
      defaultShadow: 'md' as const,
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
        backgroundColor: `${COLORS.success}20`, // 20 = 12% opacity in hex
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
  
  // Layout
  layout: {
    containerMaxWidth: 1200,
    screenPadding: 16,
    headerHeight: 64,
    tabBarHeight: 56,
  },
  
  // Animation
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
  
  // Breakpoints (for responsive design)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} as const;

// Define THEME as const after theme object is fully defined
export const THEME = theme;

// Type definitions
export type Theme = typeof THEME;
export type Color = keyof typeof COLORS;
export type ThemeColor = typeof COLORS[keyof typeof COLORS];
export type ThemeSpacing = keyof typeof THEME.spacing;
export type ThemeBorderRadius = keyof typeof THEME.borders.radius;
export type ThemeShadow = keyof typeof THEME.shadows;
export type ThemeTypographySize = keyof typeof THEME.typography.fontSize;
export type ThemeTypographyWeight = keyof typeof THEME.typography.fontWeight;

// Helper functions
export const getColor = (color: Color): string => COLORS[color];
export const getSpacing = (size: ThemeSpacing): number => THEME.spacing[size];
export const getBorderRadius = (radius: ThemeBorderRadius): number => THEME.borders.radius[radius];
export const getFontSize = (size: ThemeTypographySize): number => THEME.typography.fontSize[size];

// Fixed getShadow function with proper typing
export const getShadow = (shadow: ThemeShadow) => {
  const shadows = {
    none: THEME.shadows.none,
    sm: THEME.shadows.sm,
    md: THEME.shadows.md,
    lg: THEME.shadows.lg,
  };
  return shadows[shadow];
};

// Theme variants for light/dark mode
export const lightTheme = THEME;

export const darkTheme = {
  ...THEME,
  colors: {
    ...COLORS,
    // Override colors for dark mode
    background: COLORS.gray900,
    cardBackground: COLORS.gray800,
    textPrimary: COLORS.gray100,
    textSecondary: COLORS.gray300,
    textTertiary: COLORS.gray400,
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
} as const;

// Default export
export default THEME;
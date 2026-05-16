import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useFont } from '@/context/FontContext';
import { TYPOGRAPHY, TypographyVariant } from '@/constants/typography';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'bodyMedium',
  color,
  weight,
  align,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const { fontScale } = useFont();

  const baseStyle = TYPOGRAPHY[variant];
  
  const customStyle: TextStyle = {
    fontSize: baseStyle.fontSize * fontScale,
    lineHeight: baseStyle.lineHeight * fontScale,
    fontWeight: weight || baseStyle.fontWeight,
    color: color ? (colors[color as keyof typeof colors] || color) : colors.textPrimary,
    textAlign: align,
  };

  if (variant === 'label') {
    customStyle.textTransform = 'uppercase';
  }

  return (
    <Text style={[customStyle, style]} {...props}>
      {children}
    </Text>
  );
};

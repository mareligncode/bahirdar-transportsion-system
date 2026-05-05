import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Switch,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar
} from '@mui/material';
import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Translate as TranslateIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

const QuickSettings = () => {
  const { settings, toggleTheme, updateSetting } = useSettings();
  const { t } = useTranslation(); // ✅ ADD THIS
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const languages = [
    { code: 'en', name: t('english'), flag: '🇺🇸' },
    { code: 'am', name: t('amharic'), flag: '🇪🇹' }
  ];

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
        aria-label={t('quick_settings')} // ✅ TRANSLATED
      >
        <SettingsIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 300, maxWidth: '100%' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('quick_settings')} {/* ✅ TRANSLATED */}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {t('adjust_your_preferences_quickly')} {/* ✅ TRANSLATED */}
          </Typography>
        </Box>
        
        <Divider />
        
        {/* Theme Toggle */}
        <MenuItem onClick={toggleTheme}>
          <ListItemIcon>
            {settings.themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </ListItemIcon>
          <ListItemText 
            primary={t('theme')} // ✅ TRANSLATED
            secondary={settings.themeMode === 'dark' ? t('dark_mode') : t('light_mode')} // ✅ TRANSLATED
          />
          <Chip 
            label={settings.themeMode === 'dark' ? t('dark') : t('light')} // ✅ TRANSLATED
            size="small" 
            color="primary"
            variant="outlined"
          />
        </MenuItem>
        
        {/* Language Selection */}
        <MenuItem>
          <ListItemIcon>
            <TranslateIcon />
          </ListItemIcon>
          <ListItemText 
            primary={t('language')} // ✅ TRANSLATED
            secondary={languages.find(l => l.code === settings.language)?.name}
          />
          <Chip 
            label={languages.find(l => l.code === settings.language)?.flag}
            size="small"
          />
        </MenuItem>
        
        {/* Notifications Toggle */}
        <MenuItem>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText 
            primary={t('notifications')} // ✅ TRANSLATED
            secondary={settings.pushNotifications ? t('enabled') : t('disabled')} // ✅ TRANSLATED
          />
          <Switch
            size="small"
            checked={settings.pushNotifications}
            onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </MenuItem>
        
        {/* Auto-refresh Toggle */}
        <MenuItem>
          <ListItemIcon>
            <RefreshIcon />
          </ListItemIcon>
          <ListItemText 
            primary={t('auto_refresh')} // ✅ TRANSLATED
            secondary={settings.autoRefresh ? t('enabled') : t('disabled')} // ✅ TRANSLATED
          />
          <Switch
            size="small"
            checked={settings.autoRefresh}
            onChange={(e) => updateSetting('autoRefresh', e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </MenuItem>
        
        <Divider />
        
        {/* Full Settings Link */}
        <MenuItem onClick={handleNavigateToSettings}>
          <ListItemIcon>
            <PaletteIcon />
          </ListItemIcon>
          <ListItemText 
            primary={t('all_settings')} // ✅ TRANSLATED
            secondary={t('view_all_settings_and_preferences')} // ✅ TRANSLATED
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default QuickSettings;
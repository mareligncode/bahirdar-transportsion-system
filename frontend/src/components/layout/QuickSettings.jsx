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

const QuickSettings = () => {
  const { settings, toggleTheme, updateSetting } = useSettings();
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
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹' }
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
            Quick Settings
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Adjust your preferences quickly
          </Typography>
        </Box>
        
        <Divider />
        
        {/* Theme Toggle */}
        <MenuItem onClick={toggleTheme}>
          <ListItemIcon>
            {settings.themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </ListItemIcon>
          <ListItemText 
            primary="Theme" 
            secondary={settings.themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          />
          <Chip 
            label={settings.themeMode === 'dark' ? 'Dark' : 'Light'} 
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
            primary="Language" 
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
            primary="Notifications" 
            secondary={settings.pushNotifications ? 'Enabled' : 'Disabled'}
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
            primary="Auto-refresh" 
            secondary={settings.autoRefresh ? 'Enabled' : 'Disabled'}
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
            primary="All Settings" 
            secondary="View all settings and preferences"
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default QuickSettings;
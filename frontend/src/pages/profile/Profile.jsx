// src/pages/profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';  // CORRECT IMPORT PATH
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  DriveEta as DriveEtaIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTranslation } from '../../hooks/useTranslation';

// Styled components
const ProfilePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(16),
  height: theme.spacing(16),
  border: `4px solid ${theme.palette.primary.main}`,
  marginBottom: theme.spacing(2)
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(1.5)
}));

const RoleBadge = styled(Chip)(({ theme, role }) => {
  let color;
  switch (role) {
    case 'super_admin':
      color = theme.palette.error.main;
      break;
    case 'station_admin':
      color = theme.palette.warning.main;
      break;
    case 'driver':
      color = theme.palette.info.main;
      break;
    case 'passenger':
      color = theme.palette.success.main;
      break;
    default:
      color = theme.palette.grey[500];
  }
  return {
    backgroundColor: color,
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.875rem'
  };
});

const Profile = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    emergencyContact: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/auth/profile');
      
      if (response.data.success) {
        const userData = response.data.data.user;
        setProfile(userData);
        setFormData({
          fullName: userData.fullName || '',
          phoneNumber: userData.phoneNumber || '',
          emergencyContact: userData.emergencyContact || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || t('Failed to load profile'));
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await api.put('/api/auth/profile', formData);
      
      if (response.data.success) {
        setProfile(response.data.data.user);
        setEditing(false);
        setSuccess(t('Profile updated successfully!'));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || t('Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('New passwords do not match'));
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError(t('New password must be at least 6 characters'));
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const response = await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setSuccess(t('Password changed successfully!'));
        setOpenPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || t('Failed to change password'));
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    try {
      setSaving(true);
      setError('');
      
      const response = await api.post('/api/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          profilePicture: response.data.data.profilePicture
        }));
        setOpenAvatarDialog(false);
        setAvatarFile(null);
        setAvatarPreview('');
        setSuccess(t('Profile picture updated successfully!'));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err.response?.data?.message || t('Failed to upload profile picture'));
    } finally {
      setSaving(false);
    }
  };

  // Handle file selection for avatar
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError(t('Please select an image file'));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError(t('Image size must be less than 5MB'));
      return;
    }
    
    setAvatarFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return t('N/A');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin': return t('Super Administrator');
      case 'station_admin': return t('Station Administrator');
      case 'driver': return t('Driver');
      case 'passenger': return t('Passenger');
      default: return role;
    }
  };

  // Initialize on component mount
  useEffect(() => {
    fetchProfile();
  }, []); // ⚠️ NO 't' here!

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {t('Failed to load profile. Please try again.')}
        </Alert>
        <Button variant="contained" onClick={fetchProfile} sx={{ mt: 2 }}>
          {t('Retry')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Snackbars for messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <ProfilePaper>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('My Profile')}
          </Typography>
          {!editing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
            >
              {t('Edit Profile')}
            </Button>
          )}
        </Box>

        {/* Profile Overview */}
        <Grid container spacing={4}>
          {/* Left Column - Avatar & Basic Info */}
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Box position="relative">
                <ProfileAvatar
                  src={profile.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`}
                  alt={profile.fullName}
                />
                <IconButton
                  color="primary"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: 'white' }
                  }}
                  onClick={() => setOpenAvatarDialog(true)}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </Box>
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {profile.fullName}
              </Typography>
              
              <RoleBadge
                label={getRoleDisplayName(profile.role)}
                role={profile.role}
                size="medium"
                icon={<BadgeIcon />}
              />
              
              <Box mt={2}>
                <Chip
                  label={profile.isActive ? t('Active') : t('Inactive')}
                  color={profile.isActive ? 'success' : 'error'}
                  size="small"
                  icon={profile.isActive ? <CheckCircleIcon /> : <ErrorIcon />}
                  variant="outlined"
                />
              </Box>
            </Box>
            
            {/* Quick Stats */}
            <ProfileSection mt={3}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t('Account Information')}
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('Member Since')} 
                    secondary={formatDate(profile.createdAt)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('Email')} 
                    secondary={profile.email}
                  />
                </ListItem>
                {profile.lastLogin && (
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('Last Login')} 
                      secondary={formatDate(profile.lastLogin)}
                    />
                  </ListItem>
                )}
              </List>
            </ProfileSection>
            
            {/* Actions */}
            <Box mt={3}>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                fullWidth
                onClick={() => setOpenPasswordDialog(true)}
              >
                {t('Change Password')}
              </Button>
            </Box>
          </Grid>

          {/* Right Column - Detailed Info & Edit Form */}
          <Grid item xs={12} md={8}>
            {editing ? (
              // Edit Form
              <ProfileSection>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('Edit Profile Information')}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('Full Name')}
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('Phone Number')}
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('Emergency Contact')}
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      placeholder={t('Name and phone number')}
                      helperText={t('In case of emergencies')}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleUpdateProfile}
                        disabled={saving}
                      >
                        {saving ? <CircularProgress size={24} /> : t('Save Changes')}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            fullName: profile.fullName || '',
                            phoneNumber: profile.phoneNumber || '',
                            emergencyContact: profile.emergencyContact || ''
                          });
                        }}
                      >
                        {t('Cancel')}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </ProfileSection>
            ) : (
              // View Mode
              <ProfileSection>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('Personal Information')}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('Full Name')}
                      value={profile.fullName || t('Not set')}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        )
                      }}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('Phone Number')}
                      value={profile.phoneNumber || t('Not set')}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        )
                      }}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('Emergency Contact')}
                      value={profile.emergencyContact || t('Not set')}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        )
                      }}
                      variant="outlined"
                      helperText={t('Contact person in case of emergencies')}
                    />
                  </Grid>
                </Grid>
              </ProfileSection>
            )}

            {/* Role-Specific Information */}
            {profile.role === 'driver' && (
              <ProfileSection>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('Driver Information')}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('License Number')}
                      value={profile.licenseNumber || t('Not set')}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <DriveEtaIcon />
                          </InputAdornment>
                        )
                      }}
                      variant="outlined"
                    />
                  </Grid>
                  {profile.stationID && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('Assigned Station')}
                        value={profile.stationID.name || profile.stationID}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon />
                            </InputAdornment>
                          )
                        }}
                        variant="outlined"
                      />
                    </Grid>
                  )}
                </Grid>
              </ProfileSection>
            )}

            {profile.role === 'station_admin' && profile.stationID && (
              <ProfileSection>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('Station Administrator')}
                </Typography>
                <TextField
                  fullWidth
                  label={t('Managed Station')}
                  value={profile.stationID.name || profile.stationID}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    )
                  }}
                  variant="outlined"
                />
              </ProfileSection>
            )}

            {/* Account Status */}
            <ProfileSection>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t('Account Status')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {t('Account Status')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {profile.isActive ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                        <Typography variant="body1">
                          {profile.isActive ? t('Active') : t('Inactive')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {t('Last Updated')}
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(profile.updatedAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </ProfileSection>
          </Grid>
        </Grid>
      </ProfilePaper>

      {/* Change Password Dialog */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Change Password')}</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('Current Password')}
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value
                  })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current
                          })}
                          edge="end"
                        >
                          {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('New Password')}
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value
                  })}
                  helperText={t('Minimum 6 characters')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new
                          })}
                          edge="end"
                        >
                          {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('Confirm New Password')}
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value
                  })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm
                          })}
                          edge="end"
                        >
                          {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : t('Change Password')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Avatar Dialog */}
      <Dialog
        open={openAvatarDialog}
        onClose={() => setOpenAvatarDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Change Profile Picture')}</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
              <Avatar
                src={avatarPreview || profile.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`}
                sx={{ width: 150, height: 150 }}
              />
              
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleFileSelect}
              />
              
              <label htmlFor="avatar-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<PhotoCameraIcon />}
                >
                  {t('Choose Photo')}
                </Button>
              </label>
              
              {avatarFile && (
                <Typography variant="body2" color="textSecondary">
                  {t('Selected')}: {avatarFile.name}
                </Typography>
              )}
              
              <Typography variant="body2" color="textSecondary" align="center">
                {t('Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAvatarDialog(false)}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadAvatar}
            disabled={!avatarFile || saving}
          >
            {saving ? <CircularProgress size={24} /> : t('Upload')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
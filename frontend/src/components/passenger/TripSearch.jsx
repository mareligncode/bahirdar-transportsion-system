import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  FormHelperText,
  IconButton,
  InputAdornment,
  Alert,
  Box,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  SwapHoriz,
  Today,
  LocationOn,
  Info,
  Clear,
  History
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from '../../hooks/useTranslation';

const TripSearch = ({
  stations = [],
  initialData = {},
  onSearch,
  loading: externalLoading = false,
  showRecentSearches = true
}) => {
  const { t } = useTranslation();
  const isSubmittingRef = useRef(false);

  // Form state
  const [formData, setFormData] = useState(() => ({
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    date: initialData?.date ? new Date(initialData.date) : null,
  }));

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [touched, setTouched] = useState({});

  // Load recent searches from localStorage - runs once on mount
  useEffect(() => {
    if (showRecentSearches) {
      try {
        const saved = localStorage.getItem('recentTripSearches');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.slice(0, 5));
          }
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, [showRecentSearches]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.origin) {
      newErrors.origin = t('origin_required');
    }

    if (!formData.destination) {
      newErrors.destination = t('destination_required');
    }

    if (formData.origin && formData.destination && formData.origin === formData.destination) {
      newErrors.destination = t('origin_destination_same');
    }

    if (!formData.date) {
      newErrors.date = t('date_required');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.date);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = t('date_past');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Handle field change
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // Swap origin and destination
  const handleSwap = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  }, []);

  // Clear form
  const handleClear = useCallback(() => {
    setFormData({
      origin: '',
      destination: '',
      date: null
    });
    setErrors({});
    setTouched({});
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((searchData) => {
    try {
      const originStation = stations.find(s => s._id === searchData.origin);
      const destStation = stations.find(s => s._id === searchData.destination);

      const searchEntry = {
        origin: searchData.origin,
        destination: searchData.destination,
        originName: originStation?.stationName,
        destinationName: destStation?.stationName,
        date: searchData.date,
        timestamp: Date.now()
      };

      setRecentSearches(prev => {
        const filtered = prev.filter(s =>
          s.origin !== searchData.origin ||
          s.destination !== searchData.destination
        );
        const updated = [searchEntry, ...filtered].slice(0, 5);
        try {
          localStorage.setItem('recentTripSearches', JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }, [stations]);

  // Format date for backend (YYYY-MM-DD)
  const formatDateForBackend = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle form submission
  const handleSubmit = useCallback(async (event) => {
    // Prevent multiple submissions
    if (isSubmittingRef.current) return;

    // Handle both real events and synthetic calls
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    // Mark all fields as touched
    setTouched({
      origin: true,
      destination: true,
      date: true
    });

    if (!validateForm()) {
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Prepare search data for backend - format date correctly
      const searchData = {
        origin: formData.origin,
        destination: formData.destination,
        date: formatDateForBackend(formData.date)
      };

      console.log('🔍 Sending search request to backend:', searchData);
      await onSearch(searchData);
      saveRecentSearch({
        origin: formData.origin,
        destination: formData.destination,
        date: formatDateForBackend(formData.date)
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [validateForm, onSearch, formData, saveRecentSearch]);

  // Handle recent search click
  const handleRecentSearchClick = useCallback((search) => {
    // Update form data
    setFormData({
      origin: search.origin,
      destination: search.destination,
      date: search.date ? new Date(search.date) : null
    });

    // Clear any existing errors
    setErrors({});
    setTouched({
      origin: true,
      destination: true,
      date: true
    });

    // Submit the search
    const performSearch = async () => {
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setLoading(true);

      try {
        const searchData = {
          origin: search.origin,
          destination: search.destination,
          date: formatDateForBackend(search.date)
        };
        console.log('🔍 Recent search clicked, sending:', searchData);
        await onSearch(searchData);
        saveRecentSearch(searchData);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
    };

    performSearch();
  }, [onSearch, saveRecentSearch]);

  const isFormValid = useMemo(() => {
    return formData.origin && formData.destination && formData.date &&
      formData.origin !== formData.destination;
  }, [formData.origin, formData.destination, formData.date]);

  const isProcessing = loading || externalLoading;

  // Memoize station options to prevent unnecessary re-renders
  const originStationOptions = useMemo(() => {
    return stations.map((station) => (
      <MenuItem
        key={station._id}
        value={station._id}
        disabled={station._id === formData.destination}
      >
        {station.stationName} ({station.city})
      </MenuItem>
    ));
  }, [stations, formData.destination]);

  const destinationStationOptions = useMemo(() => {
    return stations.map((station) => (
      <MenuItem
        key={station._id}
        value={station._id}
        disabled={station._id === formData.origin}
      >
        {station.stationName} ({station.city})
      </MenuItem>
    ));
  }, [stations, formData.origin]);

  const recentSearchesList = useMemo(() => {
    return recentSearches.map((search, index) => (
      <Chip
        key={`${search.origin}-${search.destination}-${index}`}
        label={`${search.originName || '?'} → ${search.destinationName || '?'}`}
        onClick={() => handleRecentSearchClick(search)}
        size="small"
        icon={<History />}
        sx={{
          borderRadius: '6px',
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: '#f1f5f9',
            borderColor: '#3b82f6'
          }
        }}
      />
    ));
  }, [recentSearches, handleRecentSearchClick]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={0} sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <SearchIcon sx={{ color: '#3b82f6' }} />
            {t('search_trips')}
          </Typography>

          {(formData.origin || formData.destination || formData.date) && (
            <Tooltip title={t('clear_form')}>
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              >
                <Clear fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            {/* Origin */}
            <Grid item xs={12} md={4}>
              <FormControl
                fullWidth
                error={touched.origin && !!errors.origin}
                sx={{ minWidth: 200 }}
              >
                <InputLabel>{t('from_station')}</InputLabel>
                <Select
                  value={formData.origin}
                  label={t('from_station')}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOn sx={{ fontSize: 18, color: '#64748b' }} />
                    </InputAdornment>
                  }
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="">
                    <em>{t('select_origin')}</em>
                  </MenuItem>
                  {originStationOptions}
                </Select>
                {touched.origin && errors.origin && (
                  <FormHelperText>{errors.origin}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Swap Button */}
            <Grid item xs={12} md={1} sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: { xs: 0, md: 1 }
            }}>
              <Tooltip title={t('swap_stations')}>
                <IconButton
                  onClick={handleSwap}
                  disabled={!formData.origin && !formData.destination}
                  sx={{
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    '&:hover': { bgcolor: '#f1f5f9' },
                    width: 40,
                    height: 40
                  }}
                >
                  <SwapHoriz sx={{ color: '#3b82f6' }} />
                </IconButton>
              </Tooltip>
            </Grid>

            {/* Destination */}
            <Grid item xs={12} md={4}>
              <FormControl
                fullWidth
                error={touched.destination && !!errors.destination}
                sx={{ minWidth: 200 }}
              >
                <InputLabel>{t('to_station')}</InputLabel>
                <Select
                  value={formData.destination}
                  label={t('to_station')}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOn sx={{ fontSize: 18, color: '#64748b' }} />
                    </InputAdornment>
                  }
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="">
                    <em>{t('select_destination')}</em>
                  </MenuItem>
                  {destinationStationOptions}
                </Select>
                {touched.destination && errors.destination && (
                  <FormHelperText>{errors.destination}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Date */}
            <Grid item xs={12} md={3}>
              <DatePicker
                label={t('travel_date')}
                value={formData.date}
                onChange={(date) => handleChange('date', date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                    error={touched.date && !!errors.date}
                    helperText={touched.date && errors.date}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Today sx={{ fontSize: 18, color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
                  />
                )}
                minDate={new Date()}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} md={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isProcessing || !isFormValid}
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{
                  height: '56px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb, #1e3a8a)'
                  },
                  '&:disabled': {
                    background: '#cbd5e1'
                  }
                }}
              >
                {isProcessing ? t('searching') : t('search_trips')}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Recent Searches */}
        {showRecentSearches && recentSearches.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" sx={{
              fontWeight: 600,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 1.5
            }}>
              <History sx={{ fontSize: 16 }} />
              {t('recent_searches')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recentSearchesList}
            </Box>
          </Box>
        )}

        {/* Help Text */}
        {!stations.length && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: '8px' }}>
            <Info sx={{ mr: 1 }} />
            {t('loading_stations')}
          </Alert>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default TripSearch;
import React, { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TripSearch = ({ stations, initialData, onSearch }) => {
  const [formData, setFormData] = useState({
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    date: initialData?.date || null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSearch(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" gutterBottom>
          <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Search Trips
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ minWidth: 200, width: '100%' }}>
                <InputLabel>From Station</InputLabel>
                <Select
                  value={formData.origin}
                  label="From Station"
                  onChange={(e) => handleChange('origin', e.target.value)}
                  required
                >
                  <MenuItem value="">
                    <em>Select station</em>
                  </MenuItem>
                  {stations.map((station) => (
                    <MenuItem key={station._id} value={station._id}>
                      {station.stationName} ({station.city})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ minWidth: 200, width: '100%' }}>
                <InputLabel>To Station</InputLabel>
                <Select
                  value={formData.destination}
                  label="To Station"
                  onChange={(e) => handleChange('destination', e.target.value)}
                  required
                >
                  <MenuItem value="">
                    <em>Select station</em>
                  </MenuItem>
                  {stations.map((station) => (
                    <MenuItem key={station._id} value={station._id}>
                      {station.stationName} ({station.city})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <DatePicker
                label="Travel Date"
                value={formData.date}
                onChange={(date) => handleChange('date', date)}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDate={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !formData.origin || !formData.destination || !formData.date}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ height: '56px', borderRadius: '8px' }}
              >
                {loading ? '...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </LocalizationProvider>
  );
};

export default TripSearch;
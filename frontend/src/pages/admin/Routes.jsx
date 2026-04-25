import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box,
    Card,
    CardContent,
    Chip,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Map as MapIcon,
    Route as RouteIcon,
    AttachMoney as MoneyIcon,
    Timelapse as TimelapseIcon,
    Straighten as DistanceIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

const RoutesPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [routes, setRoutes] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formLoading, setFormLoading] = useState(false);

    // Filter and Sort states
    const [filters, setFilters] = useState({
        destination: ''
    });
    const [sortOrder, setSortOrder] = useState(''); // 'asc', 'desc', or ''

    const [routeForm, setRouteForm] = useState({
        origin: '',
        destination: '',
        routeName: '',
        basePrice: '',
        estimatedDuration: '',
        distance: ''
    });

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/route');
            if (response.data.success) {
                setRoutes(response.data.data);
            }
        } catch (err) {
            setError(t('failed_to_fetch_routes'));
        } finally {
            setLoading(false);
        }
    };

    const fetchStations = async () => {
        try {
            const response = await api.get('/api/station');
            if (response.data?.stations) {
                setStations(response.data.stations);
            } else if (response.data?.data?.stations) {
                setStations(response.data.data.stations);
            } else if (Array.isArray(response.data)) {
                setStations(response.data);
            }
        } catch (err) {
            console.error('Error fetching stations:', err);
        }
    };

    useEffect(() => {
        fetchRoutes();
        fetchStations();
    }, []);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleOpenDialog = (route = null) => {
        if (route) {
            setSelectedRoute(route);
            setRouteForm({
                origin: route.origin?._id || route.origin || '',
                destination: route.destination?._id || route.destination || '',
                routeName: route.routeName || '',
                basePrice: route.basePrice || '',
                estimatedDuration: route.estimatedDuration || '',
                distance: route.distance || ''
            });
        } else {
            setSelectedRoute(null);
            setRouteForm({
                origin: user?.role === 'station_admin' ? user.stationID : '',
                destination: '',
                routeName: '',
                basePrice: '',
                estimatedDuration: '',
                distance: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedRoute(null);
        setError(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRouteForm(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-generate route name if origin and destination are selected
            if ((name === 'origin' || name === 'destination') && updated.origin && updated.destination) {
                const originStation = stations.find(s => s._id === updated.origin);
                const destStation = stations.find(s => s._id === updated.destination);
                if (originStation && destStation) {
                    updated.routeName = `${originStation.stationName} - ${destStation.stationName}`;
                }
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        try {
            setFormLoading(true);
            if (selectedRoute) {
                await api.put(`/api/route/${selectedRoute._id}`, routeForm);
                showSnackbar(t('route_updated_successfully'));
            } else {
                await api.post('/api/route', routeForm);
                showSnackbar(t('route_created_successfully'));
            }
            fetchRoutes();
            handleCloseDialog();
        } catch (err) {
            showSnackbar(err.response?.data?.message || t('error_saving_route'), 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('confirm_delete_route'))) return;
        try {
            await api.delete(`/api/route/${id}`);
            showSnackbar(t('route_deleted_successfully'));
            fetchRoutes();
        } catch (err) {
            showSnackbar(err.response?.data?.message || t('failed_to_delete_route'), 'error');
        }
    };

    const filteredAndSortedRoutes = routes
        .filter(route => {
            if (!filters.destination) return true;
            const destId = route.destination?._id || route.destination;
            return destId === filters.destination;
        })
        .sort((a, b) => {
            if (!sortOrder) return 0;
            const priceA = Number(a.basePrice) || 0;
            const priceB = Number(b.basePrice) || 0;
            return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
        });

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                    <Grid item>
                        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                            <RouteIcon sx={{ mr: 2, color: 'primary.main', fontSize: 35 }} />
                            {t('Station Routes')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            {t('Define paths between stations to enable schedules and queueing')}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{ py: 1, px: 3, borderRadius: 2 }}
                        >
                            {t('Create New Route')}
                        </Button>
                        <IconButton onClick={fetchRoutes} sx={{ ml: 1 }}>
                            <RefreshIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </Paper>

            {/* Filter and Sort (Stabilized Layout) */}
            <Paper variant="outlined" sx={{ mb: 4, p: 2, borderRadius: 2, backgroundColor: 'grey.50' }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    gap: 2, 
                    alignItems: 'center' 
                }}>
                    <FormControl sx={{ minWidth: { xs: '100%', sm: 250 }, flexGrow: 1 }} size="small" variant="outlined">
                        <InputLabel id="destination-filter-label">{t('Filter by Destination')}</InputLabel>
                        <Select
                            labelId="destination-filter-label"
                            value={filters.destination}
                            label={t('Filter by Destination')}
                            onChange={(e) => setFilters({ destination: e.target.value })}
                            sx={{ backgroundColor: 'white' }}
                        >
                            <MenuItem value="">
                                <em>{t('All Destinations')}</em>
                            </MenuItem>
                            {stations.map(s => (
                                <MenuItem key={s._id} value={s._id}>
                                    {s.stationName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: { xs: '100%', sm: 200 }, flexGrow: 1 }} size="small" variant="outlined">
                        <InputLabel id="price-sort-label">{t('Price Ordering')}</InputLabel>
                        <Select
                            labelId="price-sort-label"
                            value={sortOrder}
                            label={t('Price Ordering')}
                            onChange={(e) => setSortOrder(e.target.value)}
                            sx={{ backgroundColor: 'white' }}
                        >
                            <MenuItem value="">{t('Default (No Sort)')}</MenuItem>
                            <MenuItem value="asc">{t('Price: Low to High')}</MenuItem>
                            <MenuItem value="desc">{t('Price: High to Low')}</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell><strong>{t('Route Name')}</strong></TableCell>
                                <TableCell><strong>{t('Origin')}</strong></TableCell>
                                <TableCell><strong>{t('Destination')}</strong></TableCell>
                                <TableCell><strong>{t('Base Price')}</strong></TableCell>
                                <TableCell><strong>{t('Duration')}</strong></TableCell>
                                <TableCell><strong>{t('Distance')}</strong></TableCell>
                                <TableCell align="right"><strong>{t('Actions')}</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAndSortedRoutes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Typography color="textSecondary">
                                            {filters.destination ? t('No routes found for this destination') : t('No routes defined yet')}
                                        </Typography>
                                        {!filters.destination && (
                                            <Button
                                                startIcon={<AddIcon />}
                                                onClick={() => handleOpenDialog()}
                                                sx={{ mt: 2 }}
                                            >
                                                {t('Define First Route')}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndSortedRoutes.map((route) => (
                                    <TableRow key={route._id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="bold">{route.routeName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LocationIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                                                {route.origin?.stationName}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LocationIcon fontSize="small" color="secondary" sx={{ mr: 0.5 }} />
                                                {route.destination?.stationName}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<MoneyIcon fontSize="small" />}
                                                label={`ETB ${route.basePrice}`}
                                                variant="outlined"
                                                size="small"
                                                color="success"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TimelapseIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                {route.estimatedDuration}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <DistanceIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                {route.distance} km
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('Edit')}>
                                                <IconButton onClick={() => handleOpenDialog(route)} size="small" color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('Delete')}>
                                                <IconButton onClick={() => handleDelete(route._id)} size="small" color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MapIcon color="primary" />
                    {selectedRoute ? t('Update Route') : t('Define New Route')}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>{t('Origin Station')}</InputLabel>
                                <Select
                                    name="origin"
                                    value={routeForm.origin}
                                    label={t('Origin Station')}
                                    onChange={handleInputChange}
                                    disabled={user?.role === 'station_admin'}
                                >
                                    {stations.map(station => (
                                        <MenuItem key={station._id} value={station._id}>
                                            {station.stationName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>{t('Destination Station')}</InputLabel>
                                <Select
                                    name="destination"
                                    value={routeForm.destination}
                                    label={t('Destination Station')}
                                    onChange={handleInputChange}
                                >
                                    {stations.map(station => (
                                        <MenuItem key={station._id} value={station._id} disabled={station._id === routeForm.origin}>
                                            {station.stationName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={t('Route Name')}
                                name="routeName"
                                value={routeForm.routeName}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. Bahir Dar - Gondar"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label={t('Base Price (ETB)')}
                                name="basePrice"
                                value={routeForm.basePrice}
                                onChange={handleInputChange}
                                required
                                InputProps={{ startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label={t('Duration')}
                                name="estimatedDuration"
                                value={routeForm.estimatedDuration}
                                onChange={handleInputChange}
                                required
                                placeholder="2h 30m"
                                InputProps={{ startAdornment: <TimelapseIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label={t('Distance (km)')}
                                name="distance"
                                value={routeForm.distance}
                                onChange={handleInputChange}
                                InputProps={{ startAdornment: <DistanceIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={handleCloseDialog} color="inherit">{t('Cancel')}</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={formLoading || !routeForm.origin || !routeForm.destination || !routeForm.basePrice}
                        sx={{ minWidth: 120 }}
                    >
                        {formLoading ? <CircularProgress size={24} /> : (selectedRoute ? t('Update') : t('Create'))}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default RoutesPage;

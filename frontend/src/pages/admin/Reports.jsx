import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Download, Calendar, Filter, TrendingUp, Users,
    CreditCard, MapPin, Bus, CheckCircle, XCircle,
    ArrowUpRight, ArrowDownRight, Activity, Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const Reports = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState('all');
    const [stats, setStats] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [bookingStats, setBookingStats] = useState(null);
    const [stationStats, setStationStats] = useState([]);
    const [recentActivity, setRecentActivity] = useState({ bookings: [], payments: [] });
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        fetchStations();
    }, []);

    useEffect(() => {
        fetchData();
    }, [period, selectedStation]);

    const fetchStations = async () => {
        try {
            const res = await api.get('/api/reports/stations-list');
            setStations(res.data.data);
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const stationQuery = selectedStation !== 'all' ? `&stationId=${selectedStation}` : '';
            const [statsRes, revenueRes, bookingRes, stationRes, activityRes] = await Promise.all([
                api.get(`/api/reports/stats?${stationQuery}`),
                api.get(`/api/reports/revenue?period=${period}${stationQuery}`),
                api.get(`/api/reports/bookings?${stationQuery}`),
                api.get('/api/reports/stations'), // Keep overall comparison
                api.get(`/api/reports/activity?${stationQuery}`)
            ]);

            setStats(statsRes.data.data);
            setRevenueData(revenueRes.data.data);
            setBookingStats(bookingRes.data.data);
            setStationStats(stationRes.data.data);
            setRecentActivity(activityRes.data.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error(t('failed_load_dashboard_data'));
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium tracking-wide">{t('analyzing_real_time_data')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('reports_title')}</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Activity size={16} />
                        {t('analytics_for')} {selectedStation === 'all' ? t('global_all_stations') : stations.find(s => s._id === selectedStation)?.name}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none min-w-[200px]">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={selectedStation}
                            onChange={(e) => setSelectedStation(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none transition-all"
                        >
                            <option value="all">{t('global_all_stations')}</option>
                            {stations.map(station => (
                                <option key={station._id} value={station._id}>{station.name} - {station.city}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative flex-1 lg:flex-none">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none transition-all"
                        >
                            <option value="day">{t('daily_view')}</option>
                            <option value="month">{t('monthly_view')}</option>
                            <option value="year">{t('yearly_view')}</option>
                        </select>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 text-sm"
                    >
                        <Download size={18} />
                        {t('generate_report')}
                    </button>
                </div>
            </div>

            {/* Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <KPICard
                    title={t('revenue_performance')}
                    value={`${stats?.revenue.toLocaleString()} ETB`}
                    icon={<CreditCard className="text-blue-600" />}
                    trend="+12.5%"
                    trendLabel={t('vs_prev')}
                    up={true}
                    color="bg-blue-50"
                />
                <KPICard
                    title={t('ticket_conversion')}
                    value={stats?.bookings}
                    icon={<CheckCircle className="text-emerald-600" />}
                    trend="+8.2%"
                    trendLabel={t('vs_prev')}
                    up={true}
                    color="bg-emerald-50"
                />
                <KPICard
                    title={t('fleet_capacity')}
                    value={stats?.vehicles}
                    icon={<Bus className="text-orange-600" />}
                    trend="-2.1%"
                    trendLabel={t('vs_prev')}
                    up={false}
                    color="bg-orange-50"
                />
                <KPICard
                    title={t('station_reach')}
                    value={stats?.stations}
                    icon={<MapPin className="text-purple-600" />}
                    trend="+5.4%"
                    trendLabel={t('vs_prev')}
                    up={true}
                    color="bg-purple-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Revenue Intelligence */}
                <div className="bg-white p-7 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 h-full flex items-end">
                        <div className="w-1 bg-blue-100 h-1/2 rounded-full opacity-20"></div>
                    </div>
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{t('revenue_trajectory')}</h2>
                            <p className="text-xs text-gray-400 mt-1 italic">{t('historical_growth_hint')}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <TrendingUp size={24} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="_id"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ dy: 10 }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `ETB ${val > 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '16px', border: 'none', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Allocation Intelligence */}
                <div className="bg-white p-7 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{t('booking_status_allocation')}</h2>
                            <p className="text-xs text-gray-400 mt-1 italic">{t('realtime_health_check')}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <Activity size={24} className="text-emerald-600" />
                        </div>
                    </div>
                    <div className="h-80 flex flex-col md:flex-row items-center">
                        <div className="w-full md:w-2/3 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={bookingStats?.statusDistribution || []}
                                        cx="50%"
                                        cy="55%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="count"
                                        nameKey="_id"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {(bookingStats?.statusDistribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/3 flex flex-col gap-4 pl-4">
                            {bookingStats?.statusDistribution.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-sm font-medium text-gray-600 capitalize">{t(item._id)}</span>
                                    <span className="text-sm font-bold ml-auto">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Regional Performance Logic */}
            {selectedStation === 'all' && (
                <div className="bg-white p-7 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-8">{t('competitive_station_analysis')}</h2>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stationStats} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="5 5" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    width={120}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '16px', border: 'none' }}
                                />
                                <Bar dataKey="totalBookings" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} name={t('total_volume')} />
                                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} name={t('generated_revenue')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detailed Activity Matrix */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
                <div className="p-7 border-b border-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('activity_matrix')}</h2>
                        <p className="text-xs text-gray-400 mt-1">{t('live_transaction_feed')}</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Clock size={14} /> {t('live_updates')}
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#fcfdfe]">
                            <tr>
                                <th className="px-7 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('transaction_id')}</th>
                                <th className="px-7 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('passenger_entity')}</th>
                                <th className="px-7 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('terminal_origin')}</th>
                                <th className="px-7 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('value')}</th>
                                <th className="px-7 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('status')}</th>
                                <th className="px-7 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('timestamp')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentActivity.bookings.length > 0 ? recentActivity.bookings.map((booking, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-7 py-5">
                                        <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md group-hover:bg-blue-100 transition-all font-mono tracking-tighter">
                                            #{booking.bookingNumber}
                                        </span>
                                    </td>
                                    <td className="px-7 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-black uppercase">
                                                {booking.passengerID?.fullName?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{booking.passengerID?.fullName || 'Guest'}</p>
                                                <p className="text-[10px] text-gray-400">{booking.passengerID?.phoneNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-7 py-5">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-300" />
                                            <span className="text-sm font-medium text-gray-600">
                                                {booking.tripID?.origin?.name || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-7 py-5">
                                        <span className="text-sm font-black text-gray-900">{booking.totalPrice} ETB</span>
                                    </td>
                                    <td className="px-7 py-5">
                                        <StatusBadge status={booking.status} t={t} />
                                    </td>
                                    <td className="px-7 py-5">
                                        <p className="text-xs font-medium text-gray-500 uppercase">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-300">{new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-7 py-10 text-center text-gray-400 italic">{t('no_recent_activity_found')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon, trend, trendLabel, up, color }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 flex items-start justify-between relative group hover:-translate-y-1 transition-all duration-300">
        <div className="z-10">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black text-gray-900 mb-2">{value}</h3>
            <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend} <span className="opacity-50 ml-0.5 underline decoration-dotted">{trendLabel}</span>
            </div>
        </div>
        <div className={`${color} p-4 rounded-3xl group-hover:scale-110 transition-all duration-500`}>
            {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
        </div>
    </div>
);

const StatusBadge = ({ status, t }) => {
    const config = {
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
        pending: 'bg-amber-50 text-amber-600 border-amber-100',
        cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
        refunded: 'bg-purple-50 text-purple-600 border-purple-100'
    };

    return (
        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border ${config[status] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
            {t(status)}
        </span>
    );
}

export default Reports;

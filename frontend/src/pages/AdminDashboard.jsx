import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DollarSign, ShoppingBag, AlertTriangle, Users, FileText, Clock, CreditCard, Banknote, ArrowRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const StatCard = ({ title, value, icon: Icon, color, gradient }) => {
    // Check if value is a currency string (contains IQD or other currency)
    const isCurrency = typeof value === 'string' && (value.includes('IQD') || value.includes('USD') || value.includes('EUR'));
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 card-hover group relative overflow-hidden border border-gray-100 dark:border-gray-700 min-h-[150px]">
            {/* Animated gradient background */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-3">
                    <div className={`${gradient} p-3 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0`}>
                        <Icon size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide truncate">{title}</p>
                    </div>
                </div>
                <div className="flex-1 flex items-end min-h-0 pb-1">
                    <p className={`font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent dark:text-gray-200 break-words leading-tight w-full overflow-hidden ${
                        isCurrency 
                            ? 'text-base sm:text-lg lg:text-xl xl:text-2xl' 
                            : 'text-xl sm:text-2xl lg:text-3xl'
                    }`}>
                        {value}
                    </p>
                </div>
            </div>
            
            {/* Decorative corner element */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${gradient} opacity-5 rounded-bl-full`}></div>
        </div>
    );
};

const AdminDashboard = () => {
    const { formatCurrency } = useSettings();
    const { user } = useAuth();
    const { t, language, formatDate, formatTime } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        dailySales: 0,
        totalOrders: 0,
        lowStockCount: 0,
        activeCashiers: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/orders/dashboard-stats', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setLoading(false);
        }
    };

    const fetchRecentOrders = async () => {
        if (!user?.accessToken) {
            setLoadingOrders(false);
            return;
        }
        try {
            const response = await axios.get('http://localhost:5000/api/orders?limit=5', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            // Handle both paginated response and direct array response
            let orders = [];
            if (response.data.orders && Array.isArray(response.data.orders)) {
                // New paginated response format
                orders = response.data.orders;
            } else if (Array.isArray(response.data)) {
                // Old direct array format (fallback)
                orders = response.data;
            }
            setRecentOrders(orders.slice(0, 5));
            setLoadingOrders(false);
        } catch (error) {
            console.error('Error fetching recent orders:', error);
            setRecentOrders([]);
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (user?.accessToken) {
            fetchStats();
            fetchRecentOrders();
            // Refresh stats every 30 seconds
            const interval = setInterval(() => {
                fetchStats();
                fetchRecentOrders();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.accessToken]);

    // Refresh when window gains focus
    useEffect(() => {
        const handleFocus = () => {
            if (user?.accessToken) {
                fetchStats();
                fetchRecentOrders();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user?.accessToken]);

    if (loading) {
        return (
            <div className="p-6 bg-gray-100 dark:bg-gray-900">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{t('dashboard')}</h1>
                <div className="text-center py-10 text-gray-600 dark:text-gray-400">{t('loading')}</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 dark:from-gray-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {t('dashboard')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">{formatDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 auto-rows-fr">
                <StatCard
                    title={t('dailySales')}
                    value={formatCurrency(stats.dailySales)}
                    icon={DollarSign}
                    gradient="gradient-bg-green"
                />
                <StatCard
                    title={t('totalOrders')}
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    gradient="gradient-bg-blue"
                />
                <StatCard
                    title={t('lowStockItems')}
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    gradient="gradient-bg-orange"
                />
                <StatCard
                    title={t('activeCashiers')}
                    value={stats.activeCashiers}
                    icon={Users}
                    gradient="gradient-bg-purple"
                />
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 card-hover">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            <FileText className="text-white" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('recentActivity')}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('live')}</span>
                    </div>
                </div>
                
                {loadingOrders ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-400 dark:text-gray-500 mt-4">{t('loadingRecentOrders')}</p>
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-block p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl mb-4">
                            <FileText className="text-blue-500 dark:text-blue-400" size={48} />
                        </div>
                        <p className="text-gray-400 dark:text-gray-500 font-medium">{t('noRecentOrders')}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('ordersWillAppearHere')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.filter(order => order && order.id).map((order) => (
                            <div 
                                key={order.id} 
                                onClick={() => navigate('/orders')}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-700 dark:to-blue-900/30 rounded-xl border border-gray-100 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50/30 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-all duration-200 group cursor-pointer active:scale-[0.98]"
                                title={t('clickToViewDetails')}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-3 rounded-xl ${
                                        order.paymentMethod === 'CASH' 
                                            ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    }`}>
                                        {order.paymentMethod === 'CASH' ? (
                                            <Banknote className="text-white" size={20} />
                                        ) : (
                                            <CreditCard className="text-white" size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                                                {t('orderNumber')} {String(order.id).slice(-8).toUpperCase()}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                order.status === 'COMPLETED' 
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                                    : order.status === 'REFUNDED'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                    : order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                            }`}>
                                                {order.status === 'COMPLETED' 
                                                    ? t('completed') || 'Completed'
                                                    : order.status === 'REFUNDED'
                                                    ? t('fullyRefunded') || 'Fully Refunded'
                                                    : order.status === 'PARTIALLY_REFUNDED'
                                                    ? t('partiallyRefunded') || 'Partially Refunded'
                                                    : order.status || t('pending') || 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>
                                                    {order.createdAt ? (() => {
                                                        const date = new Date(order.createdAt);
                                                        if (isNaN(date.getTime())) return t('dateNotAvailable') || 'Date not available';
                                                        return `${formatDate(date)} • ${formatTime(date)}`;
                                                    })() : (
                                                        t('dateNotAvailable') || 'Date not available'
                                                    )}
                                                </span>
                                            </div>
                                            {order.user && order.user.name && (
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {t('cashierLabel')}: {order.user.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                            {formatCurrency(order.totalAmount || 0)}
                                        </p>
                                        {order.discount && parseFloat(order.discount) > 0 && (
                                            <p className="text-xs text-red-600 dark:text-red-400">
                                                -{formatCurrency(order.discount)} {t('discountLabel')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                        <ArrowRight className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

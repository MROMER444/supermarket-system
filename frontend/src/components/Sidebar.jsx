import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, FileText, Settings, LogOut, RotateCcw, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const isRTL = language === 'ar';

    // Define all menu items with role restrictions
    const allMenuItems = [
        { path: '/', icon: LayoutDashboard, label: t('dashboard'), roles: ['ADMIN', 'CASHIER'] },
        { path: '/inventory', icon: Package, label: t('inventory'), roles: ['ADMIN'] },
        { path: '/categories', icon: Package, label: t('categories'), roles: ['ADMIN'] },
        { path: '/suppliers', icon: Users, label: t('suppliers'), roles: ['ADMIN'] },
        { path: '/pos', icon: ShoppingCart, label: t('pos'), roles: ['ADMIN', 'CASHIER'] },
        { path: '/orders', icon: FileText, label: t('orders'), roles: ['ADMIN', 'CASHIER'] },
        { path: '/refunded', icon: RotateCcw, label: t('refunded') || 'Refunded', roles: ['ADMIN', 'CASHIER'] },
        { path: '/reports', icon: FileText, label: t('reports'), roles: ['ADMIN', 'CASHIER'] },
        { path: '/users', icon: UserPlus, label: t('userManagement'), roles: ['ADMIN'] },
        { path: '/settings', icon: Settings, label: t('settings'), roles: ['ADMIN'] },
    ];

    // Filter menu items based on user role
    const menuItems = allMenuItems.filter(item => 
        !item.roles || item.roles.includes(user?.role)
    );

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white w-64 h-screen flex flex-col shadow-2xl fixed top-0 overflow-hidden z-30 ${isRTL ? 'right-0' : 'left-0'}`}>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 pointer-events-none"></div>
            
            <div className="relative z-10 p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                        <ShoppingCart size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                            {settings?.storeName || 'SuperMarket'}
                        </h1>
                        <p className="text-xs text-gray-400">Management System</p>
                    </div>
                </div>
            </div>
            
            <nav className="relative z-10 flex-1 p-4 space-y-1">
                {menuItems.map((item, index) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                            isActive(item.path) 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/50 transform scale-105' 
                                : `hover:bg-gray-700/50 ${isRTL ? 'hover:-translate-x-1' : 'hover:translate-x-1'}`
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {isActive(item.path) && (
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        )}
                        <item.icon 
                            size={20} 
                            className={`relative z-10 transition-transform ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}
                        />
                        <span className={`relative z-10 font-medium ${isActive(item.path) ? 'font-bold' : ''}`}>
                            {item.label}
                        </span>
                        {isActive(item.path) && (
                            <div className={`absolute w-1 h-6 bg-white rounded-full ${isRTL ? 'left-2' : 'right-2'}`}></div>
                        )}
                    </Link>
                ))}
            </nav>
            
            <div className="relative z-10 p-4 border-t border-gray-700/50">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 p-3 w-full rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 group"
                >
                    <LogOut size={20} className="text-red-400 group-hover:rotate-12 transition-transform" />
                    <span className="font-medium text-red-300">{t('logout')}</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

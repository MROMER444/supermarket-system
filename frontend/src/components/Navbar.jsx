import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Globe, Clock, Calendar, Moon, Sun } from 'lucide-react';

const Navbar = () => {
    const { user } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const isRTL = language === 'ar';
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            setCurrentDate(now);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center fixed top-0 z-40 ${isRTL ? 'right-64 left-0' : 'left-64 right-0'}`}>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-xl">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span>{t('welcome')},</span>
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {user?.name}
                        </span>
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Clock size={14} className="text-blue-500" />
                            <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                                {formatTime(currentTime)}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Calendar size={14} className="text-purple-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                {formatDate(currentDate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-gray-200 dark:border-gray-600"
                    title={darkMode ? t('switchToLightMode') : t('switchToDarkMode')}
                >
                    {darkMode ? (
                        <>
                            <Sun size={18} className="text-yellow-500" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{t('lightMode')}</span>
                        </>
                    ) : (
                        <>
                            <Moon size={18} className="text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{t('darkMode')}</span>
                        </>
                    )}
                </button>
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700"
                    title={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
                >
                    <Globe size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{language === 'ar' ? 'EN' : 'AR'}</span>
                </button>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>{user?.role}</span>
                </div>
            </div>
        </div>
    );
};

export default Navbar;

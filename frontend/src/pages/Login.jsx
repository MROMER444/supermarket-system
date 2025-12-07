import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Globe, Moon, Sun } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useLanguage();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const isRTL = language === 'ar';

    const translateError = (errorMessage) => {
        if (!errorMessage) return '';
        
        // Map backend error messages to translation keys
        const errorMap = {
            'Invalid password': t('invalidPassword'),
            'User not found': t('userNotFound'),
            'Login failed': t('loginFailed'),
        };
        
        // Check if we have a translation for this error
        for (const [key, translation] of Object.entries(errorMap)) {
            if (errorMessage.includes(key) || errorMessage === key) {
                return translation;
            }
        }
        
        // If no translation found, return original message
        return errorMessage;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(translateError(result.message));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            <div className="relative z-10 bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700/50 animate-fade-in">
                {/* Language and Dark Mode Toggle Buttons */}
                <div className={`absolute top-4 flex gap-2 ${isRTL ? 'left-4' : 'right-4'}`}>
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-gray-200 dark:border-gray-600"
                        title={darkMode ? t('switchToLightMode') : t('switchToDarkMode')}
                    >
                        {darkMode ? (
                            <Sun size={18} className="text-yellow-500" />
                        ) : (
                            <Moon size={18} className="text-blue-600" />
                        )}
                    </button>
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700"
                        title={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
                    >
                        <Globe size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{language === 'ar' ? 'EN' : 'AR'}</span>
                    </button>
                </div>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-white mb-2">
                        {t('login')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-300 text-sm">{t('welcomeBack')}</p>
                </div>
                
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6 animate-fade-in">
                        <p className="font-medium">{error}</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">{t('email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            required
                            dir="ltr"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">{t('password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            required
                            dir="ltr"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 btn-modern"
                    >
                        {t('loginButton')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

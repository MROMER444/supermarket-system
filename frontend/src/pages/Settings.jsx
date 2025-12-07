import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Store, MapPin, DollarSign, Printer, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
    const [settings, setSettings] = useState({
        storeName: '',
        address: '',
        currency: 'IQD',
        printerIp: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const { user } = useAuth();
    const { refreshSettings } = useSettings();
    const { t } = useLanguage();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/settings', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setSettings(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        try {
            await axios.put('http://localhost:5000/api/settings', settings, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            await refreshSettings();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert(t('failedToSaveSettings'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">{t('loadingSettings')}</p>
                </div>
            </div>
        );
    }

    const currencyOptions = ['IQD', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

    return (
        <div className="p-6 max-w-5xl mx-auto bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                    {t('settings') || 'Settings'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{t('manageStoreConfig')}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Store Information Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                <Store className="text-white" size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('storeInformation')}</h2>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('storeName')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="storeName"
                                        value={settings.storeName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder={t('enterStoreName')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('address')}
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                                    <textarea
                                        name="address"
                                        value={settings.address || ''}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder={t('enterStoreAddress')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Settings Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                                <DollarSign className="text-white" size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('financialSettings')}</h2>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('currency')}
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                                    <select
                                        name="currency"
                                        value={settings.currency}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
                                    >
                                        {currencyOptions.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('selectStoreCurrency')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Printer Settings Card */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                                <Printer className="text-white" size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('printerSettings')}</h2>
                        </div>
                        
                        <div className="max-w-2xl">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('thermalPrinterIpAddress')}
                                </label>
                                <div className="relative">
                                    <Printer className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        name="printerIp"
                                        value={settings.printerIp || ''}
                                        onChange={handleChange}
                                        placeholder="192.168.1.100"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('enterPrinterIp')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex items-center justify-between">
                    {success && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-fade-in">
                            <CheckCircle2 size={20} />
                            <span className="font-medium">{t('settingsSavedSuccessfully')}</span>
                        </div>
                    )}
                    <div className="ml-auto">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>{t('saving')}</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>{t('saveSettings')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Settings;

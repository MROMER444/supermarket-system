import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        currency: 'IQD',
        storeName: '',
        address: '',
    });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchSettings();
        } else {
            // Reset to default when user logs out
            setSettings({
                currency: 'IQD',
                storeName: '',
                address: '',
            });
        }
    }, [user]);

    const fetchSettings = async () => {
        if (!user?.accessToken) {
            setLoading(false);
            return;
        }
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

    const formatCurrency = (amount) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '0 IQD';
        
        // Use the currency from settings, default to IQD if not set
        const currency = settings?.currency || 'IQD';
        
        // Format number with comma separators for thousands
        // For IQD, use no decimal places (or 0 decimals) as per Iraqi standard
        if (currency === 'IQD') {
            // Round to nearest integer for IQD
            const roundedAmount = Math.round(numAmount);
            // Format with commas for thousands
            const formatted = roundedAmount.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            return `${formatted} IQD`;
        }
        
        // For other currencies, use 2 decimal places with comma separators
        const formatted = numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${currency} ${formatted}`;
    };

    const value = {
        settings,
        setSettings,
        formatCurrency,
        loading,
        refreshSettings: fetchSettings,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

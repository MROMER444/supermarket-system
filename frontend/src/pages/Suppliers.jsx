import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Users, Loader2, Building2, Phone, MapPin, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [formData, setFormData] = useState({ name: '', contactInfo: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/suppliers', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setSuppliers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${user.accessToken}` } };
            if (currentSupplier) {
                await axios.put(`http://localhost:5000/api/suppliers/${currentSupplier.id}`, formData, config);
            } else {
                await axios.post('http://localhost:5000/api/suppliers', formData, config);
            }
            setSuccess(true);
            setTimeout(() => {
                setIsModalOpen(false);
                fetchSuppliers();
                resetForm();
                setSuccess(false);
            }, 1000);
        } catch (error) {
            console.error('Error saving supplier:', error);
            setError(error.response?.data?.message || 'Failed to save supplier');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('deleteSupplierConfirm'))) {
            try {
                await axios.delete(`http://localhost:5000/api/suppliers/${id}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                });
                fetchSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
            }
        }
    };

    const openModal = (supplier = null) => {
        if (supplier) {
            setCurrentSupplier(supplier);
            setFormData({ name: supplier.name, contactInfo: supplier.contactInfo || '', address: supplier.address || '' });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setCurrentSupplier(null);
        setFormData({ name: '', contactInfo: '', address: '' });
        setError('');
        setSuccess(false);
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">{t('loading')} {t('suppliers').toLowerCase()}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                            {t('suppliers') || 'Suppliers'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('manageSuppliers')}</p>
                    </div>
                    <button 
                        onClick={() => openModal()} 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>{t('addSupplier')}</span>
                    </button>
                </div>

                {/* Statistics Card */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-xl">
                                <Users size={32} />
                            </div>
                            <div>
                                <p className="text-green-100 text-sm font-medium mb-1">{t('totalSuppliers')}</p>
                                <p className="text-4xl font-bold">{suppliers.length}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-green-100 text-sm font-medium mb-1">{t('active')}</p>
                            <p className="text-2xl font-bold">{suppliers.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suppliers Grid */}
            {suppliers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <div className="inline-block p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl mb-4">
                        <Users className="text-green-500 dark:text-green-400" size={64} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('noSuppliersYet')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t('getStartedAddSupplier')}</p>
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                    >
                        <Plus size={20} />
                        <span>{t('addSupplier')}</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map((supplier) => (
                        <div 
                            key={supplier.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                        >
                            {/* Decorative gradient overlay */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-600/10 dark:from-green-500/20 dark:to-emerald-600/20 rounded-bl-full"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg flex-shrink-0">
                                            <Building2 className="text-white" size={24} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate">
                                                {supplier.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => openModal(supplier)} 
                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title={t('editSupplier')}
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(supplier.id)} 
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title={t('deleteSupplier')}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mt-4">
                                    {supplier.contactInfo && (
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                                            <Phone size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('contact')}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium break-words">
                                                    {supplier.contactInfo}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {supplier.address && (
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                                            <MapPin size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('address')}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                                    {supplier.address}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!supplier.contactInfo && !supplier.address && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 border-dashed">
                                            <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center">{t('noContactInformation')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }} 
                title={currentSupplier ? t('editSupplierTitle') : t('addNewSupplier')}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {success && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">{t('supplierSavedSuccessfully')}</span>
                        </div>
                    )}
                    
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                            <span className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('supplierName')}
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value });
                                    setError('');
                                }} 
                                required 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('supplierExample')}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('contactInformationOptional')}
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="text" 
                                value={formData.contactInfo} 
                                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })} 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('contactPlaceholder')}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('addressOptional')}
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <textarea 
                                value={formData.address} 
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                                rows="3"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('supplierAddressPlaceholder')}
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>{t('saving')}</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>{currentSupplier ? t('updateSupplier') : t('createSupplier')}</span>
                            </>
                        )}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Suppliers;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Package, Loader2, Tag, FileText, Save, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const { user } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/categories', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setCategories(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
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
            if (currentCategory) {
                await axios.put(`http://localhost:5000/api/categories/${currentCategory.id}`, formData, config);
            } else {
                await axios.post('http://localhost:5000/api/categories', formData, config);
            }
            setSuccess(true);
            setTimeout(() => {
                setIsModalOpen(false);
                fetchCategories();
                resetForm();
                setSuccess(false);
            }, 1000);
        } catch (error) {
            console.error('Error saving category:', error);
            setError(error.response?.data?.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id) => {
        const category = categories.find(c => c.id === id);
        setCategoryToDelete(category);
        setIsConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;
        
        setDeleting(true);
        try {
            const response = await axios.delete(`http://localhost:5000/api/categories/${categoryToDelete.id}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            
            // Show success message
            const message = response.data?.message || t('categoryDeletedSuccessfully');
            setDeleteSuccess(message);
            
            // Close confirmation modal
            setIsConfirmOpen(false);
            setCategoryToDelete(null);
            
            // Refresh categories list
            fetchCategories();
            
            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setDeleteSuccess('');
            }, 5000);
        } catch (error) {
            console.error('Error deleting category:', error);
            setError(error.response?.data?.message || t('failedToDeleteCategory'));
            setIsConfirmOpen(false);
            setCategoryToDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsConfirmOpen(false);
        setCategoryToDelete(null);
    };

    const openModal = (category = null) => {
        if (category) {
            setCurrentCategory(category);
            setFormData({ name: category.name, description: category.description || '' });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setCurrentCategory(null);
        setFormData({ name: '', description: '' });
        setError('');
        setSuccess(false);
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">{t('loading')} {t('categories').toLowerCase()}...</p>
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
                            {t('categories') || 'Categories'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('organizeProducts')}</p>
                    </div>
                    <button 
                        onClick={() => openModal()} 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>{t('addCategory')}</span>
                    </button>
                </div>

                {/* Statistics Card */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-xl">
                                <Package size={32} />
                            </div>
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">{t('totalCategories')}</p>
                                <p className="text-4xl font-bold">{categories.length}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-100 text-sm font-medium mb-1">{t('active')}</p>
                            <p className="text-2xl font-bold">{categories.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            {categories.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <div className="inline-block p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl mb-4">
                        <Package className="text-blue-500 dark:text-blue-400" size={64} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('noCategoriesYet')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t('getStartedCreateCategory')}</p>
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                    >
                        <Plus size={20} />
                        <span>{t('addCategory')}</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <div 
                            key={category.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                        >
                            {/* Decorative gradient overlay */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-600/20 rounded-bl-full"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                                            <Tag className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {category.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => openModal(category)} 
                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title={t('editCategory')}
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(category.id)} 
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title={t('deleteCategory')}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                {category.description && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                                        <div className="flex items-start gap-2">
                                            <FileText size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {!category.description && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 border-dashed">
                                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t('noDescription')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Success Popup */}
            {deleteSuccess && (
                <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[300px] max-w-md">
                        <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" size={24} />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                {t('success')}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {deleteSuccess}
                            </p>
                        </div>
                        <button
                            onClick={() => setDeleteSuccess('')}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal 
                isOpen={isConfirmOpen} 
                onClose={handleDeleteCancel}
                title={t('confirmDelete')}
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
                                {t('deleteCategoryConfirm')}
                            </p>
                            {categoryToDelete && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong className="font-semibold text-gray-800 dark:text-gray-200">
                                        {categoryToDelete.name}
                                    </strong>
                                </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {t('deleteCategoryWarning') || 'Products in this category will be moved to "Uncategorized".'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleDeleteCancel}
                            disabled={deleting}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>{t('deleting')}</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    <span>{t('delete')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }} 
                title={currentCategory ? t('editCategoryTitle') : t('addNewCategory')}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {success && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">{t('categorySavedSuccessfully')}</span>
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
                            {t('categoryName')}
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value });
                                    setError('');
                                }} 
                                required 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('categoryExamples')}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('descriptionOptional')}
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <textarea 
                                value={formData.description} 
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                rows="4"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('addDescriptionPlaceholder')}
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>{t('saving')}</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>{currentCategory ? t('updateCategory') : t('createCategory')}</span>
                            </>
                        )}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Categories;

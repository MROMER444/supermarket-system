import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, TrendingUp, Loader2, X, Hash, DollarSign, Box, Calendar, User, Save, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const { user } = useAuth();
    const { formatCurrency } = useSettings();
    const { t } = useLanguage();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        categoryId: '',
        price: '',
        costPrice: '',
        quantity: '',
        minQuantity: 10,
        supplierId: '',
        expiryDate: '',
    });
    const [barcodeError, setBarcodeError] = useState('');
    const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);

    useEffect(() => {
        // Reset to page 1 when search changes
        if (search !== '') {
            setPagination(prev => ({ ...prev, page: 1 }));
        }
    }, [search]);

    useEffect(() => {
        fetchProducts();
    }, [search, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchCategories();
        fetchSuppliers();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:5000/api/products?search=${search}&page=${pagination.page}&limit=${pagination.limit}`,
                {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                }
            );
            
            // Handle both old format (array) and new format (object with products and pagination)
            if (Array.isArray(response.data)) {
                setProducts(response.data);
                setPagination(prev => ({ ...prev, total: response.data.length, totalPages: 1 }));
            } else {
                setProducts(response.data.products || []);
                setPagination(response.data.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/categories', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/suppliers', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setSuppliers(response.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear barcode error when user types
        if (name === 'barcode') {
            setBarcodeError('');
        }
    };

    const generateBarcode = () => {
        setIsGeneratingBarcode(true);
        // Generate a temporary barcode (server will generate final one if empty)
        const tempBarcode = `PRD${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData({ ...formData, barcode: tempBarcode });
        setIsGeneratingBarcode(false);
        setBarcodeError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBarcodeError('');
        
        try {
            const config = { headers: { Authorization: `Bearer ${user.accessToken}` } };
            
            // Prepare data - send barcode if provided, otherwise let server auto-generate
            const submitData = { ...formData };
            
            // For new products: if barcode is empty, send empty string (server will auto-generate)
            // If barcode has value, send it (server will validate uniqueness)
            // For editing: always send barcode (read-only, but included for completeness)
            
            if (currentProduct) {
                await axios.put(`http://localhost:5000/api/products/${currentProduct.id}`, submitData, config);
            } else {
                // For new products, send empty string if barcode is empty (server auto-generates)
                // Or send the barcode if user provided one
                await axios.post('http://localhost:5000/api/products', submitData, config);
            }
            setIsModalOpen(false);
            fetchProducts();
            resetForm();
        } catch (error) {
            console.error('Error saving product:', error);
            const errorMessage = error.response?.data?.message || t('failedToSaveProduct') || 'Failed to save product';
            
            // Check if it's a barcode-related error
            if (errorMessage.includes('Barcode') || errorMessage.includes('barcode')) {
                setBarcodeError(errorMessage);
            } else {
                alert(errorMessage);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('areYouSureDelete'))) {
            try {
                await axios.delete(`http://localhost:5000/api/products/${id}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                });
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert(t('failedToDeleteProduct'));
            }
        }
    };

    // Calculate statistics (using current page products)
    const totalProducts = pagination.total || products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    const profit = totalValue - totalCost;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                name: product.name,
                barcode: product.barcode,
                categoryId: product.categoryId,
                price: product.price,
                costPrice: product.costPrice,
                quantity: product.quantity,
                minQuantity: product.minQuantity,
                supplierId: product.supplierId || '',
                expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setCurrentProduct(null);
        setBarcodeError('');
        setIsGeneratingBarcode(false);
        setFormData({
            name: '',
            barcode: '', // Optional - will be auto-generated by server if empty
            categoryId: '',
            price: '',
            costPrice: '',
            quantity: '',
            minQuantity: 10,
            supplierId: '',
            expiryDate: '',
        });
    };

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                            {t('inventory') || 'Inventory Management'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('manageProducts')}</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>{t('addProduct')}</span>
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Package size={24} />
                            </div>
                            <span className="text-3xl font-bold">{totalProducts}</span>
                        </div>
                        <p className="text-blue-100 text-sm font-medium">{t('totalProducts')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <AlertTriangle size={24} />
                            </div>
                            <span className="text-3xl font-bold">{lowStockProducts}</span>
                        </div>
                        <p className="text-red-100 text-sm font-medium">{t('lowStockItemsLabel')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-2xl font-bold">{formatCurrency(totalValue)}</span>
                        </div>
                        <p className="text-green-100 text-sm font-medium">{t('salesPotential')}</p>
                        <p className="text-green-200 text-xs mt-1">{t('sellingPriceStock')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-2xl font-bold">{formatCurrency(profit)}</span>
                        </div>
                        <p className="text-purple-100 text-sm font-medium">{t('potentialProfit')}</p>
                        <p className="text-purple-200 text-xs mt-1">{t('salesCost')}</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('searchProductsPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={48} />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('noProductsFound')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('getStartedAddProduct')}</p>
                        <button
                            onClick={() => openModal()}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                        >
                            <Plus size={20} />
                            <span>{t('addProduct')}</span>
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('product')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('barcode')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('category')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('price')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('stock')}</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {product.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</div>
                                                    {product.supplier && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <User size={12} />
                                                            {product.supplier.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                <Hash size={16} className="text-gray-400 dark:text-gray-500" />
                                                <span className="font-mono text-sm">{product.barcode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
                                                {product.category?.name || t('uncategorized')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(product.price)}</div>
                                            {product.costPrice > 0 && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('cost')}: {formatCurrency(product.costPrice)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Box size={16} className={product.quantity <= product.minQuantity ? 'text-red-500' : 'text-green-500'} />
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    product.quantity <= product.minQuantity 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : product.quantity <= product.minQuantity * 2
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {product.quantity} / {product.minQuantity} {t('min')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openModal(product)} 
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title={t('editProductTitle')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product.id)} 
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title={t('deleteProductTitle')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">
                            {t('showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('to')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total} {t('product')}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* First Page */}
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:bg-transparent transition-all"
                            title="First page"
                        >
                            <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Previous Page */}
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:bg-transparent transition-all"
                            title="Previous page"
                        >
                            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                            pagination.page === pageNum
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white shadow-lg scale-105'
                                                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Page */}
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:bg-transparent transition-all"
                            title="Next page"
                        >
                            <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Last Page */}
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.page === pagination.totalPages}
                            className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:bg-transparent transition-all"
                            title="Last page"
                        >
                            <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Items per page selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('itemsPerPage')}:</span>
                        <select
                            value={pagination.limit}
                            onChange={(e) => {
                                setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
                            }}
                            className="px-3 py-1.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentProduct ? t('editProductTitle') : t('addNewProduct')}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Product Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('productName')}</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleInputChange} 
                            required 
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder={t('enterProductName')}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('category')}</label>
                        <select 
                            name="categoryId" 
                            value={formData.categoryId} 
                            onChange={handleInputChange} 
                            required 
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
                        >
                            <option value="">{t('selectCategory')}</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Barcode */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                {t('barcode')}
                            </label>
                            {!currentProduct && (
                                <button
                                    type="button"
                                    onClick={generateBarcode}
                                    disabled={isGeneratingBarcode}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium border-2 border-blue-200 dark:border-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1"
                                >
                                    {isGeneratingBarcode ? (
                                        <>
                                            <Loader2 className="animate-spin" size={12} />
                                            {t('generating')}...
                                        </>
                                    ) : (
                                        <>
                                            <Hash size={12} />
                                            {t('autoGenerate')}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Hash className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                name="barcode" 
                                value={formData.barcode} 
                                onChange={handleInputChange}
                                placeholder={currentProduct ? t('barcode') : t('scanOrEnterBarcode')}
                                className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                                    currentProduct 
                                        ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-300' 
                                        : 'bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 text-gray-900 dark:text-gray-100'
                                } ${
                                    barcodeError ? 'border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-800' : 'border-gray-200 dark:border-gray-700'
                                }`}
                                readOnly={!!currentProduct}
                            />
                            {!currentProduct && formData.barcode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, barcode: '' });
                                        setBarcodeError('');
                                    }}
                                    className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                        {barcodeError && (
                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                                <span>{barcodeError}</span>
                            </div>
                        )}
                        {!currentProduct && !barcodeError && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                💡 {t('barcodeHint')}
                            </p>
                        )}
                    </div>

                    {/* Price and Cost Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('sellingPrice')}</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    name="price" 
                                    value={formData.price} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('costPrice')}</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    name="costPrice" 
                                    value={formData.costPrice} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quantity and Min Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('currentStock')}</label>
                            <div className="relative">
                                <Box className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                                <input 
                                    type="number" 
                                    name="quantity" 
                                    value={formData.quantity} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('minStockLevel')}</label>
                            <div className="relative">
                                <AlertTriangle className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                                <input 
                                    type="number" 
                                    name="minQuantity" 
                                    value={formData.minQuantity} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('supplier')}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <select 
                                name="supplierId" 
                                value={formData.supplierId} 
                                onChange={handleInputChange} 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
                            >
                                <option value="">{t('selectSupplierOptional')}</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('expiryDate')}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="date" 
                                name="expiryDate" 
                                value={formData.expiryDate} 
                                onChange={handleInputChange} 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        <span>{currentProduct ? t('updateProduct') : t('addProduct')}</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;

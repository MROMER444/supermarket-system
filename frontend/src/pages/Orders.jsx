import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, FileText, Filter, X, DollarSign, ShoppingBag, Clock, User, Loader2, CreditCard, Banknote, Calendar, Package, TrendingUp, CheckCircle2, RotateCcw, Plus, Minus, ChevronLeft, ChevronRight, Search, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [cashiers, setCashiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isConfirmRefundModalOpen, setIsConfirmRefundModalOpen] = useState(false);
    const [refundItems, setRefundItems] = useState([]);
    const [refundReason, setRefundReason] = useState('');
    const [processingRefund, setProcessingRefund] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [selectedCashierId, setSelectedCashierId] = useState('');
    const [searchOrderId, setSearchOrderId] = useState('');
    const [searchInputValue, setSearchInputValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const searchTimeoutRef = useRef(null);
    const { user } = useAuth();
    const { formatCurrency } = useSettings();
    const { t } = useLanguage();

    useEffect(() => {
        // Fetch all orders once to get unique cashiers (with large limit)
        fetchCashiers();
        fetchAllOrders();
    }, []);

    // Debounce search input
    useEffect(() => {
        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout to update searchOrderId after user stops typing
        searchTimeoutRef.current = setTimeout(() => {
            setSearchOrderId(searchInputValue);
            setCurrentPage(1); // Reset to first page when search changes
        }, 500); // 500ms delay

        // Cleanup timeout on unmount
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchInputValue]);

    useEffect(() => {
        if (selectedCashierId) {
            fetchOrders();
        } else {
            fetchAllOrders();
        }
    }, [selectedCashierId, searchOrderId, currentPage, pageSize]);

    const fetchCashiers = async () => {
        try {
            // Fetch a large number of orders just to get unique cashiers
            const response = await axios.get('http://localhost:5000/api/orders?limit=1000', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            
            const ordersData = response.data.orders || response.data;
            const cashiersMap = new Map();
            ordersData.forEach(order => {
                if (order.user && order.user.id) {
                    cashiersMap.set(order.user.id, {
                        id: order.user.id,
                        name: order.user.name,
                        email: order.user.email
                    });
                }
            });
            setCashiers(Array.from(cashiersMap.values()));
        } catch (error) {
            console.error('Error fetching cashiers:', error);
        }
    };

    const fetchAllOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', pageSize);
            
            if (searchOrderId) {
                params.append('orderId', searchOrderId);
            }
            
            const response = await axios.get(`http://localhost:5000/api/orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            
            if (response.data.orders) {
                // New paginated response
                setOrders(response.data.orders);
                setTotalPages(response.data.pagination.totalPages);
                setTotalCount(response.data.pagination.totalCount);
                // Store totals from backend if available
                if (response.data.totalSales !== undefined) {
                    setAllOrders(response.data); // Store response data for totals
                }
            } else {
                // Fallback for old response format
                setOrders(response.data);
                setAllOrders(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('cashierId', selectedCashierId);
            params.append('page', currentPage);
            params.append('limit', pageSize);
            
            if (searchOrderId) {
                params.append('orderId', searchOrderId);
            }
            
            const url = `http://localhost:5000/api/orders?${params.toString()}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            
            if (response.data.orders) {
                // New paginated response
                setOrders(response.data.orders);
                setTotalPages(response.data.pagination.totalPages);
                setTotalCount(response.data.pagination.totalCount);
                // Store totals from backend if available
                if (response.data.totalSales !== undefined) {
                    setAllOrders(response.data); // Store response data for totals
                }
            } else {
                // Fallback for old response format
                setOrders(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    // Get unique cashiers from cached cashiers list
    const getUniqueCashiers = () => {
        if (cashiers.length > 0) {
            return cashiers.sort((a, b) => a.name.localeCompare(b.name));
        }
        // Fallback: get from current orders
        const cashiersMap = new Map();
        orders.forEach(order => {
            if (order.user && order.user.id) {
                cashiersMap.set(order.user.id, {
                    id: order.user.id,
                    name: order.user.name,
                    email: order.user.email
                });
            }
        });
        return Array.from(cashiersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    };

    const uniqueCashiers = getUniqueCashiers();

    const handleCashierFilterChange = (e) => {
        setSelectedCashierId(e.target.value);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const clearCashierFilter = () => {
        setSelectedCashierId('');
        setCurrentPage(1); // Reset to first page when filter clears
    };

    const handleSearchChange = (e) => {
        setSearchInputValue(e.target.value);
        // Don't update searchOrderId immediately - let debounce handle it
    };

    const handleSearchKeyPress = (e) => {
        // If user presses Enter, search immediately
        if (e.key === 'Enter') {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            setSearchOrderId(searchInputValue);
            setCurrentPage(1);
        }
    };

    const clearSearch = () => {
        setSearchInputValue('');
        setSearchOrderId('');
        setCurrentPage(1); // Reset to first page when search clears
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
        setCurrentPage(1); // Reset to first page when page size changes
    };

    // Calculate total sales for selected cashier (net sales after refunds)
    const calculateCashierTotalSales = () => {
        return orders.reduce((total, order) => {
            // Skip fully refunded orders
            if (order.status === 'REFUNDED') {
                return total;
            }
            const orderAmount = parseFloat(order.totalAmount || 0);
            const refundedAmount = order.totalRefunded ? parseFloat(order.totalRefunded) : 0;
            return total + (orderAmount - refundedAmount);
        }, 0);
    };

    // Get selected cashier name
    const getSelectedCashierName = () => {
        if (!selectedCashierId) return null;
        const cashier = uniqueCashiers.find(c => c.id.toString() === selectedCashierId.toString());
        return cashier ? cashier.name : null;
    };

    const cashierTotalSales = calculateCashierTotalSales();
    const selectedCashierName = getSelectedCashierName();

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleOpenRefundModal = (order) => {
        setSelectedOrder(order);
        // Initialize refund items with quantities set to 0
        // Use availableQuantity (original - already refunded) as maxQuantity
        setRefundItems(order.items.map(item => {
            const availableQuantity = item.availableQuantity !== undefined 
                ? item.availableQuantity 
                : (item.quantity - (item.refundedQuantity || 0));
            const refundedQuantity = item.refundedQuantity || 0;
            
            return {
                orderItemId: item.id,
                productId: item.productId,
                productName: item.product?.name || item.Product?.name || t('unknownProduct'),
                maxQuantity: item.quantity, // Original quantity
                availableQuantity: availableQuantity, // Available to refund
                refundedQuantity: refundedQuantity, // Already refunded
                quantity: 0,
                price: item.price,
            };
        }));
        setRefundReason('');
        setIsRefundModalOpen(true);
    };

    const updateRefundQuantity = (index, change) => {
        const newRefundItems = [...refundItems];
        const item = newRefundItems[index];
        // Use availableQuantity as the maximum (not maxQuantity which is the original)
        const maxAllowed = item.availableQuantity || 0;
        const newQuantity = Math.max(0, Math.min(maxAllowed, item.quantity + change));
        newRefundItems[index].quantity = newQuantity;
        setRefundItems(newRefundItems);
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 5000);
    };

    const handleProcessRefund = () => {
        const itemsToRefund = refundItems.filter(item => item.quantity > 0);
        
        if (itemsToRefund.length === 0) {
            showNotification(t('selectItemsToRefund') || 'Please select items to refund', 'error');
            return;
        }

        // Show confirmation modal instead of window.confirm
        setIsConfirmRefundModalOpen(true);
    };

    const confirmAndProcessRefund = async () => {
        const itemsToRefund = refundItems.filter(item => item.quantity > 0);
        
        try {
            setProcessingRefund(true);
            setIsConfirmRefundModalOpen(false);
            
            const response = await axios.post(
                'http://localhost:5000/api/refunds',
                {
                    orderId: selectedOrder.id,
                    items: itemsToRefund.map(item => ({
                        orderItemId: item.orderItemId,
                        quantity: item.quantity,
                    })),
                    reason: refundReason || null,
                },
                {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                }
            );

            showNotification(t('refundProcessed') || 'Refund processed successfully!', 'success');
            setIsRefundModalOpen(false);
            setIsModalOpen(false);
            fetchAllOrders(); // Refresh orders list
        } catch (error) {
            console.error('Error processing refund:', error);
            showNotification(error.response?.data?.message || t('refundFailed') || 'Failed to process refund', 'error');
        } finally {
            setProcessingRefund(false);
        }
    };

    const handlePrintReceipt = async () => {
        if (!selectedOrder || isPrinting) return; // Prevent multiple clicks

        try {
            setIsPrinting(true);
            const response = await axios.post(
                `http://localhost:5000/api/print/receipt/${selectedOrder.id}`,
                {},
                {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                }
            );

            showNotification(t('receiptPrinted') || 'Receipt printed successfully!', 'success');
        } catch (error) {
            console.error('Error printing receipt:', error);
            const errorMessage = error.response?.data?.message || t('printFailed') || 'Failed to print receipt';
            showNotification(errorMessage, 'error');
        } finally {
            setIsPrinting(false);
        }
    };

    if (loading && orders.length === 0) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                    <p className="text-gray-600">{t('loadingOrders')}</p>
                </div>
            </div>
        );
    }

    // Use totals from backend if available (for all orders, not just paginated)
    // Otherwise fallback to calculating from current page orders
    const totalOrders = allOrders?.totalOrders !== undefined 
        ? allOrders.totalOrders 
        : orders.filter(order => order.status !== 'REFUNDED').length;
    
    const totalSales = allOrders?.totalSales !== undefined 
        ? allOrders.totalSales 
        : orders.reduce((sum, order) => {
            if (order.status === 'REFUNDED') return sum;
            const orderAmount = parseFloat(order.totalAmount || 0);
            const refundedAmount = order.totalRefunded ? parseFloat(order.totalRefunded) : 0;
            return sum + (orderAmount - refundedAmount);
        }, 0);
    
    // Use total discounts from backend if available (for all orders, not just paginated)
    // Otherwise fallback to calculating from current page orders
    const totalDiscounts = allOrders?.totalDiscounts !== undefined 
        ? allOrders.totalDiscounts 
        : orders.reduce((sum, order) => {
            if (order.status === 'REFUNDED') return sum;
            return sum + parseFloat(order.discount || 0);
        }, 0);
    
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                            {t('ordersHistory') || 'Orders History'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">{t('viewAndManageOrders')}</p>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Order ID Search */}
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-md hover:shadow-lg transition-all">
                            <Search size={18} className="text-blue-500" />
                            <label htmlFor="orderIdSearch" className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                {t('orderId') || 'Order ID'}:
                            </label>
                            <input
                                id="orderIdSearch"
                                type="number"
                                min="1"
                                value={searchInputValue}
                                onChange={handleSearchChange}
                                onKeyPress={handleSearchKeyPress}
                                placeholder={t('searchOrderId') || 'Enter ID...'}
                                className="border-none outline-none text-sm font-medium text-gray-800 dark:text-gray-200 bg-transparent focus:ring-0 w-32 placeholder-gray-400 dark:placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            {(searchInputValue || searchOrderId) && (
                                <button
                                    onClick={clearSearch}
                                    className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X size={16} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Cashier Filter */}
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-md hover:shadow-lg transition-all">
                            <Filter size={18} className="text-blue-500" />
                            <label htmlFor="cashierFilter" className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                {t('cashier') || 'Cashier'}:
                            </label>
                            <select
                                id="cashierFilter"
                                value={selectedCashierId}
                                onChange={handleCashierFilterChange}
                                className="border-none outline-none text-sm font-medium text-gray-800 dark:text-gray-200 bg-transparent cursor-pointer focus:ring-0 min-w-[150px]"
                            >
                                <option value="">{t('allCashiers') || 'All Cashiers'}</option>
                                {uniqueCashiers.map((cashier) => (
                                    <option key={cashier.id} value={cashier.id}>
                                        {cashier.name}
                                    </option>
                                ))}
                            </select>
                            {selectedCashierId && (
                                <button
                                    onClick={clearCashierFilter}
                                    className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    aria-label="Clear filter"
                                >
                                    <X size={16} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <ShoppingBag size={24} />
                            </div>
                            <span className="text-3xl font-bold">{totalOrders}</span>
                        </div>
                        <p className="text-blue-100 text-sm font-medium">{t('totalOrdersLabel')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-2xl font-bold">{formatCurrency(totalSales)}</span>
                        </div>
                        <p className="text-green-100 text-sm font-medium">{t('totalSalesLabel')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-2xl font-bold">{formatCurrency(totalDiscounts)}</span>
                        </div>
                        <p className="text-red-100 text-sm font-medium">{t('totalDiscounts')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Clock size={24} />
                            </div>
                            <span className="text-2xl font-bold">{formatCurrency(averageOrder)}</span>
                        </div>
                        <p className="text-purple-100 text-sm font-medium">{t('averageOrder')}</p>
                    </div>
                </div>

                {/* Cashier Total Sales Card */}
                {selectedCashierId && selectedCashierName && (
                    <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-4 rounded-xl">
                                    <User size={32} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-100 mb-1">
                                        {t('totalSales') || 'Total Sales'} - {selectedCashierName}
                                    </p>
                                    <p className="text-4xl font-bold">
                                        {formatCurrency(cashierTotalSales)}
                                    </p>
                                    <p className="text-sm text-blue-100 mt-1">
                                        {orders.length} {t('ordersLabel') || 'orders'} • {t('average') || 'Average'}: {formatCurrency(orders.length > 0 ? cashierTotalSales / orders.length : 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {t('orders') || 'Orders'}
                    </h2>
                    
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">{t('show') || 'Show'}:</label>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('perPage') || 'per page'}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-block p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl mb-4">
                            <ShoppingBag className="text-blue-500" size={64} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('noOrdersFound')}</h3>
                        <p className="text-gray-500">
                            {selectedCashierId ? t('noOrdersForCashier') : t('ordersWillAppear')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('orderId')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('date')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('cashier')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('status') || 'Status'}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('discount')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('total')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('payment')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">#{order.id}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                                                    <div className="text-sm">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {new Date(order.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                        {order.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{order.user?.name || t('unknown')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order.status === 'REFUNDED' ? (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                                        <RotateCcw size={12} />
                                                        {t('refunded') || 'Refunded'}
                                                    </span>
                                                ) : order.status === 'PARTIALLY_REFUNDED' ? (
                                                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                                        <RotateCcw size={12} />
                                                        {t('partiallyRefunded') || 'Partially Refunded'}
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                                        <CheckCircle2 size={12} />
                                                        {t('completed') || 'Completed'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {parseFloat(order.discount) > 0 ? (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-semibold">
                                                        -{formatCurrency(order.discount)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`text-lg font-bold ${
                                                        order.status === 'REFUNDED' 
                                                            ? 'line-through text-gray-400 dark:text-gray-500' 
                                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent'
                                                    }`}>
                                                        {formatCurrency(order.totalAmount)}
                                                    </span>
                                                    {order.totalRefunded > 0 && (
                                                        <span className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                            {t('refunded') || 'Refunded'}: -{formatCurrency(order.totalRefunded)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {order.paymentMethod === 'CASH' ? (
                                                        <Banknote size={16} className="text-green-600" />
                                                    ) : (
                                                        <CreditCard size={16} className="text-blue-600" />
                                                    )}
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        order.paymentMethod === 'CASH' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {order.paymentMethod}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => handleViewOrder(order)} 
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title={t('viewOrderDetails')}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('showing') || 'Showing'} {(currentPage - 1) * pageSize + 1} {t('to') || 'to'}{' '}
                                    {Math.min(currentPage * pageSize, totalCount)} {t('of') || 'of'}{' '}
                                    {totalCount} {t('results') || 'results'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center gap-2 ${
                                            currentPage === 1
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <ChevronLeft size={18} />
                                        {t('previous') || 'Previous'}
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-2 rounded-lg ${
                                                        currentPage === pageNum
                                                            ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center gap-2 ${
                                            currentPage >= totalPages
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {t('next') || 'Next'}
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${t('orderId') || 'Order'} #${selectedOrder?.id}`}>
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Order Info */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border-2 border-blue-100 dark:border-blue-800">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Calendar className="text-white" size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('date')}</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                        <User className="text-white" size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('cashier')}</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedOrder.user?.name || t('unknown')}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Refund Status */}
                            {(selectedOrder.status === 'REFUNDED' || selectedOrder.status === 'PARTIALLY_REFUNDED' || (selectedOrder.totalRefunded > 0)) && (
                                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            selectedOrder.status === 'REFUNDED' 
                                                ? 'bg-red-500' 
                                                : 'bg-orange-500'
                                        }`}>
                                            <RotateCcw className="text-white" size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('refundStatus') || 'Refund Status'}</p>
                                            <p className={`font-semibold ${
                                                selectedOrder.status === 'REFUNDED' 
                                                    ? 'text-red-700 dark:text-red-400' 
                                                    : 'text-orange-700 dark:text-orange-400'
                                            }`}>
                                                {selectedOrder.status === 'REFUNDED' 
                                                    ? (t('fullyRefunded') || 'Fully Refunded')
                                                    : (t('partiallyRefunded') || 'Partially Refunded')
                                                }
                                            </p>
                                            {selectedOrder.totalRefunded > 0 && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                    {t('totalRefunded') || 'Total Refunded'}: {formatCurrency(selectedOrder.totalRefunded)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items List */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <Package size={18} className="text-blue-600 dark:text-blue-400" />
                                {t('items') || 'Items'}
                            </h4>
                            <div className="space-y-2">
                                {selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {item.quantity}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{item.product?.name || item.Product?.name || t('unknownProduct')}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(item.price)} {t('each')}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700 space-y-3">
                            {parseFloat(selectedOrder.discount) > 0 && (
                                <>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <span className="text-gray-600 dark:text-gray-300 font-medium">{t('subtotal')}:</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                                            {formatCurrency(parseFloat(selectedOrder.totalAmount) + parseFloat(selectedOrder.discount))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800">
                                        <span className="text-red-700 dark:text-red-400 font-medium">{t('discount')}:</span>
                                        <span className="font-semibold text-red-700 dark:text-red-400">
                                            -{formatCurrency(selectedOrder.discount)}
                                        </span>
                                    </div>
                                </>
                            )}
                            {selectedOrder.totalRefunded > 0 && (
                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800">
                                    <span className="text-red-700 dark:text-red-400 font-medium">{t('refunded') || 'Refunded'}:</span>
                                    <span className="font-semibold text-red-700 dark:text-red-400">
                                        -{formatCurrency(selectedOrder.totalRefunded)}
                                    </span>
                                </div>
                            )}
                            <div className={`flex justify-between items-center p-4 rounded-xl text-white ${
                                selectedOrder.status === 'REFUNDED' 
                                    ? 'bg-gray-500' 
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
                            }`}>
                                <span className="text-lg font-bold">{t('total')}:</span>
                                <span className={`text-2xl font-bold ${
                                    selectedOrder.status === 'REFUNDED' ? 'line-through' : ''
                                }`}>
                                    {formatCurrency(selectedOrder.totalAmount)}
                                </span>
                            </div>
                            {selectedOrder.totalRefunded > 0 && selectedOrder.status !== 'REFUNDED' && (
                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800">
                                    <span className="text-green-700 dark:text-green-400 font-medium">{t('netTotal') || 'Net Total'}:</span>
                                    <span className="font-semibold text-green-700 dark:text-green-400 text-lg">
                                        {formatCurrency(parseFloat(selectedOrder.totalAmount) - (selectedOrder.totalRefunded || 0))}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                            {selectedOrder.status !== 'REFUNDED' && (
                                <button 
                                    onClick={() => handleOpenRefundModal(selectedOrder)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:from-red-600 hover:to-red-700"
                                >
                                    <RotateCcw size={20} />
                                    <span>{t('refund') || 'Refund'}</span>
                                </button>
                            )}
                            {selectedOrder.status === 'REFUNDED' && (
                                <button 
                                    disabled
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-400 text-white py-3 rounded-xl font-semibold cursor-not-allowed"
                                >
                                    <RotateCcw size={20} />
                                    <span>{t('refunded') || 'Refunded'}</span>
                                </button>
                            )}
                            <button 
                                onClick={handlePrintReceipt}
                                disabled={isPrinting}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPrinting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>{t('printing') || 'Printing...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={20} />
                                        <span>{t('printReceipt') || 'Print Receipt'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Refund Modal */}
            <Modal 
                isOpen={isRefundModalOpen} 
                onClose={() => setIsRefundModalOpen(false)} 
                title={t('processRefund') || 'Process Refund'}
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                                <strong>{t('orderNumber') || 'Order'}:</strong> #{selectedOrder.id} • 
                                <strong> {t('total')}:</strong> {formatCurrency(selectedOrder.totalAmount)}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-3">{t('selectItemsToRefund') || 'Select Items to Refund'}</h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {refundItems.map((item, index) => {
                                    const availableQuantity = item.availableQuantity || 0;
                                    const refundedQuantity = item.refundedQuantity || 0;
                                    const isFullyRefunded = availableQuantity === 0;
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className={`p-4 rounded-xl border ${
                                                isFullyRefunded 
                                                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60' 
                                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className={`font-semibold ${
                                                        isFullyRefunded 
                                                            ? 'text-gray-400 dark:text-gray-500 line-through' 
                                                            : 'text-gray-800 dark:text-gray-100'
                                                    }`}>
                                                        {item.productName}
                                                    </p>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        <p>{formatCurrency(item.price)} {t('each')}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span>
                                                                {t('total')}: {item.maxQuantity} • {t('available') || 'Available'}: <span className="font-semibold text-green-600 dark:text-green-400">{availableQuantity}</span>
                                                            </span>
                                                            {refundedQuantity > 0 && (
                                                                <span className="text-red-600 dark:text-red-400">
                                                                    • {t('refunded')}: {refundedQuantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isFullyRefunded && (
                                                            <p className="text-red-600 dark:text-red-400 font-semibold mt-1">
                                                                {t('fullyRefunded') || 'Fully Refunded'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateRefundQuantity(index, -1)}
                                                        disabled={item.quantity === 0 || isFullyRefunded}
                                                        className="p-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Minus size={16} className="text-gray-800 dark:text-gray-200" />
                                                    </button>
                                                    <span className={`w-12 text-center font-bold ${
                                                        isFullyRefunded 
                                                            ? 'text-gray-400 dark:text-gray-500' 
                                                            : 'text-gray-800 dark:text-gray-100'
                                                    }`}>
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateRefundQuantity(index, 1)}
                                                        disabled={item.quantity >= availableQuantity || isFullyRefunded}
                                                        className="p-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Plus size={16} className="text-gray-800 dark:text-gray-200" />
                                                    </button>
                                                </div>
                                            </div>
                                            {item.quantity > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {t('subtotal')}: <span className="font-bold text-blue-600 dark:text-blue-400">
                                                            {formatCurrency(parseFloat(item.price) * item.quantity)}
                                                        </span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                {t('refundReason') || 'Reason (Optional)'}
                            </label>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                rows="3"
                                placeholder={t('enterRefundReason') || 'Enter reason for refund...'}
                            />
                        </div>

                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{t('totalRefundAmount') || 'Total Refund Amount'}:</span>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(
                                        refundItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsRefundModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                disabled={processingRefund}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleProcessRefund}
                                disabled={processingRefund || refundItems.every(item => item.quantity === 0) || refundItems.every(item => (item.availableQuantity || 0) === 0)}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processingRefund ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>{t('processing') || 'Processing...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw size={20} />
                                        <span>{t('processRefund') || 'Process Refund'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Refund Confirmation Modal */}
            <Modal 
                isOpen={isConfirmRefundModalOpen} 
                onClose={() => !processingRefund && setIsConfirmRefundModalOpen(false)} 
                title={t('confirmRefund') || 'Confirm Refund'}
            >
                <div className="space-y-6">
                    {/* Warning Icon */}
                    <div className="flex justify-center">
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <RotateCcw size={48} className="text-red-600 dark:text-red-400" />
                        </div>
                    </div>

                    {/* Confirmation Message */}
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            {t('areYouSureRefund') || 'Are you sure you want to process this refund?'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t('refundCannotBeUndone') || 'This action cannot be undone.'}
                        </p>
                    </div>

                    {/* Refund Summary */}
                    {selectedOrder && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {t('orderNumber') || 'Order'}:
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">
                                    #{selectedOrder.id}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {t('itemsToRefund') || 'Items to Refund'}:
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">
                                    {refundItems.filter(item => item.quantity > 0).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {t('totalRefundAmount') || 'Total Refund Amount'}:
                                </span>
                                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(
                                        refundItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsConfirmRefundModalOpen(false)}
                            disabled={processingRefund}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                        <button
                            onClick={confirmAndProcessRefund}
                            disabled={processingRefund}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {processingRefund ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>{t('processing') || 'Processing...'}</span>
                                </>
                            ) : (
                                <>
                                    <RotateCcw size={20} />
                                    <span>{t('confirmAndProcess') || 'Confirm & Process'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-4 right-4 z-50 animate-slide-in-right ${
                    notification.type === 'success' 
                        ? 'bg-green-500 dark:bg-green-600' 
                        : 'bg-red-500 dark:bg-red-600'
                } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md border-2 ${
                    notification.type === 'success' 
                        ? 'border-green-600 dark:border-green-700' 
                        : 'border-red-600 dark:border-red-700'
                }`}>
                    <div className={`flex-shrink-0 ${
                        notification.type === 'success' 
                            ? 'bg-green-600 dark:bg-green-700' 
                            : 'bg-red-600 dark:bg-red-700'
                    } rounded-full p-2`}>
                        {notification.type === 'success' ? (
                            <CheckCircle size={24} className="text-white" />
                        ) : (
                            <AlertCircle size={24} className="text-white" />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-white text-sm">
                            {notification.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                        className="flex-shrink-0 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                        aria-label="Close notification"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Orders;

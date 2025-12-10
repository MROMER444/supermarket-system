import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, FileText, X, DollarSign, ShoppingBag, Clock, User, Loader2, Calendar, Package, RotateCcw, ChevronLeft, ChevronRight, Search, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const Refunded = () => {
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchOrderId, setSearchOrderId] = useState('');
    const [searchInputValue, setSearchInputValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const searchTimeoutRef = useRef(null);
    const { user } = useAuth();
    const { formatCurrency } = useSettings();
    const { t, language, formatDate, formatTime, formatDateTime } = useLanguage();

    useEffect(() => {
        fetchRefundedOrders();
    }, []);

    // Debounce search input
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setSearchOrderId(searchInputValue);
            setCurrentPage(1);
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchInputValue]);

    useEffect(() => {
        fetchRefundedOrders();
    }, [searchOrderId, currentPage, pageSize]);

    const fetchRefundedOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', pageSize);
            params.append('status', 'REFUNDED,PARTIALLY_REFUNDED'); // Filter for both fully and partially refunded orders
            
            if (searchOrderId) {
                params.append('orderId', searchOrderId);
            }
            
            const response = await axios.get(`http://localhost:5000/api/orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            
            if (response.data.orders) {
                setOrders(response.data.orders);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setTotalCount(response.data.pagination?.totalCount || response.data.orders.length);
                if (response.data.totalSales !== undefined || response.data.totalOrders !== undefined) {
                    setAllOrders(response.data);
                }
            } else {
                setOrders(response.data || []);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching refunded orders:', error);
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchInputValue(e.target.value);
    };

    const handleSearchKeyPress = (e) => {
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
        setCurrentPage(1);
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
        setCurrentPage(1);
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleExportToExcel = async () => {
        try {
            // Fetch all refunded orders (using a large limit)
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', '10000'); // Large limit to get all orders
            params.append('status', 'REFUNDED,PARTIALLY_REFUNDED');
            
            if (searchOrderId) {
                params.append('orderId', searchOrderId);
            }
            
            const response = await axios.get(`http://localhost:5000/api/orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });

            const allOrders = response.data.orders || [];
            
            if (allOrders.length === 0) {
                alert(t('noRefundedOrders') || 'No refunded orders found');
                return;
            }

            const totalOrders = response.data.totalOrders || allOrders.length;
            const totalRefunded = response.data.totalSales || allOrders.reduce((sum, order) => {
                const refundedAmount = order.totalRefunded ? parseFloat(order.totalRefunded) : parseFloat(order.totalAmount || 0);
                return sum + refundedAmount;
            }, 0);
            const averageRefund = totalOrders > 0 ? totalRefunded / totalOrders : 0;
            
            // Create worksheet data
            const worksheetData = [
                // Header row
                [
                    t('refundedOrders') || 'Refunded Orders',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                ],
                [`${t('totalRefundedOrders') || 'Total Refunded Orders'}: ${totalOrders}`, '', '', '', '', '', ''],
                [`${t('totalRefundedAmount') || 'Total Refunded Amount'}: ${formatCurrency(totalRefunded)}`, '', '', '', '', '', ''],
                [`${t('averageRefund') || 'Average Refund'}: ${formatCurrency(averageRefund)}`, '', '', '', '', '', ''],
                [], // Empty row
                // Column headers
                [
                    t('orderId') || 'Order ID',
                    t('date') || 'Date',
                    t('time') || 'Time',
                    t('cashier') || 'Cashier',
                    t('status') || 'Status',
                    t('originalAmount') || 'Original Amount',
                    t('refundedAmount') || 'Refunded Amount',
                ],
                // Data rows
                ...allOrders.map(order => {
                    const refundedAmount = order.totalRefunded ? parseFloat(order.totalRefunded) : parseFloat(order.totalAmount || 0);
                    const originalAmount = parseFloat(order.totalAmount || 0);
                    
                    let statusText = t('fullyRefunded') || 'Fully Refunded';
                    if (order.status === 'PARTIALLY_REFUNDED') {
                        statusText = t('partiallyRefunded') || 'Partially Refunded';
                    } else if (order.status === 'REFUNDED') {
                        statusText = t('fullyRefunded') || 'Fully Refunded';
                    }
                    
                    return [
                        `#${order.id}`,
                        formatDate(order.createdAt),
                        formatTime(order.createdAt),
                        order.user?.name || t('unknown') || 'Unknown',
                        statusText,
                        originalAmount,
                        refundedAmount,
                    ];
                }),
            ];

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            ws['!cols'] = [
                { wch: 12 }, // Order ID
                { wch: 12 }, // Date
                { wch: 15 }, // Time
                { wch: 20 }, // Cashier
                { wch: 20 }, // Status
                { wch: 18 }, // Original Amount
                { wch: 18 }, // Refunded Amount
            ];

            // Merge cells for header
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Report title
                { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Total Orders row
                { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Total Refunded Amount row
                { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Average Refund row
            ];

            // Ensure values are set correctly in column A (the merged cell's top-left)
            if (ws['A1']) {
                ws['A1'].v = t('refundedOrders') || 'Refunded Orders';
            }
            if (ws['A2']) {
                ws['A2'].v = `${t('totalRefundedOrders') || 'Total Refunded Orders'}: ${totalOrders}`;
            }
            if (ws['A3']) {
                ws['A3'].v = `${t('totalRefundedAmount') || 'Total Refunded Amount'}: ${formatCurrency(totalRefunded)}`;
            }
            if (ws['A4']) {
                ws['A4'].v = `${t('averageRefund') || 'Average Refund'}: ${formatCurrency(averageRefund)}`;
            }

            // Add borders and styling to cells
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Helper function to add borders to a cell
            const addBorders = (cell) => {
                if (!cell.s) cell.s = {};
                cell.s.border = {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    bottom: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } },
                    right: { style: 'thin', color: { rgb: '000000' } },
                };
            };
            
            // Style header row (row 0)
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
                if (!ws[cellAddress].s) ws[cellAddress].s = {};
                ws[cellAddress].s.font = { bold: true, sz: 14 };
                ws[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' };
                addBorders(ws[cellAddress]);
            }
            
            // Style info rows (rows 1-3) - Total Orders, Total Refunded Amount, Average Refund
            for (let row = 1; row <= 3; row++) {
                const cell = XLSX.utils.encode_cell({ r: row, c: 0 });
                if (!ws[cell]) ws[cell] = { t: 's', v: '' };
                if (!ws[cell].s) ws[cell].s = {};
                ws[cell].s.font = { bold: true };
                ws[cell].s.alignment = { horizontal: 'left', vertical: 'center' };
                addBorders(ws[cell]);
                
                // Also add borders to other columns in the merged range for visual consistency
                for (let col = 1; col <= 6; col++) {
                    const mergedCell = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!ws[mergedCell]) ws[mergedCell] = { t: 's', v: '' };
                    if (!ws[mergedCell].s) ws[mergedCell].s = {};
                    addBorders(ws[mergedCell]);
                }
            }
            
            // Style column headers (row 5)
            const headerRow = 5;
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
                if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
                if (!ws[cellAddress].s) ws[cellAddress].s = {};
                ws[cellAddress].s.font = { bold: true };
                ws[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' };
                ws[cellAddress].s.fill = { fgColor: { rgb: 'D3D3D3' } };
                addBorders(ws[cellAddress]);
            }
            
            // Style data rows
            for (let row = headerRow + 1; row <= range.e.r; row++) {
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
                    if (!ws[cellAddress].s) ws[cellAddress].s = {};
                    addBorders(ws[cellAddress]);
                    
                    // Format amount columns (columns 5 and 6) as currency
                    if ((col === 5 || col === 6) && ws[cellAddress].t === 'n') {
                        ws[cellAddress].z = '#,##0.00';
                    }
                }
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, t('refundedOrders') || 'Refunded Orders');

            // Generate filename with current date
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '_');
            const filename = `Refunded_Orders_${today}.xlsx`;

            // Write file
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert(t('exportFailed') || 'Failed to export to Excel. Please try again.');
        }
    };

    // Calculate totals
    // Use backend totals if available, otherwise calculate from current page
    const totalOrders = allOrders?.totalOrders !== undefined 
        ? allOrders.totalOrders 
        : (totalCount || orders.length);
    
    // For refunded orders, totalSales from backend contains total refunded amount
    const totalRefunded = allOrders?.totalSales !== undefined 
        ? allOrders.totalSales 
        : orders.reduce((sum, order) => {
            const refundedAmount = order.totalRefunded ? parseFloat(order.totalRefunded) : parseFloat(order.totalAmount || 0);
            return sum + refundedAmount;
        }, 0);

    const averageRefund = totalOrders > 0 ? totalRefunded / totalOrders : 0;

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
                            {t('refundedOrders') || 'Refunded Orders'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t('viewRefundedOrders') || 'View all refunded orders and their details'}
                        </p>
                    </div>
                    <button
                        onClick={handleExportToExcel}
                        disabled={orders.length === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                            orders.length === 0
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-xl transform hover:scale-105'
                        }`}
                    >
                        <Download size={20} />
                        {t('exportToExcel') || 'Export to Excel'}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                            <input
                                type="text"
                                value={searchInputValue}
                                onChange={handleSearchChange}
                                onKeyPress={handleSearchKeyPress}
                                placeholder={t('searchByOrderId') || 'Search by Order ID...'}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            {searchInputValue && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <RotateCcw size={24} />
                        </div>
                        <span className="text-3xl font-bold">{totalOrders}</span>
                    </div>
                    <p className="text-red-100 text-sm font-medium">{t('totalRefundedOrders') || 'Total Refunded Orders'}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-2xl font-bold">{formatCurrency(totalRefunded)}</span>
                    </div>
                    <p className="text-orange-100 text-sm font-medium">{t('totalRefundedAmount') || 'Total Refunded Amount'}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <span className="text-2xl font-bold">{formatCurrency(averageRefund)}</span>
                    </div>
                    <p className="text-purple-100 text-sm font-medium">{t('averageRefund') || 'Average Refund'}</p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {t('refundedOrders') || 'Refunded Orders'}
                    </h2>
                    
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">{t('show') || 'Show'}:</label>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-red-500 dark:focus:border-red-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                        <Loader2 className="animate-spin text-red-600" size={48} />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-block p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-2xl mb-4">
                            <RotateCcw className="text-red-500" size={64} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('noRefundedOrders') || 'No Refunded Orders Found'}</h3>
                        <p className="text-gray-500">
                            {searchOrderId ? t('noOrdersFoundForSearch') || 'No orders found for your search' : t('noRefundedOrdersYet') || 'No refunded orders yet'}
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
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('originalAmount') || 'Original Amount'}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('refundedAmount') || 'Refunded Amount'}</th>
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
                                                            {formatDate(order.createdAt)}
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
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                                        {order.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{order.user?.name || t('unknown')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order.status === 'REFUNDED' ? (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                        <RotateCcw size={12} />
                                                        {t('fullyRefunded') || 'Fully Refunded'}
                                                    </span>
                                                ) : order.status === 'PARTIALLY_REFUNDED' ? (
                                                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                        <RotateCcw size={12} />
                                                        {t('partiallyRefunded') || 'Partially Refunded'}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-lg font-bold ${
                                                    order.status === 'REFUNDED' 
                                                        ? 'text-gray-400 dark:text-gray-500 line-through' 
                                                        : 'text-gray-800 dark:text-gray-200'
                                                }`}>
                                                    {formatCurrency(order.totalAmount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                                        -{formatCurrency(order.totalRefunded || order.totalAmount)}
                                                    </span>
                                                    {order.status === 'PARTIALLY_REFUNDED' && (
                                                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                            {t('netTotal') || 'Net'}: {formatCurrency(order.totalAmount - (order.totalRefunded || 0))}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => handleViewOrder(order)} 
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
                                                            ? 'bg-red-600 dark:bg-red-500 text-white'
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
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center gap-2 ${
                                            currentPage === totalPages
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

            {/* Order Details Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${t('orderId') || 'Order'} #${selectedOrder?.id} - ${selectedOrder?.status === 'PARTIALLY_REFUNDED' ? (t('partiallyRefunded') || 'Partially Refunded') : (t('refunded') || 'Refunded')}`}>
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Order Info */}
                        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl border-2 border-red-100 dark:border-red-800">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500 rounded-lg">
                                        <Calendar className="text-white" size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('date')}</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{formatDateTime(selectedOrder.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500 rounded-lg">
                                        <User className="text-white" size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('cashier')}</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedOrder.user?.name || t('unknown')}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Refund Status */}
                            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500 rounded-lg">
                                        <RotateCcw className="text-white" size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('refundStatus') || 'Refund Status'}</p>
                                        <p className={`font-semibold ${
                                            selectedOrder.status === 'PARTIALLY_REFUNDED' 
                                                ? 'text-orange-700 dark:text-orange-400' 
                                                : 'text-red-700 dark:text-red-400'
                                        }`}>
                                            {selectedOrder.status === 'PARTIALLY_REFUNDED' 
                                                ? (t('partiallyRefunded') || 'Partially Refunded')
                                                : (t('fullyRefunded') || 'Fully Refunded')}
                                        </p>
                                        {selectedOrder.totalRefunded > 0 && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                {t('totalRefunded') || 'Total Refunded'}: {formatCurrency(selectedOrder.totalRefunded)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <Package size={18} className="text-red-600 dark:text-red-400" />
                                {t('items') || 'Items'}
                            </h4>
                            <div className="space-y-2">
                                {selectedOrder.items?.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold">
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
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">{t('originalAmount') || 'Original Amount'}:</span>
                                <span className={`font-semibold ${
                                    selectedOrder.status === 'REFUNDED' 
                                        ? 'text-gray-400 dark:text-gray-500 line-through' 
                                        : 'text-gray-800 dark:text-gray-200'
                                }`}>
                                    {formatCurrency(selectedOrder.totalAmount)}
                                </span>
                            </div>
                            {selectedOrder.totalRefunded > 0 && (
                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800">
                                    <span className="text-red-700 dark:text-red-400 font-medium">{t('refunded') || 'Refunded'}:</span>
                                    <span className="font-semibold text-red-700 dark:text-red-400">
                                        -{formatCurrency(selectedOrder.totalRefunded)}
                                    </span>
                                </div>
                            )}
                            {selectedOrder.status === 'PARTIALLY_REFUNDED' && (
                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800">
                                    <span className="text-green-700 dark:text-green-400 font-medium">{t('netTotal') || 'Net Total'}:</span>
                                    <span className="font-semibold text-green-700 dark:text-green-400">
                                        {formatCurrency(selectedOrder.totalAmount - (selectedOrder.totalRefunded || 0))}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Refunded;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, DollarSign, ShoppingBag, ChevronLeft, ChevronRight, Download, Tag, CheckCircle2, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import MultiDatePicker from '../components/MultiDatePicker';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const Reports = () => {
    const [dailyReport, setDailyReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDates, setSelectedDates] = useState(() => {
        // Default to today's date
        const today = new Date();
        return [today.toISOString().split('T')[0]];
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [withDiscount, setWithDiscount] = useState(false);
    const { user } = useAuth();
    const { formatCurrency } = useSettings();
    const { t } = useLanguage();

    useEffect(() => {
        if (selectedDates.length > 0) {
            fetchDailyReport();
        }
    }, [selectedDates, currentPage, pageSize, withDiscount]);

    const fetchDailyReport = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            // Add dates as array parameters
            selectedDates.forEach(date => {
                params.append('dates', date);
            });
            
            params.append('page', currentPage.toString());
            params.append('limit', pageSize.toString());
            
            // Add discount filter if enabled
            if (withDiscount) {
                params.append('withDiscount', 'true');
            }
            
            const response = await axios.get(`http://localhost:5000/api/orders/daily-report?${params}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setDailyReport(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching report:', error);
            setLoading(false);
        }
    };

    const handleDatesChange = (dates) => {
        setSelectedDates(dates);
        setCurrentPage(1); // Reset to first page when dates change
    };

    const handleDiscountFilterChange = (e) => {
        setWithDiscount(e.target.checked);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
        setCurrentPage(1); // Reset to first page when page size changes
    };

    const handleExportToExcel = async () => {
        try {
            if (selectedDates.length === 0) {
                alert(t('selectDates') || 'Please select at least one date');
                return;
            }

            // Fetch all orders for the selected dates (using a large limit)
            const params = new URLSearchParams();
            selectedDates.forEach(date => {
                params.append('dates', date);
            });
            params.append('page', '1');
            params.append('limit', '10000'); // Large limit to get all orders
            
            // Add discount filter if enabled
            if (withDiscount) {
                params.append('withDiscount', 'true');
            }
            
            const response = await axios.get(`http://localhost:5000/api/orders/daily-report?${params}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });

            const allOrders = response.data.orders || [];
            
            if (allOrders.length === 0) {
                alert(t('noTransactions') || 'No transactions found for selected dates');
                return;
            }

            // Prepare data for Excel
            let dateStr;
            if (selectedDates.length === 1) {
                dateStr = new Date(selectedDates[0]).toLocaleDateString();
            } else if (selectedDates.length === 2) {
                // Range mode
                const sortedDates = [...selectedDates].sort();
                const startDate = new Date(sortedDates[0]).toLocaleDateString();
                const endDate = new Date(sortedDates[1]).toLocaleDateString();
                dateStr = `${startDate} ${t('to') || 'to'} ${endDate}`;
            } else {
                dateStr = `${selectedDates.length} ${t('dates') || 'dates'}`;
            }
            
            const totalSales = response.data.totalSales || 0;
            const totalOrders = response.data.totalOrders || 0;
            const totalDiscount = response.data.totalDiscount || 0;
            
            // Create worksheet data
            const worksheetData = [
                // Header row
                [
                    t('dailySalesReport') || 'Daily Sales Report',
                    '',
                    '',
                    '',
                    '',
                    '',
                ],
                [`${t('date') || 'Date'}: ${dateStr}`, '', '', '', '', ''],
                [`${t('totalSales') || 'Total Sales'}: ${formatCurrency(totalSales)}`, '', '', '', '', ''],
                [`${t('totalOrders') || 'Total Orders'}: ${totalOrders}`, '', '', '', '', ''],
                [`${t('totalDiscount') || 'Total Discount'}: ${formatCurrency(totalDiscount)}`, '', '', '', '', ''],
                [], // Empty row
                // Column headers
                [
                    t('date') || 'Date',
                    t('time') || 'Time',
                    t('orderId') || 'Order ID',
                    t('status') || 'Status',
                    t('amount') || 'Amount',
                    t('discount') || 'Discount',
                    t('payment') || 'Payment',
                ],
                // Data rows
                ...allOrders.map(order => {
                    let statusText = t('completed') || 'Completed';
                    if (order.status === 'REFUNDED') {
                        statusText = t('refunded') || 'Refunded';
                    } else if (order.status === 'PARTIALLY_REFUNDED') {
                        statusText = t('partiallyRefunded') || 'Partially Refunded';
                    }
                    
                    // Calculate net amount (original amount - refunded amount)
                    const originalAmount = parseFloat(order.totalAmount);
                    const refundedAmount = order.totalRefunded ? parseFloat(order.totalRefunded) : 0;
                    const netAmount = originalAmount - refundedAmount;
                    
                    return [
                        new Date(order.createdAt).toLocaleDateString(),
                        new Date(order.createdAt).toLocaleTimeString(),
                        `#${order.id}`,
                        statusText,
                        netAmount, // Use net amount instead of original amount
                        parseFloat(order.discount) || 0,
                        order.paymentMethod,
                    ];
                }),
            ];

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            ws['!cols'] = [
                { wch: 12 }, // Date
                { wch: 15 }, // Time
                { wch: 12 }, // Order ID
                { wch: 18 }, // Status
                { wch: 15 }, // Amount
                { wch: 12 }, // Discount
                { wch: 12 }, // Payment
            ];

            // Merge cells for header
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Report title
                { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Date row - merge all columns
                { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Total Sales row - merge all columns
                { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Total Orders row - merge all columns
                { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // Total Discount row - merge all columns
            ];

            // Ensure values are set correctly in column A (the merged cell's top-left)
            if (ws['A1']) {
                ws['A1'].v = t('dailySalesReport') || 'Daily Sales Report';
            }
            if (ws['A2']) {
                ws['A2'].v = `${t('date') || 'Date'}: ${dateStr}`;
            }
            if (ws['A3']) {
                ws['A3'].v = `${t('totalSales') || 'Total Sales'}: ${formatCurrency(totalSales)}`;
            }
            if (ws['A4']) {
                ws['A4'].v = `${t('totalOrders') || 'Total Orders'}: ${totalOrders}`;
            }
            if (ws['A5']) {
                ws['A5'].v = `${t('totalDiscount') || 'Total Discount'}: ${formatCurrency(totalDiscount)}`;
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
            
            // Style info rows (rows 1-4) - Date, Total Sales, Total Orders, Total Discount
            // These rows are merged across all columns, so we only style column 0
            for (let row = 1; row <= 4; row++) {
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
            
            // Style column headers (row 6)
            const headerRow = 6;
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
                    
                    // Format amount column (column 4) as currency
                    if (col === 4 && ws[cellAddress].t === 'n') {
                        ws[cellAddress].z = '#,##0.00';
                    }
                }
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, t('dailySalesReport') || 'Daily Sales Report');

            // Generate filename
            const filename = selectedDates.length === 1
                ? `Daily_Sales_Report_${selectedDates[0].replace(/-/g, '_')}.xlsx`
                : `Daily_Sales_Report_${selectedDates[0].replace(/-/g, '_')}_to_${selectedDates[selectedDates.length - 1].replace(/-/g, '_')}.xlsx`;

            // Write file
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert(t('exportFailed') || 'Failed to export to Excel. Please try again.');
        }
    };

    if (loading && !dailyReport) return <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-600 dark:text-gray-400">{t('loading')}</div>;

    const pagination = dailyReport?.pagination || {};
    const today = new Date().toISOString().split('T')[0];
    const isSingleDay = selectedDates.length === 1;
    const isToday = isSingleDay && selectedDates[0] === today;
    
    const formatDateRange = () => {
        if (selectedDates.length === 0) return '';
        if (selectedDates.length === 1) {
            return new Date(selectedDates[0]).toLocaleDateString();
        }
        const sortedDates = [...selectedDates].sort();
        const firstDate = new Date(sortedDates[0]).toLocaleDateString();
        const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString();
        return `${firstDate} ${t('to')} ${lastDate}`;
    };

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{t('dailySalesReport')}</h1>
            
            {/* Filters Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Date Selection Section */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            {t('selectDates') || 'Select Dates'}
                        </label>
                        <div className="flex items-center">
                            <MultiDatePicker
                                selectedDates={selectedDates}
                                onChange={handleDatesChange}
                                maxDate={today}
                            />
                        </div>
                        {selectedDates.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {selectedDates.length === 1 
                                    ? `${selectedDates.length} ${t('dateSelected')}`
                                    : selectedDates.length === 2
                                        ? `${t('range')}: ${formatDateRange()}`
                                        : `${selectedDates.length} ${t('datesSelected')}`
                                }
                            </p>
                        )}
                    </div>
                    
                    {/* Divider */}
                    <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                    
                    {/* Discount Filter Section */}
                    <div className="flex items-center">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setWithDiscount(!withDiscount)}>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="discountFilter"
                                    checked={withDiscount}
                                    onChange={handleDiscountFilterChange}
                                    className="w-5 h-5 text-purple-600 dark:text-purple-400 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-2 cursor-pointer bg-white dark:bg-gray-700"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="discountFilter" className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                                    {t('withDiscount') || 'With Discount Only'}
                                </label>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {t('showOnlyDiscountedOrders')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Sales Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-3xl font-bold">{formatCurrency(dailyReport?.totalSales || 0)}</span>
                    </div>
                    <p className="text-green-100 text-sm font-medium">
                        {isToday 
                            ? t('totalSalesToday') 
                            : isSingleDay
                                ? `${t('totalSales')} - ${formatDateRange()}`
                                : `${t('totalSales')} - ${formatDateRange()}`
                        }
                    </p>
                </div>

                {/* Total Orders Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <ShoppingBag size={24} />
                        </div>
                        <span className="text-3xl font-bold">{dailyReport?.totalOrders || 0}</span>
                    </div>
                    <p className="text-blue-100 text-sm font-medium">
                        {isToday 
                            ? t('totalOrdersToday') 
                            : isSingleDay
                                ? `${t('totalOrders')} - ${formatDateRange()}`
                                : `${t('totalOrders')} - ${formatDateRange()}`
                        }
                    </p>
                </div>

                {/* Total Discount Card */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Tag size={24} />
                        </div>
                        <span className="text-3xl font-bold">{formatCurrency(dailyReport?.totalDiscount || 0)}</span>
                    </div>
                    <p className="text-red-100 text-sm font-medium">
                        {isToday 
                            ? t('totalDiscountToday') 
                            : isSingleDay
                                ? `${t('totalDiscount')} - ${formatDateRange()}`
                                : `${t('totalDiscount')} - ${formatDateRange()}`
                        }
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center text-gray-800 dark:text-gray-100">
                        <BarChart className="mr-2" /> 
                        {isToday 
                            ? t('todaysTransactions') 
                            : isSingleDay
                                ? `${t('transactions')} - ${formatDateRange()}`
                                : `${t('transactions')} - ${formatDateRange()}`
                        }
                    </h2>
                    
                    <div className="flex items-center gap-4">
                        {/* Export Button */}
                        <button
                            onClick={handleExportToExcel}
                            disabled={loading || selectedDates.length === 0 || !dailyReport || dailyReport.orders?.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                loading || selectedDates.length === 0 || !dailyReport || dailyReport.orders?.length === 0
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 shadow-md hover:shadow-lg'
                            }`}
                        >
                            <Download size={18} />
                            {t('exportToExcel') || 'Export to Excel'}
                        </button>
                        
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
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading')}</div>
                ) : dailyReport?.orders?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {t('noTransactions') || 'No transactions found for selected dates'}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('date')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('time')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orderId')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('status') || 'Status'}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('amount')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('discount')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('payment')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {dailyReport?.orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(order.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">#{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order.status === 'REFUNDED' ? (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                        <RotateCcw size={12} />
                                                        {t('refunded') || 'Refunded'}
                                                    </span>
                                                ) : order.status === 'PARTIALLY_REFUNDED' ? (
                                                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                        <RotateCcw size={12} />
                                                        {t('partiallyRefunded') || 'Partially Refunded'}
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                        <CheckCircle2 size={12} />
                                                        {t('completed') || 'Completed'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-col">
                                                    <span className={`${
                                                        order.status === 'REFUNDED' 
                                                            ? 'line-through text-gray-400 dark:text-gray-500' 
                                                            : 'text-gray-900 dark:text-gray-100'
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {parseFloat(order.discount) > 0 ? (
                                                    <span className="text-red-600 dark:text-red-400 font-semibold">-{formatCurrency(order.discount)}</span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.paymentMethod}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.limit + 1} {t('to') || 'to'}{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)} {t('of') || 'of'}{' '}
                                    {pagination.totalCount} {t('results') || 'results'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={!pagination.hasPreviousPage}
                                        className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center gap-2 ${
                                            !pagination.hasPreviousPage
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <ChevronLeft size={18} />
                                        {t('previous') || 'Previous'}
                                    </button>
                                    
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
                                                    className={`px-3 py-2 rounded-lg ${
                                                        pagination.page === pageNum
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
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={!pagination.hasNextPage}
                                        className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center gap-2 ${
                                            !pagination.hasNextPage
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
        </div>
    );
};

export default Reports;

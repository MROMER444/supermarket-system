import { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

const MultiDatePicker = ({ selectedDates = [], onChange, maxDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [rangeStart, setRangeStart] = useState(null);
    const [isRangeMode, setIsRangeMode] = useState(false);
    const calendarRef = useRef(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse maxDate properly to avoid timezone issues
    let maxDateObj;
    if (maxDate) {
        const [year, month, day] = maxDate.split('-').map(Number);
        maxDateObj = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
        maxDateObj = today;
        maxDateObj.setHours(23, 59, 59, 999);
    }

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsRangeMode(false);
                setRangeStart(null);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const formatDate = (date) => {
        // Use local date to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const isDateSelected = (date) => {
        const dateStr = formatDate(date);
        return selectedDates.includes(dateStr);
    };

    const isDateDisabled = (date) => {
        // Compare dates without time
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const maxDateOnly = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate());
        return dateOnly > maxDateOnly;
    };

    const toggleDate = (date) => {
        if (isDateDisabled(date)) return;
        
        const dateStr = formatDate(date);
        
        if (isRangeMode && rangeStart) {
            // Range selection mode
            const start = rangeStart < date ? rangeStart : date;
            const end = rangeStart < date ? date : rangeStart;
            const datesInRange = getDatesInRange(start, end);
            const newDates = [...new Set([...selectedDates, ...datesInRange])].sort();
            onChange(newDates);
            setIsRangeMode(false);
            setRangeStart(null);
        } else {
            // Single date toggle
            const newDates = isDateSelected(date)
                ? selectedDates.filter(d => d !== dateStr)
                : [...selectedDates, dateStr].sort();
            
            onChange(newDates);
        }
    };

    const handleDateClick = (date) => {
        if (isDateDisabled(date)) return;
        
        if (isRangeMode && !rangeStart) {
            // Start range selection
            setRangeStart(date);
        } else {
            toggleDate(date);
        }
    };

    const getDatesInRange = (startDate, endDate) => {
        const dates = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            dates.push(formatDate(current));
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    };

    const removeDate = (dateStr, e) => {
        e.stopPropagation();
        const newDates = selectedDates.filter(d => d !== dateStr);
        onChange(newDates);
    };

    const clearAll = () => {
        onChange([]);
        setIsRangeMode(false);
        setRangeStart(null);
    };

    // Quick date presets
    const applyPreset = (preset) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let dates = [];

        switch (preset) {
            case 'today':
                dates = [formatDate(today)];
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                dates = [formatDate(yesterday)];
                break;
            case 'last7days':
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    if (date <= maxDateObj) {
                        dates.push(formatDate(date));
                    }
                }
                break;
            case 'last30days':
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    if (date <= maxDateObj) {
                        dates.push(formatDate(date));
                    }
                }
                break;
            case 'thisMonth':
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                for (let d = new Date(firstDay); d <= lastDay && d <= maxDateObj; d.setDate(d.getDate() + 1)) {
                    dates.push(formatDate(new Date(d)));
                }
                break;
            case 'lastMonth':
                const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthLast = new Date(today.getFullYear(), today.getMonth(), 0);
                for (let d = new Date(lastMonthFirst); d <= lastMonthLast && d <= maxDateObj; d.setDate(d.getDate() + 1)) {
                    dates.push(formatDate(new Date(d)));
                }
                break;
            default:
                return;
        }

        onChange(dates.sort());
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        if (nextMonth <= maxDateObj) {
            setCurrentMonth(nextMonth);
        }
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    const days = getDaysInMonth(currentMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const isDateInRange = (date) => {
        if (!isRangeMode || !rangeStart) return false;
        const dateStr = formatDate(date);
        const startStr = formatDate(rangeStart);
        return dateStr === startStr;
    };

    return (
        <div className="relative" ref={calendarRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {selectedDates.length === 0
                        ? 'Select dates'
                        : selectedDates.length === 1
                        ? selectedDates[0]
                        : `${selectedDates.length} dates selected`
                    }
                </span>
                {selectedDates.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                        {selectedDates.length}
                    </span>
                )}
            </button>

            {/* Selected Dates Tags */}
            {selectedDates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-w-md">
                    {selectedDates.slice(0, 5).map((dateStr) => (
                        <span
                            key={dateStr}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            {dateStr}
                            <button
                                onClick={(e) => removeDate(dateStr, e)}
                                className="hover:bg-blue-300 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                aria-label="Remove date"
                            >
                                <X size={14} className="text-blue-800 dark:text-blue-300" />
                            </button>
                        </span>
                    ))}
                    {selectedDates.length > 5 && (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                            +{selectedDates.length - 5} more
                        </span>
                    )}
                </div>
            )}

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 w-[380px] overflow-hidden">
                    {/* Quick Presets */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Quick Select:</div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => applyPreset('today')}
                                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => applyPreset('yesterday')}
                                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                Yesterday
                            </button>
                            <button
                                onClick={() => applyPreset('last7days')}
                                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                Last 7 Days
                            </button>
                            <button
                                onClick={() => applyPreset('last30days')}
                                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                Last 30 Days
                            </button>
                            <button
                                onClick={() => applyPreset('thisMonth')}
                                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => applyPreset('lastMonth')}
                                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                Last Month
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </h3>
                                <button
                                    onClick={goToToday}
                                    className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                >
                                    Today
                                </button>
                            </div>
                            <button
                                onClick={goToNextMonth}
                                disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > maxDateObj}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next month"
                            >
                                <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Range Mode Toggle */}
                        <div className="mb-3 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rangeMode"
                                checked={isRangeMode}
                                onChange={(e) => {
                                    setIsRangeMode(e.target.checked);
                                    setRangeStart(null);
                                }}
                                className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700"
                            />
                            <label htmlFor="rangeMode" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                Range Selection Mode
                            </label>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((date, index) => {
                                if (!date) {
                                    return <div key={`empty-${index}`} className="aspect-square" />;
                                }

                                const dateStr = formatDate(date);
                                const isSelected = isDateSelected(date);
                                const isDisabled = isDateDisabled(date);
                                const todayStr = formatDate(today);
                                const isToday = dateStr === todayStr;
                                const isRangeStart = isRangeMode && rangeStart && formatDate(rangeStart) === dateStr;

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => handleDateClick(date)}
                                        disabled={isDisabled}
                                        className={`
                                            aspect-square rounded-lg text-sm font-medium transition-all relative
                                            ${isSelected
                                                ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md'
                                                : isRangeStart
                                                ? 'bg-blue-400 dark:bg-blue-600 text-white ring-2 ring-blue-500 dark:ring-blue-400'
                                                : isDisabled
                                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }
                                            ${isToday && !isSelected ? 'ring-2 ring-blue-300 dark:ring-blue-500 font-bold' : ''}
                                        `}
                                    >
                                        {date.getDate()}
                                        {isToday && !isSelected && (
                                            <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={clearAll}
                                disabled={selectedDates.length === 0}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                Clear All ({selectedDates.length})
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedDates.length} selected
                                </span>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsRangeMode(false);
                                        setRangeStart(null);
                                    }}
                                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm font-medium transition-colors shadow-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiDatePicker;

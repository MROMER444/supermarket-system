import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [discount, setDiscount] = useState(0);
    const [toast, setToast] = useState(null);
    const searchInputRef = useRef(null);
    const { user, logout } = useAuth();
    const { formatCurrency } = useSettings();
    const { t } = useLanguage();

    useEffect(() => {
        if (user?.accessToken) {
            fetchProducts();
        }
    }, [search, user?.accessToken]);

    // Focus search on mount
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Barcode scanner detection
    useEffect(() => {
        let barcodeBuffer = '';
        let lastKeyTime = Date.now();

        const handleKeyPress = (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;

            // If more than 100ms between keys, reset buffer (human typing is slower)
            if (timeDiff > 100) {
                barcodeBuffer = '';
            }

            lastKeyTime = currentTime;

            // If Enter key is pressed
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('🔍 Enter pressed, search value:', search);
                console.log('📦 Products found:', products.length);

                if (search.trim()) {
                    const trimmedSearch = search.trim();
                    const exactMatch = products.find(p => p.barcode === trimmedSearch);

                    if (exactMatch) {
                        console.log('✅ Exact barcode match found:', exactMatch.name);
                        addToCart(exactMatch);
                        setSearch('');
                    } else if (products.length === 1) {
                        console.log('✅ Single product match found:', products[0].name);
                        addToCart(products[0]);
                        setSearch('');
                    } else {
                        console.log('⚠️ No exact match or multiple products found');
                    }
                }
                return;
            }

            // Build barcode buffer for scanner detection
            if (e.key.length === 1) {
                barcodeBuffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [search, products]);

    const fetchProducts = async () => {
        if (!user?.accessToken) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/products?search=${search}&limit=1000`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            // Handle both old format (array) and new format (object with products array)
            if (Array.isArray(response.data)) {
                setProducts(response.data);
            } else if (response.data.products) {
                setProducts(response.data.products);
            } else {
                setProducts([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: 1,
                subtotal: parseFloat(product.price)
            }]);
        }

        // Visual feedback
        console.log(`✅ Added to cart: ${product.name} (${product.barcode})`);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.productId === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity, subtotal: newQuantity * item.price };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const calculateTotalAfterDiscount = () => {
        const subtotal = calculateTotal();
        const discountAmount = parseFloat(discount) || 0;
        return Math.max(0, subtotal - discountAmount);
    };

    const handleCheckout = async () => {
        try {
            const orderData = {
                items: cart,
                totalAmount: calculateTotalAfterDiscount(),
                discount: parseFloat(discount) || 0,
                tax: 0,
                paymentMethod,
            };

            const response = await axios.post('http://localhost:5000/api/pos/checkout', orderData, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });

            // Get order ID from response (handle different response formats)
            const orderId = response.data?.id || response.data?.order?.id;
            
            // Show success toast
            setToast({ message: t('orderPlacedSuccessfully'), type: 'success' });
            setCart([]);
            setDiscount(0); // Reset discount
            setIsCheckoutModalOpen(false);
            fetchProducts(); // Refresh stock

            // Auto-print receipt if order ID is available
            if (orderId) {
                // Use setTimeout to ensure the modal closes before printing
                setTimeout(async () => {
                    try {
                        console.log(`Auto-printing receipt for order ${orderId}...`);
                        await axios.post(
                            `http://localhost:5000/api/print/receipt/${orderId}`,
                            {},
                            {
                                headers: { Authorization: `Bearer ${user.accessToken}` }
                            }
                        );
                        console.log('Receipt printed successfully');
                    } catch (printError) {
                        // Don't fail checkout if printing fails - just log it
                        console.error('Auto-print failed (non-critical):', printError);
                        const printErrorMessage = printError.response?.data?.message || printError.message;
                        console.error('Print error details:', printErrorMessage);
                        // Optionally show a warning toast, but don't interrupt the checkout flow
                        // setToast({ message: t('orderPlacedSuccessfully') + ' ' + (t('printFailed') || '(Print failed)'), type: 'warning' });
                    }
                }, 500); // Small delay to ensure modal closes first
            } else {
                console.warn('Order ID not found in response:', response.data);
                console.warn('Skipping auto-print');
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            const errorMessage = error.response?.data?.message || t('checkoutFailed') || 'Checkout failed';
            
            // If user not found, prompt to re-login
            if (errorMessage.includes('User not found') || errorMessage.includes('refresh your authentication')) {
                if (window.confirm(t('sessionExpired') || 'Your session has expired. Please log out and log back in. Would you like to log out now?')) {
                    logout();
                    window.location.href = '/login';
                }
            } else {
                // Show error toast
                setToast({ message: `${t('checkoutFailed')}: ${errorMessage}`, type: 'error' });
            }
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        // Trim the search input to remove any whitespace
        const trimmedSearch = search.trim();

        // Check if we have an exact barcode match
        const exactBarcodeMatch = products.find(p => p.barcode === trimmedSearch);

        if (exactBarcodeMatch) {
            // Exact barcode match found - add to cart
            addToCart(exactBarcodeMatch);
            setSearch('');
            // Refocus the search input for next scan
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        } else if (products.length === 1) {
            // Only one product found in search results - add it
            addToCart(products[0]);
            setSearch('');
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            {/* Left Side: Products */}
            <div className="w-2/3 p-6 flex flex-col">
                <div className="mb-6 relative">
                    <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t('scanBarcode')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full p-4 pl-14 pr-14 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 text-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                dir="ltr"
                            />
                            <Search className="absolute left-5 top-5 text-gray-400 dark:text-gray-500" size={24} />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-5 top-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-10 text-gray-600 dark:text-gray-400">{t('loading')}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart */}
            <div className="w-1/3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                            <ShoppingCart className="text-white" size={20} />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {t('currentOrder')}
                        </span>
                        {cart.length > 0 && (
                            <span className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                                {cart.length}
                            </span>
                        )}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 mt-20">
                            <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl mb-4">
                                <ShoppingCart size={48} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-lg font-medium">{t('cartEmpty')}</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.productId} className="bg-gradient-to-r from-white to-blue-50/50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-600 shadow-md hover:shadow-lg transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{item.name}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.productId)} 
                                        className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-700">
                                        <button 
                                            onClick={() => updateQuantity(item.productId, -1)} 
                                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="px-4 font-bold text-gray-800 dark:text-gray-100 min-w-[3rem] text-center">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.productId, 1)} 
                                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <p className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                        {formatCurrency(item.subtotal)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
                    <div className="flex justify-between items-center mb-3 text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t('subtotal')}</span>
                        <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6 p-4 bg-white dark:bg-gray-700 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('total')}</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {formatCurrency(calculateTotal())}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsCheckoutModalOpen(true)}
                        disabled={cart.length === 0}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 ${
                            cart.length === 0 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl btn-modern'
                        }`}
                    >
                        {t('proceedToCheckout')}
                    </button>
                </div>
            </div>

            <Modal isOpen={isCheckoutModalOpen} onClose={() => {
                setIsCheckoutModalOpen(false);
                setDiscount(0); // Reset discount when closing modal
            }} title={t('checkout')}>
                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-blue-100 dark:border-blue-800">
                        <div className="text-center mb-4">
                            <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('subtotal')}</p>
                            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">
                                {formatCurrency(calculateTotal())}
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {t('discount')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 text-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="0"
                            />
                        </div>

                        {discount > 0 && (
                            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('discount')}:</span>
                                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        -{formatCurrency(parseFloat(discount) || 0)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="text-center pt-4 border-t border-blue-200 dark:border-blue-700">
                            <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('totalAmount')}</p>
                            <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                {formatCurrency(calculateTotalAfterDiscount())}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('paymentMethod')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                                    paymentMethod === 'CASH' 
                                        ? 'border-blue-600 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg shadow-blue-500/30' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className={`p-3 rounded-xl ${paymentMethod === 'CASH' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    <Banknote size={32} className={paymentMethod === 'CASH' ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
                                </div>
                                <span className={`font-bold ${paymentMethod === 'CASH' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>{t('cash')}</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('CARD')}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                                    paymentMethod === 'CARD' 
                                        ? 'border-purple-600 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 shadow-lg shadow-purple-500/30' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className={`p-3 rounded-xl ${paymentMethod === 'CARD' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    <CreditCard size={32} className={paymentMethod === 'CARD' ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
                                </div>
                                <span className={`font-bold ${paymentMethod === 'CARD' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>{t('card')}</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 btn-modern"
                    >
                        {t('completeOrder')}
                    </button>
                </div>
            </Modal>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                    duration={5000}
                />
            )}
        </div>
    );
};

export default POS;

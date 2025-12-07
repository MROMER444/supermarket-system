import { Plus, Package } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useState } from 'react';

const ProductCard = ({ product, onAddToCart }) => {
    const { formatCurrency } = useSettings();
    const [isAdding, setIsAdding] = useState(false);
    
    const handleClick = () => {
        setIsAdding(true);
        onAddToCart(product);
        setTimeout(() => setIsAdding(false), 300);
    };
    
    return (
        <div 
            className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full card-hover group relative overflow-hidden"
            onClick={handleClick}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{product.barcode}</p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Package size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                
                {product.quantity !== undefined && (
                    <div className="mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 flex-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`}>
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        product.quantity <= (product.minQuantity || 5) 
                                            ? 'bg-gradient-to-r from-red-400 to-red-600' 
                                            : 'bg-gradient-to-r from-green-400 to-green-600'
                                    }`}
                                    style={{ width: `${Math.min((product.quantity / (product.quantity + 20)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{product.quantity}</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="relative z-10 flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 font-bold text-xl">
                    {formatCurrency(product.price)}
                </span>
                <button 
                    className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2.5 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 ${
                        isAdding ? 'animate-pulse' : ''
                    }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                >
                    <Plus size={18} className={isAdding ? 'rotate-90 transition-transform duration-300' : ''} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;

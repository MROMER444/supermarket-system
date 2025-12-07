import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const styles = {
        success: {
            bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
            icon: CheckCircle,
            shadow: 'shadow-green-500/50'
        },
        error: {
            bg: 'bg-gradient-to-r from-red-500 to-rose-600',
            icon: XCircle,
            shadow: 'shadow-red-500/50'
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
            icon: CheckCircle,
            shadow: 'shadow-blue-500/50'
        }
    };

    const style = styles[type] || styles.success;
    const Icon = style.icon;

    return (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className={`${style.bg} text-white px-6 py-4 rounded-2xl shadow-2xl ${style.shadow} flex items-center gap-4 min-w-[320px] max-w-md backdrop-blur-sm border border-white/20 relative overflow-hidden`}>
                {/* Animated background shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                
                <div className="relative z-10 p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Icon size={24} className="flex-shrink-0" />
                </div>
                <p className="flex-1 font-semibold text-sm">{message}</p>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 hover:bg-white/30 rounded-lg p-1.5 transition-all duration-200 hover:rotate-90"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Toast;

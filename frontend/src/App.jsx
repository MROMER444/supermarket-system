import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { DarkModeProvider } from './context/DarkModeContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import POS from './pages/POS';
import Orders from './pages/Orders';
import Refunded from './pages/Refunded';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

const Layout = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    
    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className={`flex-1 flex flex-col ${isRTL ? 'mr-64' : 'ml-64'}`}>
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-16 bg-gray-100 dark:bg-gray-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <DarkModeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <SettingsProvider>
                        <Router
                        future={{
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }}
                    >
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                                {/* Routes accessible to all authenticated users */}
                                <Route path="/" element={<AdminDashboard />} />
                                <Route path="/pos" element={<POS />} />
                                <Route path="/orders" element={<Orders />} />
                                <Route path="/refunded" element={<Refunded />} />
                                <Route path="/reports" element={<Reports />} />
                                
                                {/* Admin-only routes */}
                                <Route 
                                    path="/users" 
                                    element={
                                        <PrivateRoute roles={['ADMIN']}>
                                            <UserManagement />
                                        </PrivateRoute>
                                    } 
                                />
                                <Route 
                                    path="/inventory" 
                                    element={
                                        <PrivateRoute roles={['ADMIN']}>
                                            <Inventory />
                                        </PrivateRoute>
                                    } 
                                />
                                <Route 
                                    path="/categories" 
                                    element={
                                        <PrivateRoute roles={['ADMIN']}>
                                            <Categories />
                                        </PrivateRoute>
                                    } 
                                />
                                <Route 
                                    path="/suppliers" 
                                    element={
                                        <PrivateRoute roles={['ADMIN']}>
                                            <Suppliers />
                                        </PrivateRoute>
                                    } 
                                />
                                <Route 
                                    path="/settings" 
                                    element={
                                        <PrivateRoute roles={['ADMIN']}>
                                            <Settings />
                                        </PrivateRoute>
                                    } 
                                />
                            </Route>
                            
                            {/* Redirect unauthorized access attempts */}
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </Router>
                </SettingsProvider>
            </AuthProvider>
        </LanguageProvider>
        </DarkModeProvider>
    );
}

export default App;

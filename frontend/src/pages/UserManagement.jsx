import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, UserPlus, Mail, Lock, User, CheckCircle2, AlertCircle, Loader2, Save, Users as UsersIcon, Calendar, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const UserManagement = () => {
    const { user } = useAuth();
    const { t, formatDate } = useLanguage();
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [currentEditingUser, setCurrentEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '', role: 'CASHIER' });
    const [savingUser, setSavingUser] = useState(false);
    const [userSuccess, setUserSuccess] = useState(false);
    const [userError, setUserError] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingUserId, setDeletingUserId] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/auth/users', {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.accessToken) {
            fetchUsers();
        }
    }, [user?.accessToken]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSavingUser(true);
        setUserSuccess(false);
        setUserError('');
        try {
            await axios.post('http://localhost:5000/api/auth/register', userFormData, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setUserSuccess(true);
            setTimeout(() => {
                setIsUserModalOpen(false);
                resetUserForm();
                fetchUsers(); // Refresh user list
            }, 1500);
        } catch (error) {
            console.error('Error creating user:', error);
            const errorMessage = error.response?.data?.message || t('failedToCreateUser');
            setUserError(errorMessage);
        } finally {
            setSavingUser(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setSavingUser(true);
        setUserSuccess(false);
        setUserError('');
        try {
            const updateData = { ...userFormData };
            // Remove password if empty (don't update password)
            if (!updateData.password || updateData.password.trim() === '') {
                delete updateData.password;
            }
            
            await axios.put(`http://localhost:5000/api/auth/users/${currentEditingUser.id}`, updateData, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setUserSuccess(true);
            setTimeout(() => {
                setIsUserModalOpen(false);
                resetUserForm();
                fetchUsers(); // Refresh user list
            }, 1500);
        } catch (error) {
            console.error('Error updating user:', error);
            const errorMessage = error.response?.data?.message || t('failedToUpdateUser');
            setUserError(errorMessage);
        } finally {
            setSavingUser(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm(t('deleteUserConfirm'))) {
            return;
        }

        setDeletingUserId(userId);
        try {
            await axios.delete(`http://localhost:5000/api/auth/users/${userId}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            fetchUsers(); // Refresh user list
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMessage = error.response?.data?.message || t('failedToDeleteUser');
            alert(errorMessage);
        } finally {
            setDeletingUserId(null);
        }
    };

    const openEditModal = (userItem) => {
        setCurrentEditingUser(userItem);
        setUserFormData({
            name: userItem.name,
            email: userItem.email,
            password: '', // Empty for edit
            role: userItem.role,
        });
        setIsUserModalOpen(true);
    };

    const openCreateModal = () => {
        setCurrentEditingUser(null);
        resetUserForm();
        setIsUserModalOpen(true);
    };

    const resetUserForm = () => {
        setCurrentEditingUser(null);
        setUserFormData({ name: '', email: '', password: '', role: 'CASHIER' });
        setUserError('');
        setUserSuccess(false);
    };

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                            {t('userManagement')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('createNewUser')} - {t('addUser')}</p>
                    </div>
                    <button 
                        onClick={openCreateModal} 
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>{t('createNewUser')}</span>
                    </button>
                </div>

                {/* Statistics Card */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-xl">
                                <UsersIcon size={32} />
                            </div>
                            <div>
                                <p className="text-purple-100 text-sm font-medium mb-1">{t('totalUsers')}</p>
                                <p className="text-2xl font-bold">{users.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                        <UserPlus className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            {t('userManagement')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {t('createNewUser')} - {t('addUser')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('userManagementDescription')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('userList')}</h2>
                </div>
                
                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="animate-spin mx-auto mb-4 text-purple-600 dark:text-purple-400" size={48} />
                        <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-block p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl mb-4">
                            <UsersIcon className="text-purple-500 dark:text-purple-400" size={64} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('noUsersYet')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('getStartedCreateUser')}</p>
                        <button
                            onClick={openCreateModal}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                        >
                            <Plus size={20} />
                            <span>{t('createNewUser')}</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((userItem) => (
                            <div 
                                key={userItem.id}
                                className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-700 dark:to-purple-900/30 rounded-xl border border-gray-100 dark:border-gray-600 p-5 hover:shadow-lg transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`p-3 rounded-xl ${
                                            userItem.role === 'ADMIN' 
                                                ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                                                : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                        }`}>
                                            <User className="text-white" size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                                                {userItem.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {userItem.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => openEditModal(userItem)} 
                                            className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                            title={t('editUser')}
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(userItem.id)} 
                                            disabled={deletingUserId === userItem.id || userItem.id === user.id}
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={userItem.id === user.id ? t('cannotDeleteOwnAccount') : t('deleteUser')}
                                        >
                                            {deletingUserId === userItem.id ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            userItem.role === 'ADMIN' 
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' 
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                                        }`}>
                                            {userItem.role === 'ADMIN' ? t('admin') : t('cashier')}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar size={14} />
                                        <span>
                                            {userItem.createdAt ? (() => {
                                                const date = new Date(userItem.createdAt);
                                                if (isNaN(date.getTime())) return t('dateNotAvailable');
                                                return formatDate(date);
                                            })() : (
                                                t('dateNotAvailable')
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User Creation/Edit Modal */}
            <Modal 
                isOpen={isUserModalOpen} 
                onClose={() => {
                    setIsUserModalOpen(false);
                    resetUserForm();
                }} 
                title={currentEditingUser ? t('editUserTitle') : t('createNewUser')}
            >
                <form onSubmit={currentEditingUser ? handleUpdateUser : handleCreateUser} className="space-y-5">
                    {userSuccess && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                {currentEditingUser ? t('userUpdatedSuccessfully') : t('userCreatedSuccessfully')}
                            </span>
                        </div>
                    )}
                    
                    {userError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                            <span className="text-sm text-red-700 dark:text-red-300 font-medium">{userError}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('userName')}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="text" 
                                value={userFormData.name} 
                                onChange={(e) => {
                                    setUserFormData({ ...userFormData, name: e.target.value });
                                    setUserError('');
                                }} 
                                required 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('enterUserName')}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('userEmail')}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="email" 
                                value={userFormData.email} 
                                onChange={(e) => {
                                    setUserFormData({ ...userFormData, email: e.target.value });
                                    setUserError('');
                                }} 
                                required 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('enterUserEmail')}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {currentEditingUser ? t('passwordOptional') : t('userPassword')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="password" 
                                value={userFormData.password} 
                                onChange={(e) => {
                                    setUserFormData({ ...userFormData, password: e.target.value });
                                    setUserError('');
                                }} 
                                required={!currentEditingUser}
                                minLength={currentEditingUser ? 0 : 6}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={currentEditingUser ? t('leaveEmptyToKeepPassword') : t('enterUserPassword')}
                            />
                        </div>
                        {currentEditingUser ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('leaveEmptyToKeepPassword')}</p>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('userRole')}
                        </label>
                        <div className="relative">
                            <UsersIcon className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
                            <select 
                                value={userFormData.role} 
                                onChange={(e) => {
                                    setUserFormData({ ...userFormData, role: e.target.value });
                                    setUserError('');
                                }} 
                                required 
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100"
                            >
                                <option value="CASHIER">{t('cashier')}</option>
                                <option value="ADMIN">{t('admin')}</option>
                            </select>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={savingUser}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {savingUser ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>{t('saving')}</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>{currentEditingUser ? t('updateUser') : t('createUser')}</span>
                            </>
                        )}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;

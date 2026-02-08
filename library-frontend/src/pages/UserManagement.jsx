// src/pages/UserManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    UserIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    PlusIcon, 
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { userService } from '../api/userService';
import Modal from '../components/common/Modal';
import UserForm from '../components/user/UserForm'; // Ensure path is correct
import '../assets/css/ManagementPages.css'; 

const UserManagement = () => {
    // --- State ---
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null); // Modal error ke liye

    // UI State
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'staff', 'public'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    
    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // null = New User

    // --- Fetch Data ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Users aur Roles dono parallel fetch karein
            const [usersData, rolesData] = await Promise.all([
                userService.getAllUsers(),
                userService.getAllRoles()
            ]);
            setUsers(usersData || []);
            setRoles(rolesData || []);
        } catch (err) {
            console.error("Error fetching users/roles:", err);
            setError("Failed to load user data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Dynamic Filtering Logic ---
    const filteredUsers = useMemo(() => {
        let data = users;

        // 1. Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(u => 
                u.username.toLowerCase().includes(lowerTerm) ||
                (u.email && u.email.toLowerCase().includes(lowerTerm)) ||
                (u.full_name && u.full_name.toLowerCase().includes(lowerTerm))
            );
        }

        // 2. Status Filter
        if (filterStatus !== 'All') {
            data = data.filter(u => u.status === filterStatus);
        }

        // 3. Tab Filter (Dynamic Role Handling)
        if (activeTab === 'staff') {
            data = data.filter(u => {
                const roleName = u.role?.name?.toLowerCase() || u.role?.toLowerCase() || '';
                return roleName !== 'member'; 
            });
        } else if (activeTab === 'public') {
            data = data.filter(u => {
                const roleName = u.role?.name?.toLowerCase() || u.role?.toLowerCase() || '';
                return roleName === 'member';
            });
        }

        return data;
    }, [users, searchTerm, filterStatus, activeTab]);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter(u => u.status === 'Active').length;
        const restricted = users.filter(u => {
            const r = u.role?.name?.toLowerCase() || u.role?.toLowerCase();
            return r !== 'member';
        }).length;
        return { total, active, restricted };
    }, [users]);

    // --- Handlers ---
    const handleAddUser = () => {
        setEditingUser(null); // Reset for new user
        setActionError(null);
        setIsEditModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setActionError(null);
        setIsEditModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await userService.deleteUser(userId);
            // Optimistic update
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            alert(err.detail || "Failed to delete user.");
        }
    };

    // --- JSX Helpers ---
    const getRoleBadgeColor = (roleName) => {
        const r = roleName?.toLowerCase() || '';
        if (r.includes('admin')) return 'bg-purple-100 text-purple-700 ring-purple-600/20';
        if (r === 'student') return 'bg-blue-100 text-blue-700 ring-blue-600/20';
        if (r === 'editor') return 'bg-indigo-100 text-indigo-700 ring-indigo-600/20';
        if (r === 'member') return 'bg-slate-100 text-slate-700 ring-slate-600/20';
        return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <UserGroupIcon className="h-8 w-8 text-indigo-600" />
                        Identity Management
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Control system access levels and user accounts.</p>
                </div>
                <button 
                    onClick={handleAddUser}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95"
                >
                    <PlusIcon className="h-5 w-5" /> Provision New User
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Entities</p>
                    <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
                    <p className="text-xs font-bold text-slate-400 uppercase">Active Sessions</p>
                    <p className="text-3xl font-black text-emerald-600">{stats.active}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-orange-500">
                    <p className="text-xs font-bold text-slate-400 uppercase">Managed Users (Staff/Students)</p>
                    <p className="text-3xl font-black text-orange-600">{stats.restricted}</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-200/60 rounded-xl">
                        {['all', 'staff', 'public'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                                    activeTab === tab 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab === 'all' ? 'Global List' : tab === 'staff' ? 'Staff / Managed' : 'Public Members'}
                            </button>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-grow">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Identify by username..." 
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">Any Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading directory...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No records found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Security ID</th>
                                    <th className="px-6 py-4">Account Profile</th>
                                    <th className="px-6 py-4 text-center">Authorization Level</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            #{String(user.id).padStart(3, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg uppercase">
                                                    {user.username.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{user.username}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadgeColor(user.role?.name || user.role)}`}>
                                                {(user.role?.name || user.role || 'N/A').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                <span className={`h-2 w-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleEditUser(user)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Identity">
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Revoke Access">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- Add / Edit User Modal --- */}
            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                title={editingUser ? 'Identity Update' : 'New User Provisioning'} 
                size="max-w-2xl"
            >
               <UserForm 
                 key={editingUser?.id || 'new'}
                 initialData={editingUser} 
                 roles={roles} 
                 // 🔥 FIX: Ye prop missing tha, ab update sahi chalega
                 isEditing={!!editingUser}
                 onError={(message) => setActionError(message)}
                 onSubmitSuccess={() => { 
                    fetchData(); 
                    setIsEditModalOpen(false); 
                 }} 
                 onCancel={() => setIsEditModalOpen(false)} 
               />

               {/* Error Message Display */}
               {actionError && (
                 <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl text-center font-medium animate-pulse">
                   ⚠️ {actionError}
                 </div>
               )}
            </Modal>

        </div>
    );
};

export default UserManagement;
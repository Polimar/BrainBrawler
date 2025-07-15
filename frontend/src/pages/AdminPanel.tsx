import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FiUsers, FiSearch, FiEdit2, FiTrash2, FiSave, FiXCircle, FiChevronsLeft, FiChevronLeft, FiChevronRight, FiChevronsRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
  accountType: 'FREE' | 'PREMIUM' | 'ADMIN';
  isOnline: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: { page, limit: 10, search },
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch users.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, [currentPage]);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        if(currentPage !== 1) setCurrentPage(1);
        else fetchUsers(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (pagination?.pages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
        await api.put(`/admin/users/${editingUser.id}`, {
            username: editingUser.username,
            email: editingUser.email,
            accountType: editingUser.accountType,
        });
        toast.success('User updated successfully!');
        setEditingUser(null);
        fetchUsers(currentPage, searchTerm);
    } catch (error) {
        toast.error('Failed to update user.');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('User deleted successfully!');
            fetchUsers(currentPage, searchTerm);
        } catch (error) {
            toast.error('Failed to delete user.');
        }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
    }
  };
  
  const renderPagination = () => {
    if (!pagination || pagination.total <= 10) return null;
    
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage: number, endPage: number;

    if (pagination.pages <= maxPagesToShow) {
        startPage = 1;
        endPage = pagination.pages;
    } else {
        const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrentPage) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrentPage >= pagination.pages) {
            startPage = pagination.pages - maxPagesToShow + 1;
            endPage = pagination.pages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrentPage;
            endPage = currentPage + maxPagesAfterCurrentPage;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="flex items-center justify-center space-x-2 mt-4">
            <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="p-2 rounded-md bg-gray-700 disabled:opacity-50"><FiChevronsLeft /></button>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md bg-gray-700 disabled:opacity-50"><FiChevronLeft /></button>
            {pageNumbers.map(num => (
                <button key={num} onClick={() => handlePageChange(num)} className={`px-4 py-2 rounded-md ${currentPage === num ? 'bg-blue-600' : 'bg-gray-700'}`}>{num}</button>
            ))}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.pages} className="p-2 rounded-md bg-gray-700 disabled:opacity-50"><FiChevronRight /></button>
            <button onClick={() => handlePageChange(pagination.pages)} disabled={currentPage === pagination.pages} className="p-2 rounded-md bg-gray-700 disabled:opacity-50"><FiChevronsRight /></button>
        </div>
    );
  };


  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-4 flex items-center"><FiUsers className="mr-2"/>Admin Panel - User Management</h1>
      
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 bg-gray-700 rounded-lg"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead>
              <tr className="bg-gray-900">
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Account Type</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Joined</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700">
                  {editingUser?.id === user.id ? (
                    <>
                      <td className="p-3"><input type="text" name="username" value={editingUser.username} onChange={handleInputChange} className="bg-gray-600 p-1 rounded w-full"/></td>
                      <td className="p-3"><input type="email" name="email" value={editingUser.email} onChange={handleInputChange} className="bg-gray-600 p-1 rounded w-full"/></td>
                      <td className="p-3">
                        <select name="accountType" value={editingUser.accountType} onChange={handleInputChange} className="bg-gray-600 p-1 rounded w-full">
                          <option value="FREE">FREE</option>
                          <option value="PREMIUM">PREMIUM</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3" colSpan={2}></td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                            <button onClick={handleSave} className="text-green-400 hover:text-green-300"><FiSave size={18} /></button>
                            <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300"><FiXCircle size={18} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3">{user.username}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.accountType === 'ADMIN' ? 'bg-purple-500 text-white' :
                          user.accountType === 'PREMIUM' ? 'bg-yellow-500 text-black' :
                          'bg-gray-600 text-white'
                        }`}>
                          {user.accountType}
                        </span>
                      </td>
                      <td className="p-3">{user.isOnline ? <span className="text-green-400">Online</span> : <span className="text-gray-400">Offline</span>}</td>
                      <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(user)} className="text-blue-400 hover:text-blue-300"><FiEdit2 size={18} /></button>
                          <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300"><FiTrash2 size={18} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {renderPagination()}
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 
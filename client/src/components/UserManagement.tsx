import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AdminUser, getAdminUsers, createAdminUser, updateAdminUser, setInitialPassword } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'REQUESTER',
    active: true,
    initialPassword: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const isMobile = useMediaQuery('(max-width: 767.98px)');

  const fetchUsers = async (currentSearch: string = search, currentRole: string = roleFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(currentSearch || undefined, currentRole || undefined);
      setUsers(data.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return (
      <svg className="ms-1 text-muted opacity-25" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
    );
    return (
      <span className="ms-1 text-zen-primary">
        {sortOrder === 'asc' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        )}
      </span>
    );
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let valA = a[sortBy as keyof AdminUser];
      let valB = b[sortBy as keyof AdminUser];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortBy, sortOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isPasswordModalOpen) {
          setIsPasswordModalOpen(false);
          setIsEditModalOpen(true);
        }
      }
    };
    if (isCreateModalOpen || isEditModalOpen || isPasswordModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isEditModalOpen, isPasswordModalOpen]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };

  const showSuccess = (msg: string) => {
    clearMessages();
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  };

  const openCreateModal = () => {
    clearMessages();
    setFormData({ name: '', email: '', role: 'REQUESTER', active: true, initialPassword: '' });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (u: AdminUser) => {
    clearMessages();
    setSelectedUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, active: u.isActive, initialPassword: '' });
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (u: AdminUser) => {
    clearMessages();
    setSelectedUser(u);
    setFormData(prev => ({ ...prev, initialPassword: '' }));
    setIsPasswordModalOpen(true);
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.initialPassword) {
      errors.initialPassword = "Password is required";
    } else if (!validatePassword(formData.initialPassword)) {
      errors.initialPassword = "Password must be at least 8 characters, include upper/lowercase, number, and special character.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await createAdminUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.active,
        initialPassword: formData.initialPassword
      });
      setIsCreateModalOpen(false);
      showSuccess("User created successfully");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!selectedUser) return;
    
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.email) errors.email = "Email is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await updateAdminUser(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.active
      });
      setIsEditModalOpen(false);
      showSuccess("User updated successfully");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!selectedUser) return;

    const errors: Record<string, string> = {};
    if (!formData.initialPassword) {
      errors.initialPassword = "Password is required";
    } else if (!validatePassword(formData.initialPassword)) {
      errors.initialPassword = "Password must be at least 8 characters, include upper/lowercase, number, and special character.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await setInitialPassword(selectedUser.id, formData.initialPassword);
      setIsPasswordModalOpen(false);
      showSuccess(`Initial password set for ${selectedUser.name}. They will be forced to change it on next login.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== 'ADMINISTRATOR') {
    return (
      <div className="card text-center p-5">
        <h2 className="text-danger">Forbidden</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="animate-enter container-fluid py-4 px-lg-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.5px' }}>User Management</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm fw-medium" onClick={openCreateModal}>
          + Create User
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel mb-4">
        <div className="p-4">
          <form className="row g-3 align-items-center" onSubmit={handleSearchSubmit}>
            <div className="col-md-5">
              <div className="position-relative">
                <input 
                  type="text" 
                  className="form-control ps-5" 
                  placeholder="Search by name or email" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <svg className="position-absolute text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>
            <div className="col-md-4">
              <select 
                className="form-select fw-medium" 
                value={roleFilter} 
                onChange={e => {
                  const newRole = e.target.value;
                  setRoleFilter(newRole);
                  fetchUsers(search, newRole);
                }}
              >
                <option value="">All Roles</option>
                <option value="REQUESTER">Requester</option>
                <option value="IT_STAFF">IT Staff</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
            </div>
            <div className="col-md-3">
              <button id="search-submit-btn" type="submit" className="btn btn-outline-secondary w-100 fw-bold" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {/* Desktop Table View */}
        {!isMobile && (
          <div className="table-responsive">
            {isLoading ? (
              <div className="p-4 text-center">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-muted">
                {search || roleFilter ? 'No users found matching your search criteria.' : 'No users found in the system.'}
              </div>
            ) : (
              <table className="table table-hover align-middle mb-0 custom-table">
                <thead className="text-zen-primary small text-uppercase text-nowrap">
                  <tr>
                    <th tabIndex={0} aria-label="Sort by Name" onKeyDown={(e) => e.key === 'Enter' && handleSort('name')} className={`border-0 fw-bold ps-4 py-3 ${sortBy === 'name' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort('name')}>
                      <div className="d-flex align-items-center">Name <SortIcon field="name" /></div>
                    </th>
                    <th tabIndex={0} aria-label="Sort by Email" onKeyDown={(e) => e.key === 'Enter' && handleSort('email')} className={`border-0 fw-bold py-3 ${sortBy === 'email' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort('email')}>
                      <div className="d-flex align-items-center">Email <SortIcon field="email" /></div>
                    </th>
                    <th tabIndex={0} aria-label="Sort by Role" onKeyDown={(e) => e.key === 'Enter' && handleSort('role')} className={`border-0 fw-bold py-3 text-center ${sortBy === 'role' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort('role')}>
                      <div className="d-flex align-items-center justify-content-center">Role <SortIcon field="role" /></div>
                    </th>
                    <th tabIndex={0} aria-label="Sort by Status" onKeyDown={(e) => e.key === 'Enter' && handleSort('isActive')} className={`border-0 fw-bold py-3 text-center ${sortBy === 'isActive' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort('isActive')}>
                      <div className="d-flex align-items-center justify-content-center">Status <SortIcon field="isActive" /></div>
                    </th>
                    <th className="border-0 fw-bold py-3 text-end pe-4" style={{ letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {sortedUsers.map(u => (
                    <tr key={u.id} className="transition-all">
                      <td className="ps-4 py-3 align-middle fw-medium">{u.name}</td>
                      <td className="py-3 align-middle text-muted">{u.email}</td>
                      <td className="py-3 align-middle text-center">
                        <span className={`badge rounded-pill px-3 py-1 ${u.role === 'ADMINISTRATOR' ? 'badge-zen-danger' : u.role === 'IT_STAFF' ? 'badge-zen-info' : 'badge-zen-success'}`}>
                          {u.role === 'IT_STAFF' ? 'IT Staff' : u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3 align-middle text-center">
                        {u.isActive ? (
                          <span className="badge rounded-pill px-3 py-1 badge-zen-success">Active</span>
                        ) : (
                          <span className="badge rounded-pill px-3 py-1 badge-zen-secondary">Inactive</span>
                        )}
                      </td>
                      <td className="py-3 align-middle text-end pe-4">
                        <button className="btn btn-sm btn-outline-primary fw-medium px-3" onClick={() => openEditModal(u)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Mobile Card View */}
        {isMobile && (
          <div className="p-3">
            {isLoading ? (
              <div className="p-4 text-center">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-muted">
                {search || roleFilter ? 'No users found matching your search criteria.' : 'No users found in the system.'}
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {sortedUsers.map(u => (
                  <div key={u.id} className="card border-0 shadow-sm p-3 transition-all">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-1">{u.name}</h6>
                        <small className="text-muted">{u.email}</small>
                      </div>
                      <span className={`badge rounded-pill px-3 py-1 ${u.role === 'ADMINISTRATOR' ? 'badge-zen-danger' : u.role === 'IT_STAFF' ? 'badge-zen-info' : 'badge-zen-success'}`}>
                        {u.role === 'IT_STAFF' ? 'IT Staff' : u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      {u.isActive ? (
                        <span className="badge rounded-pill px-3 py-1 badge-zen-success">Active</span>
                      ) : (
                        <span className="badge rounded-pill px-3 py-1 badge-zen-secondary">Inactive</span>
                      )}
                      <button className="btn btn-sm btn-outline-primary fw-medium px-3" onClick={() => openEditModal(u)}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && createPortal(
        <div className="modal d-block glass-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 glass-modal">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header border-0 glass-modal-header">
                  <h5 className="modal-title fw-bold text-dark">Create New User</h5>
                  <button type="button" className="btn-close" onClick={() => setIsCreateModalOpen(false)} disabled={isSaving}></button>
                </div>
                <div className="modal-body glass-modal-body">
                  
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">Name <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isSaving} required autoFocus />
                    {fieldErrors.name && <div className="invalid-feedback d-block">{fieldErrors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">Email <span className="text-danger">*</span></label>
                    <input type="email" className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isSaving} required />
                    {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">Role <span className="text-danger">*</span></label>
                    <select className="form-select fw-medium" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={isSaving}>
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>
                  <div className="mb-3 p-3 bg-light border rounded d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold d-block mb-1 small text-muted text-uppercase">Account Status</span>
                      <span className={`badge rounded-pill px-3 py-1 ${formData.active ? 'badge-zen-success' : 'badge-zen-secondary'}`}>
                        {formData.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className={`btn btn-sm ${formData.active ? 'btn-outline-danger' : 'btn-outline-success'} fw-medium`}
                      disabled={isSaving}
                      onClick={() => setFormData({...formData, active: !formData.active})}
                    >
                      {formData.active ? 'Deactivate User' : 'Activate User'}
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">Initial Password <span className="text-danger">*</span></label>
                    <input type="password" className={`form-control ${fieldErrors.initialPassword ? 'is-invalid' : ''}`} value={formData.initialPassword} onChange={e => setFormData({...formData, initialPassword: e.target.value})} disabled={isSaving} required />
                    {fieldErrors.initialPassword ? (
                      <div className="invalid-feedback d-block">{fieldErrors.initialPassword}</div>
                    ) : (
                      <div className="form-text small">Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.</div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 glass-modal-footer">
                  <button type="button" className="btn btn-light px-4 fw-medium shadow-sm" onClick={() => setIsCreateModalOpen(false)} disabled={isSaving}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedUser && createPortal(
        <div className="modal d-block glass-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 glass-modal">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header border-0 glass-modal-header">
                  <h5 className="modal-title fw-bold text-dark">Edit User: <span className="text-zen-primary">{selectedUser.name}</span></h5>
                  <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}></button>
                </div>
                <div className="modal-body glass-modal-body">
                  
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">Name <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isSaving} required autoFocus />
                    {fieldErrors.name && <div className="invalid-feedback d-block">{fieldErrors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">Email <span className="text-danger">*</span></label>
                    <input type="email" className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isSaving} required />
                    {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">Role <span className="text-danger">*</span></label>
                    <select className="form-select fw-medium" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={isSaving || (selectedUser.id === user?.id)}>
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                    {selectedUser.id === user?.id && <div className="form-text text-muted">You cannot change your own role.</div>}
                  </div>
                  <div className="mb-3">
                    <div className="p-3 bg-light border rounded d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <span className="fw-bold d-block mb-1 small text-muted text-uppercase">Account Status</span>
                        <span className={`badge rounded-pill px-3 py-1 ${formData.active ? 'badge-zen-success' : 'badge-zen-secondary'}`}>
                          {formData.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        className={`btn btn-sm ${formData.active ? 'btn-outline-danger' : 'btn-outline-success'} fw-medium`}
                        disabled={isSaving || (selectedUser.id === user?.id)}
                        onClick={() => setFormData({...formData, active: !formData.active})}
                      >
                        {formData.active ? 'Deactivate User' : 'Activate User'}
                      </button>
                    </div>
                    {selectedUser.id === user?.id && <div className="form-text text-muted">You cannot deactivate your own account.</div>}
                  </div>
                  <div className="mb-3 pt-3 border-top">
                    <button type="button" className="btn btn-outline-warning w-100 fw-bold shadow-sm" onClick={() => { setIsEditModalOpen(false); openPasswordModal(selectedUser); }} disabled={isSaving}>
                      Set New Initial Password...
                    </button>
                  </div>
                </div>
                <div className="modal-footer border-0 glass-modal-footer">
                  <button type="button" className="btn btn-light px-4 fw-medium shadow-sm" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PASSWORD MODAL */}
      {isPasswordModalOpen && selectedUser && createPortal(
        <div className="modal d-block glass-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 glass-modal">
              <form onSubmit={handlePasswordSubmit}>
                <div className="modal-header border-0 glass-modal-header bg-warning bg-opacity-10">
                  <h5 className="modal-title fw-bold text-dark">Set Initial Password for <span className="text-zen-primary">{selectedUser.name}</span></h5>
                  <button type="button" className="btn-close" onClick={() => { setIsPasswordModalOpen(false); setIsEditModalOpen(true); }} disabled={isSaving}></button>
                </div>
                <div className="modal-body glass-modal-body">
                  <p className="text-muted small mb-4">Setting a new initial password will force the user to change their password the next time they log in.</p>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-1">New Initial Password <span className="text-danger">*</span></label>
                    <input type="password" className={`form-control ${fieldErrors.initialPassword ? 'is-invalid' : ''}`} value={formData.initialPassword} onChange={e => setFormData({...formData, initialPassword: e.target.value})} disabled={isSaving} required autoFocus />
                    {fieldErrors.initialPassword ? (
                      <div className="invalid-feedback d-block">{fieldErrors.initialPassword}</div>
                    ) : (
                      <div className="form-text small">Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.</div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 glass-modal-footer">
                  <button type="button" className="btn btn-light px-4 fw-medium shadow-sm" onClick={() => { setIsPasswordModalOpen(false); setIsEditModalOpen(true); }} disabled={isSaving}>Back to Edit</button>
                  <button type="submit" className="btn btn-warning px-4 fw-bold shadow-sm text-dark" disabled={isSaving}>{isSaving ? 'Saving...' : 'Set Password'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
};

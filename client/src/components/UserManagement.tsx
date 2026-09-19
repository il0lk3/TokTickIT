import React, { useState, useEffect } from 'react';
import { AdminUser, getAdminUsers, createAdminUser, updateAdminUser, setInitialPassword } from '../api';
import { useAuth } from '../contexts/AuthContext';

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'REQUESTER',
    active: true,
    initialPassword: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(search || undefined, roleFilter || undefined);
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

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setValidationError(null);
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
    
    if (!formData.name || !formData.email || !formData.initialPassword) {
      setValidationError("Name, email, and password are required");
      return;
    }
    
    if (!validatePassword(formData.initialPassword)) {
      setValidationError("Password must be at least 8 characters, include upper/lowercase, number, and special character.");
      return;
    }

    setIsSaving(true);
    try {
      await createAdminUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
        initialPassword: formData.initialPassword
      });
      setIsCreateModalOpen(false);
      showSuccess("User created successfully");
      fetchUsers();
    } catch (err: any) {
      setValidationError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!selectedUser) return;
    
    if (!formData.name || !formData.email) {
      setValidationError("Name and email are required");
      return;
    }

    setIsSaving(true);
    try {
      await updateAdminUser(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active
      });
      setIsEditModalOpen(false);
      showSuccess("User updated successfully");
      fetchUsers();
    } catch (err: any) {
      setValidationError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!selectedUser) return;
    
    if (!validatePassword(formData.initialPassword)) {
      setValidationError("Password must be at least 8 characters, include upper/lowercase, number, and special character.");
      return;
    }

    setIsSaving(true);
    try {
      await setInitialPassword(selectedUser.id, formData.initialPassword);
      setIsPasswordModalOpen(false);
      showSuccess(`Initial password set for ${selectedUser.name}. They will be forced to change it on next login.`);
    } catch (err: any) {
      setValidationError(err.message);
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create User
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSearchSubmit}>
            <div className="col-md-5">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by name or email" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select 
                className="form-select" 
                value={roleFilter} 
                onChange={e => {
                  setRoleFilter(e.target.value);
                  setTimeout(() => document.getElementById('search-submit-btn')?.click(), 0);
                }}
              >
                <option value="">All Roles</option>
                <option value="REQUESTER">Requester</option>
                <option value="IT_STAFF">IT Staff</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
            </div>
            <div className="col-md-3">
              <button id="search-submit-btn" type="submit" className="btn btn-secondary w-100" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0 table-responsive">
          {isLoading ? (
            <div className="p-4 text-center">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-muted">
              {search || roleFilter ? 'No users found matching your search criteria.' : 'No users found in the system.'}
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="align-middle fw-medium">{u.name}</td>
                    <td className="align-middle">{u.email}</td>
                    <td className="align-middle">
                      <span className={`badge ${u.role === 'ADMINISTRATOR' ? 'bg-danger' : u.role === 'IT_STAFF' ? 'bg-info text-dark' : 'bg-primary'}`}>
                        {u.role === 'IT_STAFF' ? 'IT Staff' : u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="align-middle">
                      {u.isActive ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Inactive</span>
                      )}
                    </td>
                    <td className="align-middle text-end">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(u)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Create New User</h5>
                  <button type="button" className="btn-close" onClick={() => setIsCreateModalOpen(false)} disabled={isSaving}></button>
                </div>
                <div className="modal-body">
                  {validationError && <div className="alert alert-danger">{validationError}</div>}
                  
                  <div className="mb-3">
                    <label className="form-label">Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isSaving} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isSaving} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={isSaving}>
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="createActiveSwitch" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} disabled={isSaving} />
                      <label className="form-check-label" htmlFor="createActiveSwitch">Account Active</label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Initial Password <span className="text-danger">*</span></label>
                    <input type="password" className="form-control" value={formData.initialPassword} onChange={e => setFormData({...formData, initialPassword: e.target.value})} disabled={isSaving} required />
                    <div className="form-text">Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)} disabled={isSaving}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit User: {selectedUser.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}></button>
                </div>
                <div className="modal-body">
                  {validationError && <div className="alert alert-danger">{validationError}</div>}
                  
                  <div className="mb-3">
                    <label className="form-label">Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isSaving} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isSaving} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={isSaving || (selectedUser.id === user?.id)}>
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                    {selectedUser.id === user?.id && <div className="form-text text-muted">You cannot change your own role.</div>}
                  </div>
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="editActiveSwitch" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} disabled={isSaving || (selectedUser.id === user?.id)} />
                      <label className="form-check-label" htmlFor="editActiveSwitch">Account Active</label>
                    </div>
                    {selectedUser.id === user?.id && <div className="form-text text-muted">You cannot deactivate your own account.</div>}
                  </div>
                  <div className="mb-3 pt-3 border-top">
                    <button type="button" className="btn btn-outline-warning w-100" onClick={() => { setIsEditModalOpen(false); openPasswordModal(selectedUser); }} disabled={isSaving}>
                      Set New Initial Password...
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {isPasswordModalOpen && selectedUser && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handlePasswordSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Set Initial Password for {selectedUser.name}</h5>
                  <button type="button" className="btn-close" onClick={() => { setIsPasswordModalOpen(false); setIsEditModalOpen(true); }} disabled={isSaving}></button>
                </div>
                <div className="modal-body">
                  {validationError && <div className="alert alert-danger">{validationError}</div>}
                  <p className="text-muted">Setting a new initial password will force the user to change their password the next time they log in.</p>
                  <div className="mb-3">
                    <label className="form-label">New Initial Password <span className="text-danger">*</span></label>
                    <input type="password" className="form-control" value={formData.initialPassword} onChange={e => setFormData({...formData, initialPassword: e.target.value})} disabled={isSaving} required />
                    <div className="form-text">Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsPasswordModalOpen(false); setIsEditModalOpen(true); }} disabled={isSaving}>Back to Edit</button>
                  <button type="submit" className="btn btn-warning" disabled={isSaving}>{isSaving ? 'Saving...' : 'Set Password'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

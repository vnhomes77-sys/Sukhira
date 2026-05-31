import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  UserCheck,
  UserPlus,
  Shield,
  Edit2,
  X,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const Staff = () => {
  const { token, user: currentUser } = useAuth();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals controller
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'order_staff',
    status: 'active'
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchStaff(controller.signal);
    return () => {
      controller.abort();
    };
  }, [token]);

  const fetchStaff = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/staff`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (!response.ok) throw new Error('Failed to load staff list');
      const data = await response.json();
      setStaffList(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Error downloading staff records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      role: 'order_staff',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      status: staffMember.status
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Pre-check parameters
    if (!editingStaff && (!formData.name || !formData.email || !formData.role)) {
      setError('Please fill in all mandatory fields');
      return;
    }

    try {
      const url = editingStaff 
        ? `${API_URL}/admin/staff/${editingStaff.id}`
        : `${API_URL}/admin/staff`;
      
      const method = editingStaff ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Staff registry adjustment failed');
      }

      setSuccessMsg(editingStaff ? 'Staff account updated successfully' : 'Staff account registered successfully');
      setIsModalOpen(false);
      fetchStaff();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error processing staff record');
    }
  };

  // Badges styling mappings
  const getRoleClass = (role) => {
    switch (role) {
      case 'owner': return 'role-owner';
      case 'manager': return 'role-manager';
      case 'order_staff': return 'role-staff';
      case 'support': return 'role-support';
      default: return 'badge-muted';
    }
  };

  return (
    <div>
      {/* Notifications */}
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--color-success)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Toolbar panel */}
      <div className="catalog-toolbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} style={{ color: 'var(--color-danger)' }} />
          <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Total Staff Registries: {staffList.length}
          </span>
        </div>
        
        <button className="btn-primary" onClick={handleOpenAddModal}>
          <UserPlus size={18} />
          <span>Register New Staff</span>
        </button>
      </div>

      {/* Main listings Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Staff Name</th>
                <th>Email Address</th>
                <th>Access Role</th>
                <th>Account Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((st) => (
                <tr key={st.id} style={{ opacity: st.status !== 'active' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 700 }}>#STF{st.id}</td>
                  <td style={{ fontWeight: 650 }}>
                    {st.name} 
                    {st.id === currentUser?.id && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginLeft: '0.4rem', fontWeight: 700 }}>(You)</span>
                    )}
                  </td>
                  <td>{st.email}</td>
                  <td>
                    <span className={`header-role-badge ${getRoleClass(st.role)}`}>
                      {st.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${st.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {st.status}
                    </span>
                  </td>
                  <td>{new Date(st.created_at || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => handleOpenEditModal(st)}
                      disabled={st.id === currentUser?.id} // Don't let owners edit themselves from list
                      title={st.id === currentUser?.id ? "Cannot edit your own account from here" : "Edit staff member details"}
                    >
                      <Edit2 size={14} style={{ marginRight: '0.3rem' }} />
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Register Staff Account'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '2.5rem' }}
                      disabled={!!editingStaff} // Emails cannot be edited to preserve database logic
                      required
                    />
                  </div>
                </div>



                <div className="form-group">
                  <label>Administrative Role *</label>
                  <select
                    name="role"
                    className="form-control"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="owner">Owner (Full access)</option>
                    <option value="manager">Manager (Catalog / orders CRUD)</option>
                    <option value="order_staff">Order Staff (Logistics/Stock fulfillment)</option>
                    <option value="support">Support Staff (Customer views / histories)</option>
                  </select>
                </div>

                {editingStaff && (
                  <div className="form-group">
                    <label>Account Status</label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active (Access allowed)</option>
                      <option value="blocked">Deactivated (Block logins)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingStaff ? 'Save Changes' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;

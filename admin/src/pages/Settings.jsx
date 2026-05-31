import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  Settings as SettingsIcon,
  HelpCircle,
  PlusCircle,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';

const Settings = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Shipping rates editor state
  const [shippingRates, setShippingRates] = useState([]);
  const [newZone, setNewZone] = useState({ zone: '', rate: '' });

  // FAQ management states
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order_num: 0 });

  useEffect(() => {
    const controller = new AbortController();
    fetchSettingsAndFaqs(controller.signal);
    return () => {
      controller.abort();
    };
  }, [token]);

  const fetchSettingsAndFaqs = async (signal) => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch settings (public backend endpoint)
      const settingsResp = await fetch(`${API_URL}/settings`, { signal });
      if (!settingsResp.ok) throw new Error('Failed to load store settings');
      const settingsData = await settingsResp.json();
      setSettings(settingsData);

      // Parse shipping rates
      try {
        const rates = settingsData.shipping_rates ? JSON.parse(settingsData.shipping_rates) : [];
        setShippingRates(rates);
      } catch (e) {
        console.error('Error parsing shipping rates:', e);
        setShippingRates([]);
      }

      // 2. Fetch FAQs (public backend endpoint)
      const faqsResp = await fetch(`${API_URL}/faqs`, { signal });
      if (faqsResp.ok) {
        const faqsData = await faqsResp.json();
        setFaqs(faqsData);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Error downloading configurations');
    } finally {
      setLoading(false);
    }
  };

  // Handle simple setting input updates
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Add Shipping Zone Rate helper
  const handleAddShippingZone = () => {
    if (!newZone.zone || !newZone.rate) return;
    const rateVal = parseFloat(newZone.rate);
    if (isNaN(rateVal) || rateVal < 0) {
      setError('Please provide a valid shipping rate amount');
      return;
    }

    const updatedRates = [...shippingRates, { zone: newZone.zone, rate: rateVal }];
    setShippingRates(updatedRates);
    setNewZone({ zone: '', rate: '' });
    // Keep local settings state updated
    setSettings(prev => ({ ...prev, shipping_rates: JSON.stringify(updatedRates) }));
  };

  const handleRemoveShippingZone = (index) => {
    const updatedRates = shippingRates.filter((_, i) => i !== index);
    setShippingRates(updatedRates);
    setSettings(prev => ({ ...prev, shipping_rates: JSON.stringify(updatedRates) }));
  };

  // Submit Settings Form (calls PUT /api/admin/settings)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Settings update failed');

      setSuccessMsg('Store settings saved successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error updating settings');
    }
  };

  // FAQ Modal Handlers
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', order_num: faqs.length + 1 });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, order_num: faq.order_num });
    setIsFaqModalOpen(true);
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!faqForm.question || !faqForm.answer) {
      setError('Question and Answer are required');
      return;
    }

    try {
      const url = editingFaq 
        ? `${API_URL}/admin/faqs/${editingFaq.id}`
        : `${API_URL}/admin/faqs`;
      
      const method = editingFaq ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(faqForm)
      });

      if (!response.ok) throw new Error('FAQ transaction failed');

      setSuccessMsg(editingFaq ? 'FAQ updated successfully' : 'FAQ added successfully');
      setIsFaqModalOpen(false);
      
      // Reload FAQs
      const faqsResp = await fetch(`${API_URL}/faqs`);
      if (faqsResp.ok) {
        const faqsData = await faqsResp.json();
        setFaqs(faqsData);
      }

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error processing FAQ');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_URL}/admin/faqs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('FAQ deletion failed');

      setSuccessMsg('FAQ deleted successfully');
      setFaqs(faqs.filter(f => f.id !== id));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error deleting FAQ');
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

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'general' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          General & Contact
          {activeTab === 'general' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('shipping')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'shipping' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Pricing & Shipping Zones
          {activeTab === 'shipping' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'payments' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Payment Gateways
          {activeTab === 'payments' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'policies' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Policy Guidelines
          {activeTab === 'policies' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'faqs' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          FAQs Manager
          {activeTab === 'faqs' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>
      </div>

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
        <div style={{ maxWidth: '800px' }}>
          {activeTab !== 'faqs' ? (
            /* General Settings Save Form */
            <form onSubmit={handleSaveSettings}>
              {/* Tab 1: General Info */}
              {activeTab === 'general' && (
                <div className="dashboard-card">
                  <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.2rem' }}>
                    General Store Info & Contacts
                  </h4>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Store Display Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.store_name || ''}
                        onChange={(e) => handleSettingChange('store_name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Store Subtitle / Tagline</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.store_tagline || ''}
                        onChange={(e) => handleSettingChange('store_tagline', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Support Contact Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={settings.contact_email || ''}
                        onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Support Pincode / Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.contact_phone || ''}
                        onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                      />
                    </div>

                    <div className="form-group form-group-full">
                      <label>Operational HQ Address</label>
                      <textarea
                        className="form-control"
                        value={settings.store_address || ''}
                        onChange={(e) => handleSettingChange('store_address', e.target.value)}
                        style={{ minHeight: '80px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Shipping Pricing */}
              {activeTab === 'shipping' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="dashboard-card">
                    <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.2rem' }}>
                      Pricing Configuration
                    </h4>
                    
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Free Shipping Threshold (INR)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={settings.free_shipping_threshold || ''}
                          onChange={(e) => handleSettingChange('free_shipping_threshold', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Estimated Transit Delivery (Days)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={settings.estimated_delivery_days || ''}
                          onChange={(e) => handleSettingChange('estimated_delivery_days', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.2rem' }}>
                      Delivery Pincode Zone Rates
                    </h4>
                    
                    {/* Add Shipping Zone Inline form */}
                    <div style={{
                      display: 'flex',
                      gap: '0.8rem',
                      alignItems: 'flex-end',
                      marginBottom: '1.5rem',
                      backgroundColor: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Zone Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. South India Standard"
                          value={newZone.zone}
                          onChange={(e) => setNewZone({ ...newZone, zone: e.target.value })}
                        />
                      </div>
                      <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rate Charge (INR)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 80"
                          value={newZone.rate}
                          onChange={(e) => setNewZone({ ...newZone, rate: e.target.value })}
                        />
                      </div>
                      <button type="button" className="btn-primary" onClick={handleAddShippingZone} style={{ height: '38px', padding: '0 1rem' }}>
                        <Plus size={18} style={{ marginRight: '0.3rem' }} /> Add Zone
                      </button>
                    </div>

                    {/* Zone Table */}
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Shipping Delivery Zone</th>
                            <th>Cost Rate Charge</th>
                            <th>Operations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!shippingRates.length ? (
                            <tr>
                              <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                                No specific delivery rate configurations. Default rates will apply.
                              </td>
                            </tr>
                          ) : (
                            shippingRates.map((r, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{r.zone}</td>
                                <td style={{ fontWeight: 700, color: 'var(--accent-color)' }}>₹{r.rate}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn-danger"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                                    onClick={() => handleRemoveShippingZone(i)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Payment Settings */}
              {activeTab === 'payments' && (
                <div className="dashboard-card">
                  <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.2rem' }}>
                    Payment Options Integration
                  </h4>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="checkbox-label-flex" style={{ fontSize: '1rem', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={settings.enable_cod === '1'}
                        onChange={(e) => handleSettingChange('enable_cod', e.target.checked ? '1' : '0')}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span>Enable Cash On Delivery (COD)</span>
                    </label>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '1.6rem', marginTop: '0.2rem' }}>
                      Allows customers to check out and pay cash upon physically receiving their parcels.
                    </p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Store UPI ID ID (Direct QR Pay)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.upi_id || ''}
                        onChange={(e) => handleSettingChange('upi_id', e.target.value)}
                        placeholder="e.g. store@upi"
                      />
                    </div>

                    <div className="form-group">
                      <label>Credit Card Public Gateway Key</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.card_gateway_key || ''}
                        onChange={(e) => handleSettingChange('card_gateway_key', e.target.value)}
                        placeholder="e.g. pk_live_..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Policies guidelines */}
              {activeTab === 'policies' && (
                <div className="dashboard-card">
                  <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.2rem' }}>
                    Return & Shipping Policy Content
                  </h4>

                  <div className="form-group">
                    <label>Product Return & Refund Policy</label>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Displayed during customer checkout and in policies tabs.
                    </p>
                    <textarea
                      className="form-control"
                      value={settings.return_policy || ''}
                      onChange={(e) => handleSettingChange('return_policy', e.target.value)}
                      style={{ minHeight: '120px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label>Shipping & Logistic Terms Policy</label>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Fulfillment timelines, domestic/international restrictions.
                    </p>
                    <textarea
                      className="form-control"
                      value={settings.shipping_policy || ''}
                      onChange={(e) => handleSettingChange('shipping_policy', e.target.value)}
                      style={{ minHeight: '120px' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2rem' }}>
                  Save Configuration settings
                </button>
              </div>
            </form>
          ) : (
            /* Tab 5: FAQs list management */
            <div className="dashboard-card">
              <div className="card-header-flex" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className="card-title">Frequently Asked Questions</div>
                <button className="btn-primary" onClick={handleOpenAddFaq} style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>
                  <PlusCircle size={14} style={{ marginRight: '0.3rem' }} /> Add FAQ
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                These questions are dynamically pulled into the customer store's FAQ and Help page.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!faqs.length ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No FAQs registered yet. Add some questions above!
                  </p>
                ) : (
                  faqs.map((faq) => (
                    <div key={faq.id} style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '1.2rem',
                      position: 'relative',
                      backgroundColor: '#fafbfc'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <h5 style={{ fontWeight: 700, fontSize: '0.92rem', paddingRight: '4rem' }}>
                          Q: {faq.question}
                        </h5>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem' }}
                            onClick={() => handleOpenEditFaq(faq)}
                            title="Edit FAQ"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '0.3rem' }}
                            onClick={() => handleDeleteFaq(faq.id)}
                            title="Delete FAQ"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {faq.answer}
                      </p>
                      <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.8rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Order: {faq.order_num}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ Form Modal (Add / Edit) */}
      {isFaqModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingFaq ? 'Edit FAQ Item' : 'Add FAQ Item'}</h3>
              <button className="modal-close-btn" onClick={() => setIsFaqModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFaqSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>FAQ Question *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Is this skincare safe for pregnant mothers?"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>FAQ Answer *</label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the answer comprehensively..."
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    style={{ minHeight: '120px' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Display Sorting Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={faqForm.order_num}
                    onChange={(e) => setFaqForm({ ...faqForm, order_num: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsFaqModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingFaq ? 'Save FAQ' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

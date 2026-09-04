import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile, logoutUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ProfileDrawer({ isOpen, onClose, onProfileUpdated }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Edit fields
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await getCurrentUser();
      setUser(u);
      setName(u.name || '');
    } catch (err) {
      console.error(err);
      setError('Failed to load profile. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {};
    if (name.trim() && name !== user?.name) {
      payload.name = name.trim();
    }
    if (newPassword.trim()) {
      if (newPassword.trim().length < 8) {
        setError('New password must be at least 8 characters long');
        setSaving(false);
        return;
      }
      payload.password = newPassword.trim();
    }

    if (Object.keys(payload).length === 0) {
      setSuccess('No changes to save.');
      setSaving(false);
      return;
    }

    try {
      const updated = await updateUserProfile(payload);
      setUser(updated);
      setName(updated.name);
      setNewPassword('');
      setSuccess('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div
      className="profile-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="profile-drawer"
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
          <div>
            <span className="eyebrow" style={{ fontSize: '.75rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>
              Account Settings
            </span>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#111827' }}>
              User Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: '#4b5563',
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
            Loading profile credentials...
          </div>
        ) : user ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* User Overview Badge Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    color: '#1e3a8a',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.name}</div>
                  <div style={{ fontSize: '.85rem', opacity: 0.9 }}>{user.email}</div>
                </div>
              </div>
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                <span>Track: CS Core</span>
              </div>
            </div>

            {/* Notifications */}
            {error && (
              <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 6, fontSize: '.85rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: '#dcfce7', color: '#166534', borderRadius: 6, fontSize: '.85rem' }}>
                {success}
              </div>
            )}

            {/* Profile Update Form */}
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: '.85rem', fontWeight: 600 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: '.85rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={user.email}
                  disabled
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', color: '#6b7280', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 4, display: 'block' }}>
                  Email cannot be modified directly.
                </span>
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: '.85rem', fontWeight: 600 }}>
                  New Password (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Leave blank to keep current"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 12,
                  padding: '10px 16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving changes...' : 'Save Profile Updates'}
              </button>
            </form>

            {/* Logout Button */}
            <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#fff1f2',
                  color: '#be123c',
                  border: '1px solid #fecdd3',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign out of account
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

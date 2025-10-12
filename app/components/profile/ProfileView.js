// app/components/profile/ProfileView.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { User } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';
import { getRoleDisplayName } from '@/lib/constants';

export default function ProfileView() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    dog_name: '',
    owners: '',
    notes: ''
  });

  useEffect(() => {
    if (currentUser.role === 'member') {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getProfile(currentUser.id);
      setProfile(data);
      setFormData({
        dog_name: data.dog_name || '',
        owners: data.owners || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveProfile({
        user_id: currentUser.id,
        ...formData
      });
      
      showToast('Profile saved!', 'success');
      loadProfile();
    } catch (error) {
      showToast(error.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  // Trainer/Admin Profile View
  if (currentUser.role === 'trainer' || currentUser.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6 space-y-6">
          <h2 className="text-2xl font-bold text-[#32303b]">Account Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#32303b] to-[#43414d] text-white rounded-lg">
              <User className="w-12 h-12 text-[#dcac6e]" />
              <div>
                <p className="text-sm opacity-90">Logged in as</p>
                <p className="text-xl font-bold">{currentUser.username}</p>
                <p className="text-sm text-[#dcac6e]">{getRoleDisplayName(currentUser.role)}</p>
              </div>
            </div>

            <div className="border-2 border-[#dcac6e] rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-[#32303b] font-medium">{currentUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <p className="text-[#32303b] font-medium capitalize">{getRoleDisplayName(currentUser.role)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-green-600 font-medium">Active</p>
                </div>
              </div>
            </div>

            <div className="bg-[#dcac6e] bg-opacity-10 border-2 border-[#dcac6e] rounded-lg p-4">
              <h3 className="font-bold text-[#32303b] mb-2">Profile Management</h3>
              <p className="text-sm text-gray-700">
                As a {currentUser.role}, you don't need to maintain a dog profile. 
                Your account is used for managing students and approving their progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Member Profile View
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#32303b]">Dog Profile</h2>

        <div>
          <label className="block text-sm font-medium text-[#32303b] mb-1">Dog Name</label>
          <input
            type="text"
            value={formData.dog_name}
            onChange={(e) => setFormData({ ...formData, dog_name: e.target.value })}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
            placeholder="Max"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#32303b] mb-1">Owner(s)</label>
          <input
            type="text"
            value={formData.owners}
            onChange={(e) => setFormData({ ...formData, owners: e.target.value })}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
            placeholder="Sarah Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#32303b] mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
            placeholder="Any important information about your dog..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

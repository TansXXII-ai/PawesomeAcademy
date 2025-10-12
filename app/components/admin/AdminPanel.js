// app/components/admin/AdminPanel.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Book } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';

export default function AdminPanel() {
  const { currentUser, sections } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [adminSections, setAdminSections] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });
  const [passwordModal, setPasswordModal] = useState({ show: false, user: null, password: '' });

  // User form state
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    password: '',
    role: 'member'
  });

  // Section form state
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    display_order: 99
  });

  // Skill form state
  const [skillForm, setSkillForm] = useState({
    section_id: '',
    title: '',
    description: '',
    difficulty: 1,
    points: 2,
    display_order: 99
  });

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'sections') {
      loadSections();
    } else if (activeTab === 'skills') {
      loadSkills();
      loadSections();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sections');
      const data = await response.json();
      setAdminSections(data);
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/skills');
      const data = await response.json();
      setSkills(data);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      showToast('User created successfully!', 'success');
      setUserForm({ email: '', username: '', password: '', role: 'member' });
      loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/users?userId=${deleteModal.user.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      showToast('User deleted successfully!', 'success');
      setDeleteModal({ show: false, user: null });
      loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!passwordModal.password || passwordModal.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: passwordModal.user.id,
          new_password: passwordModal.password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }

      showToast('Password reset successfully!', 'success');
      setPasswordModal({ show: false, user: null, password: '' });
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create section');
      }

      showToast('Section created successfully!', 'success');
      setSectionForm({ name: '', description: '', display_order: 99 });
      loadSections();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create skill');
      }

      showToast('Skill created successfully!', 'success');
      setSkillForm({
        section_id: skillForm.section_id,
        title: '',
        description: '',
        difficulty: 1,
        points: 2,
        display_order: 99
      });
      loadSkills();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <h2 className="text-2xl font-bold text-[#32303b]">Admin Panel</h2>
        <p className="text-gray-600 mt-1">Manage users, skills, and sections</p>
      </div>

      <div className="flex space-x-2 border-b-2 border-[#dcac6e]">
        {['users', 'sections', 'skills'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? 'border-b-4 border-[#32303b] text-[#32303b] font-medium'
                : 'text-gray-600 hover:text-[#32303b]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Username *</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Password *</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  <option value="member">Member (Pawsome Pal)</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition font-medium"
              >
                Create User
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Existing Users</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="border-2 border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-[#32303b]">{user.username}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'trainer' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPasswordModal({ show: true, user, password: '' })}
                        className="flex-1 bg-[#dcac6e] text-[#32303b] py-1.5 px-3 rounded text-sm hover:bg-[#c49654] transition font-medium"
                      >
                        Reset Password
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => setDeleteModal({ show: true, user })}
                          className="flex-1 bg-red-600 text-white py-1.5 px-3 rounded text-sm hover:bg-red-700 transition font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Create New Section</h3>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Section Name *</label>
                <input
                  type="text"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="e.g., Recall, Leads, Life Skills"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Description *</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="Brief description of this section"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Display Order</label>
                <input
                  type="number"
                  value={sectionForm.display_order}
                  onChange={(e) => setSectionForm({ ...sectionForm, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="99"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition font-medium"
              >
                Create Section
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Existing Sections</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-3">
                {adminSections.sort((a, b) => a.display_order - b.display_order).map(section => (
                  <div key={section.id} className="border-2 border-[#dcac6e] rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-[#32303b]">{section.name}</p>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        Order: {section.display_order}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Create New Skill</h3>
            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Section *</label>
                <select
                  value={skillForm.section_id}
                  onChange={(e) => setSkillForm({ ...skillForm, section_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  <option value="">Select a section</option>
                  {adminSections.sort((a, b) => a.display_order - b.display_order).map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Skill Title *</label>
                <input
                  type="text"
                  value={skillForm.title}
                  onChange={(e) => setSkillForm({ ...skillForm, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="e.g., Basic Sit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Description *</label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="Detailed description of the skill requirements"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#32303b] mb-1">Difficulty (1-5) *</label>
                  <select
                    value={skillForm.difficulty}
                    onChange={(e) => setSkillForm({ ...skillForm, difficulty: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                    required
                  >
                    {[1, 2, 3, 4, 5].map(level => (
                      <option key={level} value={level}>
                        {'⭐'.repeat(level)} ({level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#32303b] mb-1">Points *</label>
                  <select
                    value={skillForm.points}
                    onChange={(e) => setSkillForm({ ...skillForm, points: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                    required
                  >
                    <option value={2}>2 points</option>
                    <option value={5}>5 points</option>
                    <option value={10}>10 points</option>
                    <option value={15}>15 points</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Display Order</label>
                <input
                  type="number"
                  value={skillForm.display_order}
                  onChange={(e) => setSkillForm({ ...skillForm, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="99"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition font-medium"
              >
                Create Skill
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Existing Skills</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {adminSections.map(section => {
                  const sectionSkills = skills.filter(s => s.section_id === section.id);
                  if (sectionSkills.length === 0) return null;
                  
                  return (
                    <div key={section.id} className="mb-4">
                      <h4 className="font-bold text-[#32303b] mb-2 flex items-center">
                        <Book className="w-4 h-4 mr-2 text-[#dcac6e]" />
                        {section.name}
                      </h4>
                      <div className="space-y-2 ml-6">
                        {sectionSkills.map(skill => (
                          <div key={skill.id} className="border-2 border-gray-200 rounded-lg p-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-[#32303b] text-sm">{skill.title}</p>
                                <p className="text-xs text-gray-600 line-clamp-1">{skill.description}</p>
                              </div>
                              <div className="flex items-center space-x-2 ml-2">
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                  {'⭐'.repeat(skill.difficulty)}
                                </span>
                                <span className="text-xs font-bold text-[#32303b]">{skill.points}pts</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-red-500">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete User</h3>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{deleteModal.user?.username}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This will deactivate their account. They will no longer be able to log in.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteUser}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete User
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, user: null })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Reset Password</h3>
            <p className="text-gray-700 mb-4">
              Reset password for <strong>{passwordModal.user?.username}</strong>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#32303b] mb-2">New Password</label>
              <input
                type="password"
                value={passwordModal.password}
                onChange={(e) => setPasswordModal({ ...passwordModal, password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                placeholder="Enter new password (min 6 characters)"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleResetPassword}
                className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
              >
                Reset Password
              </button>
              <button
                onClick={() => setPasswordModal({ show: false, user: null, password: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

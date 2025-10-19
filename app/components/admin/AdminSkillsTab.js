// app/components/admin/AdminSkillsTab.js - CREATE NEW FILE
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Filter } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';

export default function AdminSkillsTab() {
  const { sections, setSkills } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [skills, setLocalSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, skill: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, skill: null });
  
  const [skillForm, setSkillForm] = useState({
    section_id: '',
    title: '',
    description: '',
    difficulty: 1,
    points: 2,
    display_order: 99
  });

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    filterSkills();
  }, [skills, sectionFilter]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/skills');
      const data = await response.json();
      setLocalSkills(data);
      setSkills(data);
    } catch (error) {
      console.error('Failed to load skills:', error);
      showToast('Failed to load skills', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterSkills = () => {
    if (sectionFilter === 'all') {
      setFilteredSkills(skills);
    } else {
      setFilteredSkills(skills.filter(s => s.section_id === parseInt(sectionFilter)));
    }
  };

  const handleCreate = async (e) => {
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
        section_id: '',
        title: '',
        description: '',
        difficulty: 1,
        points: 2,
        display_order: 99
      });
      setShowCreateModal(false);
      loadSkills();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/skills/${editModal.skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update skill');
      }

      showToast('Skill updated successfully!', 'success');
      setEditModal({ show: false, skill: null });
      loadSkills();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/skills/${deleteModal.skill.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete skill');
      }

      showToast('Skill deleted successfully!', 'success');
      setDeleteModal({ show: false, skill: null });
      loadSkills();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading && skills.length === 0) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#32303b]">Skill Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredSkills.length} of {skills.length} skills
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>{section.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-[#32303b] text-white px-4 py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create Skill</span>
          </button>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map(skill => (
          <div
            key={skill.id}
            className="bg-white border-2 border-[#dcac6e] rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-[#32303b]">{skill.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{skill.section_name}</p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setSkillForm({
                      section_id: skill.section_id,
                      title: skill.title,
                      description: skill.description,
                      difficulty: skill.difficulty,
                      points: skill.points,
                      display_order: skill.display_order
                    });
                    setEditModal({ show: true, skill });
                  }}
                  className="p-1.5 text-[#dcac6e] hover:bg-[#dcac6e] hover:bg-opacity-20 rounded transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, skill })}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{skill.description}</p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {'⭐'.repeat(skill.difficulty)}
                </span>
                <span className="text-sm font-bold text-[#32303b]">{skill.points} pts</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                skill.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {skill.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}

        {filteredSkills.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No skills found. Create your first skill!
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Create New Skill</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Section *</label>
                <select
                  value={skillForm.section_id}
                  onChange={(e) => setSkillForm({ ...skillForm, section_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  <option value="">Select a section</option>
                  {sections.map(section => (
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Description *</label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
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
                    {[1, 2, 3, 4, 5].map(d => (
                      <option key={d} value={d}>{'⭐'.repeat(d)}</option>
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
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
                >
                  Create Skill
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Edit Skill</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Section *</label>
                <select
                  value={skillForm.section_id}
                  onChange={(e) => setSkillForm({ ...skillForm, section_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  <option value="">Select a section</option>
                  {sections.map(section => (
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Description *</label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
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
                    {[1, 2, 3, 4, 5].map(d => (
                      <option key={d} value={d}>{'⭐'.repeat(d)}</option>
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
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
                >
                  Update Skill
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, skill: null })}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-red-500">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Skill</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteModal.skill?.title}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, skill: null })}
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

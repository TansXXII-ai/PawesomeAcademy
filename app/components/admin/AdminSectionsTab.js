// app/components/admin/AdminSectionsTab.js - CREATE NEW FILE
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';

export default function AdminSectionsTab() {
  const { setSections } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [sections, setLocalSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, section: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, section: null });
  
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    display_order: 99
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sections');
      const data = await response.json();
      setLocalSections(data);
      setSections(data);
    } catch (error) {
      console.error('Failed to load sections:', error);
      showToast('Failed to load sections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
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
      setShowCreateModal(false);
      loadSections();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/sections/${editModal.section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update section');
      }

      showToast('Section updated successfully!', 'success');
      setEditModal({ show: false, section: null });
      loadSections();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/sections/${deleteModal.section.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete section');
      }

      showToast('Section deleted successfully!', 'success');
      setDeleteModal({ show: false, section: null });
      loadSections();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleReorder = async (sectionId, direction) => {
    const section = sections.find(s => s.id === sectionId);
    const newOrder = direction === 'up' ? section.display_order - 1 : section.display_order + 1;
    
    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: section.name,
          description: section.description,
          display_order: newOrder
        })
      });

      if (!response.ok) throw new Error('Failed to reorder');
      
      loadSections();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading && sections.length === 0) {
    return <div className="text-center py-8">Loading sections...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-[#32303b]">Section Management</h3>
          <p className="text-sm text-gray-600 mt-1">{sections.length} sections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-[#32303b] text-white px-4 py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Section</span>
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="bg-white border-2 border-[#dcac6e] rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-[#32303b] text-lg">{section.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">
                    Order: {section.display_order}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    section.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {section.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleReorder(section.id, 'up')}
                  disabled={index === 0}
                  className="p-2 text-gray-400 hover:text-[#32303b] hover:bg-gray-100 rounded transition disabled:opacity-30"
                  title="Move Up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReorder(section.id, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-2 text-gray-400 hover:text-[#32303b] hover:bg-gray-100 rounded transition disabled:opacity-30"
                  title="Move Down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSectionForm({
                      name: section.name,
                      description: section.description,
                      display_order: section.display_order
                    });
                    setEditModal({ show: true, section });
                  }}
                  className="p-2 text-[#dcac6e] hover:bg-[#dcac6e] hover:bg-opacity-20 rounded transition"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, section })}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sections yet. Create your first section!
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Create New Section</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Section Name *</label>
                <input
                  type="text"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Description *</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
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
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
                >
                  Create Section
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Edit Section</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Section Name *</label>
                <input
                  type="text"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Description *</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
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
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
                >
                  Update Section
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, section: null })}
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
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Section</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteModal.section?.name}</strong>?
              This will also affect all skills in this section.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, section: null })}
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

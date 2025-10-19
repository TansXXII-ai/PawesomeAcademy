// app/components/admin/AdminClassesTab.js - CREATE NEW FILE
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';

export default function AdminClassesTab() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, classItem: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, classItem: null });
  
  const [classForm, setClassForm] = useState({
    name: '',
    day_of_week: 'Monday',
    time_slot: '',
    trainer_id: currentUser?.id || ''
  });

  useEffect(() => {
    loadClasses();
    loadTrainers();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await api.getAllClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load classes:', error);
      showToast('Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTrainers = async () => {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      const trainerList = users.filter(u => u.role === 'trainer' || u.role === 'admin');
      setTrainers(trainerList);
    } catch (error) {
      console.error('Failed to load trainers:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createClass(classForm);
      showToast('Class created successfully!', 'success');
      setClassForm({
        name: '',
        day_of_week: 'Monday',
        time_slot: '',
        trainer_id: currentUser?.id || ''
      });
      setShowCreateModal(false);
      loadClasses();
    } catch (error) {
      showToast(error.message || 'Failed to create class', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateClass(editModal.classItem.id, classForm);
      showToast('Class updated successfully!', 'success');
      setEditModal({ show: false, classItem: null });
      loadClasses();
    } catch (error) {
      showToast(error.message || 'Failed to update class', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteClass(deleteModal.classItem.id);
      showToast('Class deleted successfully!', 'success');
      setDeleteModal({ show: false, classItem: null });
      loadClasses();
    } catch (error) {
      showToast(error.message || 'Failed to delete class', 'error');
    }
  };

  const groupClassesByDay = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped = {};
    days.forEach(day => {
      grouped[day] = classes.filter(c => c.day_of_week === day)
        .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
    });
    return grouped;
  };

  if (loading && classes.length === 0) {
    return <div className="text-center py-8">Loading classes...</div>;
  }

  const groupedClasses = groupClassesByDay();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-[#32303b]">Class Management</h3>
          <p className="text-sm text-gray-600 mt-1">{classes.length} classes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-[#32303b] text-white px-4 py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Class</span>
        </button>
      </div>

      {/* Classes by Day */}
      {classes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No classes yet. Create your first class!
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedClasses).map(([day, dayClasses]) => {
            if (dayClasses.length === 0) return null;
            
            return (
              <div key={day} className="bg-white border-2 border-[#dcac6e] rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#32303b] to-[#43414d] text-white px-4 py-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-[#dcac6e]" />
                  <h4 className="font-bold">{day}</h4>
                  <span className="ml-auto text-sm text-[#dcac6e]">{dayClasses.length} class{dayClasses.length !== 1 ? 'es' : ''}</span>
                </div>
                <div className="p-4 space-y-3">
                  {dayClasses.map(classItem => (
                    <div
                      key={classItem.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#dcac6e] hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-bold text-[#32303b] text-lg">{classItem.name}</h5>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-[#32303b]" />
                              <span>{classItem.time_slot}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4 text-[#32303b]" />
                              <span>{classItem.member_count || 0} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-[#dcac6e] font-medium">
                                Trainer: {classItem.trainer_name}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setClassForm({
                                name: classItem.name,
                                day_of_week: classItem.day_of_week,
                                time_slot: classItem.time_slot,
                                trainer_id: classItem.trainer_id
                              });
                              setEditModal({ show: true, classItem });
                            }}
                            className="p-2 text-[#dcac6e] hover:bg-[#dcac6e] hover:bg-opacity-20 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, classItem })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Create New Class</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Class Name *</label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="e.g., Beginner Puppies, Advanced Tricks"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Day of Week *</label>
                <select
                  value={classForm.day_of_week}
                  onChange={(e) => setClassForm({ ...classForm, day_of_week: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Time Slot *</label>
                <input
                  type="text"
                  value={classForm.time_slot}
                  onChange={(e) => setClassForm({ ...classForm, time_slot: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="e.g., 10:00 AM - 11:00 AM"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Trainer *</label>
                <select
                  value={classForm.trainer_id}
                  onChange={(e) => setClassForm({ ...classForm, trainer_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  <option value="">Select a trainer</option>
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.username} ({trainer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
                >
                  Create Class
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
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Edit Class</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Class Name *</label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Day of Week *</label>
                <select
                  value={classForm.day_of_week}
                  onChange={(e) => setClassForm({ ...classForm, day_of_week: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Time Slot *</label>
                <input
                  type="text"
                  value={classForm.time_slot}
                  onChange={(e) => setClassForm({ ...classForm, time_slot: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#32303b] mb-1">Trainer *</label>
                <select
                  value={classForm.trainer_id}
                  onChange={(e) => setClassForm({ ...classForm, trainer_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  required
                >
                  <option value="">Select a trainer</option>
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.username} ({trainer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
                >
                  Update Class
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, classItem: null })}
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
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Class</h3>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{deleteModal.classItem?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This will deactivate the class. Students enrolled will no longer see it.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, classItem: null })}
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

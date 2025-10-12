// app/components/myclasses/MyClassesView.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Plus } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';

export default function MyClassesView() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    day_of_week: 'Monday',
    time_slot: '',
    trainer_id: currentUser?.id || ''
  });

  useEffect(() => {
    loadClasses();
    if (currentUser.role === 'admin') {
      loadTrainers();
    }
  }, [currentUser]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = currentUser.role === 'admin' 
        ? await api.getAllClasses() 
        : await api.getClasses(currentUser.id, true);
      
      setClasses(Array.isArray(data) ? data : data.classes || []);
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

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.createClass(classForm);
      showToast('Class created successfully!', 'success');
      setShowCreateModal(false);
      setClassForm({
        name: '',
        day_of_week: 'Monday',
        time_slot: '',
        trainer_id: currentUser?.id || ''
      });
      loadClasses();
    } catch (error) {
      showToast(error.message || 'Failed to create class', 'error');
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

  if (loading) {
    return <div className="text-center py-8">Loading classes...</div>;
  }

  const groupedClasses = groupClassesByDay();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#32303b]">
              {currentUser.role === 'admin' ? 'All Classes' : 'My Classes'}
            </h2>
            <p className="text-gray-600">
              {currentUser.role === 'admin' 
                ? 'Manage all training classes' 
                : 'View your class schedule'}
            </p>
          </div>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-[#32303b] text-white px-4 py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
            >
              <Plus className="w-5 h-5" />
              <span>Create Class</span>
            </button>
          )}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {currentUser.role === 'admin' 
              ? 'No classes have been created yet.' 
              : 'You are not assigned to any classes yet.'}
          </p>
          <p className="text-sm text-gray-500">
            {currentUser.role === 'admin'
              ? 'Click "Create Class" to get started.'
              : 'Contact an administrator to be assigned to a class.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedClasses).map(([day, dayClasses]) => {
            if (dayClasses.length === 0) return null;
            
            return (
              <div key={day} className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e]">
                <div className="bg-gradient-to-r from-[#32303b] to-[#43414d] text-white px-6 py-3 rounded-t-lg border-b-2 border-[#dcac6e]">
                  <h3 className="text-lg font-bold flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#dcac6e]" />
                    {day}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {dayClasses.map(classItem => (
                    <ClassCard 
                      key={classItem.id} 
                      classItem={classItem} 
                      showTrainer={currentUser.role === 'admin'}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && currentUser.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
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
    </div>
  );
}

// ============= CLASS CARD =============
function ClassCard({ classItem, showTrainer }) {
  return (
    <div className="border-2 border-[#dcac6e] rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-[#32303b] mb-1">{classItem.name}</h4>
          {showTrainer && (
            <p className="text-sm text-gray-600 mb-2">
              Trainer: {classItem.trainer_name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 bg-[#dcac6e] bg-opacity-20 px-3 py-1 rounded-full">
          <Users className="w-4 h-4 text-[#32303b]" />
          <span className="text-sm font-bold text-[#32303b]">
            {classItem.member_count || 0}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-[#32303b]" />
          <span>{classItem.day_of_week}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-[#32303b]" />
          <span>{classItem.time_slot}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#dcac6e] flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded ${
          classItem.active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {classItem.active ? 'Active' : 'Inactive'}
        </span>
        <span className="text-xs text-gray-500">
          Created: {new Date(classItem.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

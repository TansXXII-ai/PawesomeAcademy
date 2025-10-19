// app/components/dashboard/StudentDetailView.js
'use client';
import React, { useState, useContext } from 'react';
import { Calendar, Check, Book, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';
import TrainerSkillCard from './components/TrainerSkillCard';

export default function StudentDetailView({ student, onBack }) {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [selectedSection, setSelectedSection] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [approving, setApproving] = useState(false);

  const toggleSkillSelection = (skill) => {
    if (skill.status === 'completed') return;
    
    setSelectedSkills(prev => {
      const exists = prev.find(s => s.id === skill.id);
      if (exists) {
        return prev.filter(s => s.id !== skill.id);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleBulkApprove = async () => {
    if (selectedSkills.length === 0) return;
    
    setApproving(true);
    try {
      for (const skill of selectedSkills) {
        await api.directApproveSkill({
          user_id: student.user_id,
          skill_id: skill.id,
          notes: 'Bulk approved'
        });
      }
      
      const totalPoints = selectedSkills.reduce((sum, s) => sum + s.points, 0);
      showToast(`${selectedSkills.length} skills approved! +${totalPoints} points`, 'success');
      setSelectedSkills([]);
      setMultiSelectMode(false);
      onBack();
    } catch (error) {
      showToast(error.message || 'Failed to approve skills', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleSingleApprove = async (skill) => {
    if (multiSelectMode) {
      toggleSkillSelection(skill);
      return;
    }

    if (skill.status === 'completed') return;
    
    try {
      await api.directApproveSkill({
        user_id: student.user_id,
        skill_id: skill.id,
        notes: 'Quick approved'
      });
      showToast(`${skill.title} approved! +${skill.points} points`, 'success');
      onBack();
    } catch (error) {
      showToast(error.message || 'Failed to approve skill', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back to Class
        </button>
        <div className="flex space-x-2">
          {multiSelectMode && selectedSkills.length > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={approving}
              className="px-4 py-2 bg-[#32303b] text-white rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition disabled:opacity-50 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Approve {selectedSkills.length} Skills</span>
            </button>
          )}
          <button
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              setSelectedSkills([]);
            }}
            className={`px-4 py-2 rounded-lg transition ${
              multiSelectMode 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-[#dcac6e] text-[#32303b] hover:bg-[#c49654]'
            }`}
          >
            {multiSelectMode ? 'Cancel Multi-Select' : 'Multi-Select Mode'}
          </button>
        </div>
      </div>

      {/* Student Header Card */}
      <div className="bg-gradient-to-br from-[#32303b] to-[#43414d] text-white rounded-lg shadow-lg p-6 border-2 border-[#dcac6e]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{student.dog_name}</h2>
            <p className="text-[#dcac6e] mb-1">Owner: {student.owners}</p>
            <p className="text-[#dcac6e] mb-1">Email: {student.email}</p>
            <p className="text-[#dcac6e]">Class: {student.class_name}</p>
          </div>
          <div className="text-center bg-[#dcac6e] bg-opacity-20 rounded-lg px-6 py-4 border-2 border-[#dcac6e]">
            <div className="text-4xl font-bold">{student.current_grade || 0}</div>
            <div className="text-sm opacity-90">Current Grade</div>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-4">
        <h3 className="font-bold text-[#32303b] mb-3">Progress Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#32303b]">{student.progress?.total_points || 0}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#dcac6e]">{student.progress?.sections_with_skills || 0}/6</div>
            <div className="text-sm text-gray-600">Sections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {student.sections?.reduce((sum, sec) => 
                sum + sec.skills.filter(sk => sk.status === 'pending').length, 0) || 0}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {/* Multi-Select Banner */}
      {multiSelectMode && (
        <div className="bg-[#dcac6e] bg-opacity-20 border-2 border-[#dcac6e] rounded-lg p-4">
          <p className="text-sm text-[#32303b] font-medium">
            Multi-Select Mode Active - Click skills to select/deselect, then approve all at once
          </p>
        </div>
      )}

      {/* Skills by Section */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e]">
        <div className="p-6 border-b border-[#dcac6e]">
          <h3 className="text-xl font-bold text-[#32303b]">Skill Progress</h3>
          <p className="text-sm text-gray-600 mt-1">
            {multiSelectMode ? 'Select multiple skills to approve' : 'Click any available skill to mark as complete'}
          </p>
        </div>

        {student.sections?.map(section => (
          <div key={section.id} className="border-b last:border-b-0">
            <button
              onClick={() => setSelectedSection(
                selectedSection === section.id ? null : section.id
              )}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center space-x-3">
                <Book className="w-5 h-5 text-[#32303b]" />
                <span className="font-bold text-[#32303b]">{section.name}</span>
                <span className="text-sm text-gray-500">
                  ({section.skills.filter(s => s.status === 'completed').length}/{section.skills.length} completed)
                </span>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                selectedSection === section.id ? 'rotate-90' : ''
              }`} />
            </button>

            {selectedSection === section.id && (
              <div className="px-6 pb-4 bg-gray-50">
                <div className="grid md:grid-cols-2 gap-3 pt-3">
                  {section.skills.map(skill => (
                    <TrainerSkillCard
                      key={skill.id}
                      skill={skill}
                      onClick={() => handleSingleApprove(skill)}
                      multiSelectMode={multiSelectMode}
                      isSelected={selectedSkills.some(s => s.id === skill.id)}
                      onToggleSelect={() => toggleSkillSelection(skill)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {student.recent_activity && student.recent_activity.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
          <h3 className="text-lg font-bold text-[#32303b] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {student.recent_activity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <div>
                  <p className="font-medium text-[#32303b]">{activity.skill}</p>
                  <p className="text-sm text-gray-600">by {activity.trainer}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    activity.action === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.action}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

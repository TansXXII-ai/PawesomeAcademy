// app/components/sections/SectionsView.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Check, Clock, Upload } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';

export default function SectionsView() {
  const { sections } = useContext(AppContext);
  const [selectedSection, setSelectedSection] = useState(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#32303b]">Skills & Sections</h2>
      
      {!selectedSection ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.filter(s => s.active).sort((a, b) => a.display_order - b.display_order).map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section)}
              className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6 hover:shadow-xl hover:border-[#32303b] transition text-left"
            >
              <h3 className="text-xl font-bold text-[#32303b] mb-2">{section.name}</h3>
              <p className="text-gray-600 mb-4">{section.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <SectionDetail section={selectedSection} onBack={() => setSelectedSection(null)} />
      )}
    </div>
  );
}

// ============= SECTION DETAIL =============
function SectionDetail({ section, onBack }) {
  const { currentUser } = useContext(AppContext);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [sectionSkills, setSectionSkills] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSectionData();
  }, [section]);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      const skillsData = await api.getSkills(section.id);
      setSectionSkills(skillsData);

      if (currentUser.role === 'member') {
        const [submissionsData, progressData] = await Promise.all([
          api.getSubmissions(currentUser.id),
          api.getGradeProgress(currentUser.id)
        ]);
        
        setSubmissions(submissionsData);
        const completionSkills = progressData.availableCompletions?.map(c => c.skill_id) || [];
        setCompletions(completionSkills);
      } else {
        setSubmissions([]);
        setCompletions([]);
      }
    } catch (error) {
      console.error('Failed to load section data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillStatus = (skillId) => {
    if (currentUser.role !== 'member') {
      return 'available';
    }

    if (completions.includes(skillId)) return 'completed';
    
    const submission = submissions.find(s => 
      s.skill_id === skillId && 
      (s.status === 'requested' || s.status === 'submitted')
    );
    if (submission) return submission.status;
    
    return 'available';
  };

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#32303b]">{section.name}</h2>
          <p className="text-gray-600">{section.description}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Unless stated otherwise, food/toys only as a reward, not as a lure or encouragement.
        </p>
      </div>

      {sectionSkills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center text-gray-500">
          No skills found in this section.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionSkills.map(skill => {
            const status = getSkillStatus(skill.id);
            const statusColors = {
              completed: 'border-green-500 bg-green-50',
              requested: 'border-[#dcac6e] bg-[#dcac6e] bg-opacity-10',
              submitted: 'border-[#32303b] bg-[#32303b] bg-opacity-5',
              available: 'border-gray-200 bg-white'
            };
            
            return (
              <div
                key={skill.id}
                className={`border-2 rounded-lg p-4 ${statusColors[status]} ${
                  currentUser.role === 'member' ? 'cursor-pointer hover:shadow-lg hover:border-[#32303b]' : ''
                } transition`}
                onClick={() => currentUser.role === 'member' && setSelectedSkill(skill)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#32303b]">{skill.title}</h3>
                  {status === 'completed' && <Check className="w-5 h-5 text-green-600" />}
                  {status === 'requested' && <Clock className="w-5 h-5 text-[#dcac6e]" />}
                  {status === 'submitted' && <Upload className="w-5 h-5 text-[#32303b]" />}
                </div>
                <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {'⭐'.repeat(skill.difficulty)}
                    </span>
                    <span className="text-sm font-bold text-[#32303b]">{skill.points} pts</span>
                  </div>
                  {currentUser.role === 'member' && (
                    <span className="text-xs text-gray-500 capitalize">{status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSkill && currentUser.role === 'member' && (
        <SkillSubmissionModal
          skill={selectedSkill}
          onClose={() => {
            setSelectedSkill(null);
            loadSectionData();
          }}
        />
      )}
    </div>
  );
}

// ============= SKILL SUBMISSION MODAL =============
function SkillSubmissionModal({ skill, onClose }) {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [mode, setMode] = useState('class_request');
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      await api.createSubmission({
        user_id: currentUser.id,
        skill_id: skill.id,
        mode,
        video_url: mode === 'home_video' ? videoUrl : null,
        member_notes: notes
      });
      showToast('Skill submission sent!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
        <h3 className="text-xl font-bold text-[#32303b] mb-4">Submit: {skill.title}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#32303b] mb-2">Submission Type</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'class_request'}
                  onChange={() => setMode('class_request')}
                  className="w-4 h-4 accent-[#32303b]"
                />
                <span>Request Class Assessment</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'home_video'}
                  onChange={() => setMode('home_video')}
                  className="w-4 h-4 accent-[#32303b]"
                />
                <span>Submit Home Video</span>
              </label>
            </div>
          </div>

          {mode === 'home_video' && (
            <div>
              <label className="block text-sm font-medium text-[#32303b] mb-1">
                Video URL or Description
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                placeholder="YouTube link or description"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#32303b] mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

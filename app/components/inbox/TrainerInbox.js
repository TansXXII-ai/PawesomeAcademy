// app/components/inbox/TrainerInbox.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Check, Archive, ArchiveRestore } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';

export default function TrainerInbox() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [filter, setFilter] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      let data;
      
      if (filter === 'archived') {
        // Fetch only archived submissions
        const response = await fetch('/api/submissions?includeArchived=true');
        const allData = await response.json();
        data = allData.filter(s => s.archived === 1 || s.archived === true);
      } else {
        // Fetch non-archived submissions
        const statusFilter = filter === 'all' ? null : filter === 'pending' ? null : filter;
        data = await api.getSubmissions(null, statusFilter);
        
        if (filter === 'pending') {
          data = data.filter(s => s.status === 'requested' || s.status === 'submitted');
        }
      }
      
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (submissionId, decision, trainerNotes = '') => {
    try {
      await api.updateSubmission(submissionId, {
        status: decision,
        trainer_notes: trainerNotes,
        trainer_id: currentUser.id
      });
      
      showToast(`Submission ${decision}!`, decision === 'approved' ? 'success' : 'info');
      loadSubmissions();
    } catch (error) {
      showToast(error.message || 'Failed to update submission', 'error');
    }
  };

  const handleArchive = async (submissionId) => {
    try {
      await api.archiveSubmission(submissionId);
      showToast('Submission archived', 'success');
      loadSubmissions();
    } catch (error) {
      showToast(error.message || 'Failed to archive submission', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#32303b]">Trainer Inbox</h2>
            {filter === 'pending' && submissions.length > 0 && (
              <p className="text-sm text-[#dcac6e] mt-1">
                ⚡ {submissions.length} pending review{submissions.length !== 1 ? 's' : ''}
              </p>
            )}
            {filter === 'archived' && submissions.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {submissions.length} archived submission{submissions.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected', 'archived'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg capitalize transition font-medium text-sm border-2 ${
                  filter === f
                    ? 'bg-[#32303b] text-white border-[#dcac6e]'
                    : 'bg-gray-100 text-gray-700 hover:bg-[#dcac6e] hover:bg-opacity-20 border-transparent'
                }`}
              >
                {f === 'archived' && <Archive className="w-4 h-4 inline mr-1 -mt-0.5" />}
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center text-gray-500">
          {filter === 'archived' ? 'No archived submissions' : 'No submissions found'}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {submissions.map(submission => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onDecision={handleDecision}
              onArchive={handleArchive}
              isArchived={filter === 'archived'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============= COMPACT SUBMISSION CARD =============
function SubmissionCard({ submission, onDecision, onArchive, isArchived }) {
  const [notes, setNotes] = useState('');
  const [showDecision, setShowDecision] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const statusColors = {
    requested: 'bg-[#dcac6e] bg-opacity-10 border-[#dcac6e]',
    submitted: 'bg-[#32303b] bg-opacity-5 border-[#32303b]',
    approved: 'bg-green-50 border-green-300',
    rejected: 'bg-red-50 border-red-300'
  };

  const isPending = submission.status === 'requested' || submission.status === 'submitted';

  return (
    <div className={`border-2 rounded-lg p-4 ${statusColors[submission.status]} relative`}>
      {/* Header - Compact */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#32303b] text-base leading-tight truncate">
            {submission.member_name} - {submission.skill_title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 mt-1">
            <span>{submission.section_name}</span>
            <span>•</span>
            <span className="font-bold text-[#32303b]">{submission.skill_points} pts</span>
            <span>•</span>
            <span>{new Date(submission.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-1 rounded text-xs font-medium capitalize whitespace-nowrap ${
            submission.status === 'approved' ? 'bg-green-200 text-green-800' :
            submission.status === 'rejected' ? 'bg-red-200 text-red-800' :
            submission.status === 'submitted' ? 'bg-[#32303b] text-white' :
            'bg-[#dcac6e] text-[#32303b]'
          }`}>
            {submission.status}
          </span>
          {!isArchived ? (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="p-1.5 text-gray-400 hover:text-[#32303b] hover:bg-gray-100 rounded transition"
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-1.5 text-gray-400" title="Archived">
              <Archive className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Content - Compact Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
        <div>
          <span className="text-gray-500 text-xs">Type:</span>
          <p className="text-[#32303b] font-medium capitalize">{submission.mode.replace('_', ' ')}</p>
        </div>
        
        {submission.dog_name && (
          <div>
            <span className="text-gray-500 text-xs">Dog:</span>
            <p className="text-[#32303b] font-medium">{submission.dog_name}</p>
          </div>
        )}
      </div>

      {/* Notes - Collapsible sections */}
      {submission.video_url && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Video:</span>
          <p className="text-xs text-[#32303b] underline truncate">{submission.video_url}</p>
        </div>
      )}

      {submission.member_notes && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Member Notes:</span>
          <p className="text-sm text-gray-700 line-clamp-2">{submission.member_notes}</p>
        </div>
      )}

      {submission.trainer_notes && (
        <div className="mb-3">
          <span className="text-xs text-gray-500">Trainer Notes:</span>
          <p className="text-sm text-gray-700">{submission.trainer_notes}</p>
        </div>
      )}

      {/* Action Buttons - Compact */}
      {isPending && !isArchived && (
        <div className="pt-3 border-t border-gray-200">
          {!showDecision ? (
            <button
              onClick={() => setShowDecision(true)}
              className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition font-medium text-sm"
            >
              Review & Decide
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#dcac6e] rounded-lg text-sm focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                rows="2"
                placeholder="Trainer feedback..."
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { onDecision(submission.id, 'approved', notes); setShowDecision(false); }}
                  className="bg-green-600 text-white py-1.5 rounded-lg hover:bg-green-700 transition font-medium text-sm"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => { onDecision(submission.id, 'rejected', notes); setShowDecision(false); }}
                  className="bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 transition font-medium text-sm"
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => setShowDecision(false)}
                  className="bg-gray-200 text-gray-700 py-1.5 rounded-lg hover:bg-gray-300 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Archive Submission?</h3>
            <p className="text-gray-600 mb-6">
              This will move the submission to the archived view. You can view it anytime by clicking the "archived" filter.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onArchive(submission.id);
                  setShowArchiveConfirm(false);
                }}
                className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
              >
                Archive
              </button>
              <button
                onClick={() => setShowArchiveConfirm(false)}
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

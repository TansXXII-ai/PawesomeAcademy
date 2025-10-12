// app/components/inbox/TrainerInbox.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Check, Archive } from 'lucide-react';
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
      const statusFilter = filter === 'all' ? null : filter === 'pending' ? null : filter;
      const data = await api.getSubmissions(null, statusFilter);
      
      let filtered = data;
      if (filter === 'pending') {
        filtered = data.filter(s => s.status === 'requested' || s.status === 'submitted');
      }
      
      // Submissions are already sorted by API (pending first, then by date)
      setSubmissions(filtered);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#32303b]">Trainer Inbox</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition font-medium border-2 ${
                filter === f
                  ? 'bg-[#32303b] text-white border-[#dcac6e]'
                  : 'bg-gray-200 text-gray-700 hover:bg-[#dcac6e] hover:bg-opacity-20 border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filter === 'pending' && submissions.length > 0 && (
        <div className="bg-[#dcac6e] bg-opacity-20 border-2 border-[#dcac6e] rounded-lg p-4">
          <p className="text-sm text-[#32303b] font-medium">
            ⚡ {submissions.length} pending submission{submissions.length !== 1 ? 's' : ''} waiting for review
          </p>
        </div>
      )}

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center text-gray-500">
            No submissions found
          </div>
        ) : (
          submissions.map(submission => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onDecision={handleDecision}
              onArchive={handleArchive}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============= SUBMISSION CARD =============
function SubmissionCard({ submission, onDecision, onArchive }) {
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
    <div className={`border-2 rounded-lg p-6 ${statusColors[submission.status]} relative`}>
      {/* Archive button - top right */}
      <button
        onClick={() => setShowArchiveConfirm(true)}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#32303b] hover:bg-gray-100 rounded-lg transition"
        title="Archive this submission"
      >
        <Archive className="w-5 h-5" />
      </button>

      <div className="flex justify-between items-start mb-4 pr-12">
        <div>
          <h3 className="text-lg font-bold text-[#32303b]">
            {submission.member_name} - {submission.skill_title}
          </h3>
          <p className="text-sm text-gray-600">{submission.section_name} • {submission.skill_points} points</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
          submission.status === 'approved' ? 'bg-green-200 text-green-800' :
          submission.status === 'rejected' ? 'bg-red-200 text-red-800' :
          submission.status === 'submitted' ? 'bg-[#32303b] text-white' :
          'bg-[#dcac6e] text-[#32303b]'
        }`}>
          {submission.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[#32303b]">Type:</p>
          <p className="text-sm text-gray-600 capitalize">{submission.mode.replace('_', ' ')}</p>
        </div>

        {submission.video_url && (
          <div>
            <p className="text-sm font-medium text-[#32303b]">Video:</p>
            <p className="text-sm text-[#32303b] underline break-all">{submission.video_url}</p>
          </div>
        )}

        {submission.member_notes && (
          <div>
            <p className="text-sm font-medium text-[#32303b]">Member Notes:</p>
            <p className="text-sm text-gray-600">{submission.member_notes}</p>
          </div>
        )}

        {submission.trainer_notes && (
          <div>
            <p className="text-sm font-medium text-[#32303b]">Trainer Notes:</p>
            <p className="text-sm text-gray-600">{submission.trainer_notes}</p>
          </div>
        )}

        {submission.dog_name && (
          <div>
            <p className="text-sm font-medium text-[#32303b]">Dog:</p>
            <p className="text-sm text-gray-600">{submission.dog_name}</p>
          </div>
        )}

        {isPending && (
          <div>
            {!showDecision ? (
              <button
                onClick={() => setShowDecision(true)}
                className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition font-medium"
              >
                Review & Decide
              </button>
            ) : (
              <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#dcac6e] rounded-lg h-20 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="Trainer feedback..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => { onDecision(submission.id, 'approved', notes); setShowDecision(false); }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => { onDecision(submission.id, 'rejected', notes); setShowDecision(false); }}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => setShowDecision(false)}
                    className="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Archive Submission?</h3>
            <p className="text-gray-600 mb-6">
              This will remove the submission from your main inbox. You can still view archived submissions if needed.
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

// app/components/dashboard/components/GradeRequestModal.js
'use client';
import React, { useContext } from 'react';
import { Check } from 'lucide-react';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';

export default function GradeRequestModal({ 
  currentUser, 
  progress, 
  currentGrade, 
  gradeReq, 
  onClose, 
  onSuccess 
}) {
  const { showToast } = useContext(ToastContext);

  const handleRequestGrade = async () => {
    try {
      const achievement = await api.achieveGrade({
        user_id: currentUser.id,
        grade_number: currentGrade,
        completion_ids: progress.completionIds,
      });

      const gradeId = achievement?.grade_id;
      if (!gradeId) {
        throw new Error('Unable to record grade achievement');
      }

      await api.requestCertificate({
        user_id: currentUser.id,
        grade_number: currentGrade
      });
      
      showToast(`Grade ${currentGrade} request submitted!`, 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast(error.message || 'Failed to request grade', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
        <h3 className="text-xl font-bold text-[#32303b] mb-4">
          Request Grade {currentGrade} Approval
        </h3>
        <p className="text-gray-600 mb-4">
          You've completed all requirements for Grade {currentGrade}:
        </p>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center space-x-2 text-green-700">
            <Check className="w-5 h-5" />
            <span>{progress.totalPoints} points (required: {gradeReq})</span>
          </li>
        </ul>
        <p className="text-sm text-gray-600 mb-6">
          Your trainer will review and approve your grade completion. The {progress.totalPoints} points you've earned will be locked to this grade and you'll start fresh for Grade {currentGrade + 1}.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={handleRequestGrade}
            className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
          >
            Submit Request
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

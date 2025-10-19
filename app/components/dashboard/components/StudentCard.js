// app/components/dashboard/components/StudentCard.js
'use client';
import React from 'react';
import { Award, ChevronRight } from 'lucide-react';

export default function StudentCard({ student, onClick }) {
  const progress = student.progress || {};
  const currentGrade = progress.current_grade || 0;
  const nextGrade = currentGrade + 1;
  const pointsRequired = progress.points_required || 20;
  const totalPoints = progress.total_points || 0;
  const progressPercent = Math.min((totalPoints / pointsRequired) * 100, 100);
  const canCertify = progressPercent >= 100;

  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-[#dcac6e] rounded-lg p-4 hover:shadow-lg hover:border-[#32303b] transition text-left w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-[#32303b] text-lg">{student.dog_name}</h4>
          <p className="text-sm text-gray-600">{student.owners}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#32303b]">
            {currentGrade > 0 ? currentGrade : '-'}
          </div>
          <div className="text-xs text-gray-500">Grade</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">
            Progress to Grade {nextGrade > 12 ? 12 : nextGrade}
          </span>
          <span className="text-xs font-medium text-gray-700">
            {totalPoints}/{pointsRequired}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              canCertify ? 'bg-gradient-to-r from-[#32303b] to-[#dcac6e]' : 'bg-[#32303b]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
        <div className="bg-white rounded p-2 border border-gray-200">
          <div className="font-bold text-purple-600">{progress.sections_with_skills || 0}/6</div>
          <div className="text-gray-600">Sections</div>
        </div>
        <div className="bg-white rounded p-2 border border-gray-200">
          <div className="font-bold text-orange-600">{student.pending_submissions || 0}</div>
          <div className="text-gray-600">Pending</div>
        </div>
      </div>

      {canCertify && (
        <div className="bg-[#dcac6e] bg-opacity-20 border border-[#dcac6e] rounded px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-medium text-[#32303b]">Ready for Certificate</span>
          <Award className="w-4 h-4 text-[#32303b]" />
        </div>
      )}

      <div className="mt-3 flex items-center justify-end text-[#32303b]">
        <span className="text-xs font-medium">View Details</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  );
}

// app/components/dashboard/components/LeaderBoard.js
'use client';
import React from 'react';
import { Trophy } from 'lucide-react';

export default function LeaderBoard({ classObj }) {
  const getTopStudents = () => {
    if (!classObj || !classObj.students) return [];
    return [...classObj.students]
      .sort((a, b) => {
        const gradeA = a.progress?.current_grade || 0;
        const gradeB = b.progress?.current_grade || 0;
        if (gradeB !== gradeA) return gradeB - gradeA;
        return (b.progress?.total_points || 0) - (a.progress?.total_points || 0);
      })
      .slice(0, 5);
  };

  const topStudents = getTopStudents();

  if (topStudents.length === 0) return null;

  return (
    <div className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-[#dcac6e] rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Trophy className="w-5 h-5 text-[#dcac6e]" />
        <h4 className="font-bold text-[#32303b]">Class Leaders</h4>
      </div>
      <div className="space-y-2">
        {topStudents.map((student, idx) => {
          const medalColors = {
            0: 'bg-gradient-to-br from-[#dcac6e] to-[#c49654] border-2 border-[#b8935d]',
            1: 'bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600',
            2: 'bg-gradient-to-br from-[#b8935d] to-[#8b6f45] border-2 border-[#6d5436]'
          };

          return (
            <div key={student.user_id} className="flex items-center space-x-3 bg-white rounded p-2 border border-[#dcac6e]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                medalColors[idx] || 'bg-gray-300'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#32303b]">{student.dog_name}</p>
                <p className="text-xs text-gray-500">{student.owners}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#32303b]">Grade {student.progress?.current_grade || 0}</p>
                <p className="text-xs text-gray-500">{student.progress?.total_points || 0} pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

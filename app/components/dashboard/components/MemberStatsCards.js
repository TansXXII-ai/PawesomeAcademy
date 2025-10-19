// app/components/dashboard/components/MemberStatsCards.js
'use client';
import React from 'react';
import { Award, Star, Trophy, Book } from 'lucide-react';

export default function MemberStatsCards({ currentGrade, progress, gradeReq, allTimeStats }) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-[#32303b] to-[#43414d] text-white rounded-lg shadow-lg p-4 border-2 border-[#dcac6e]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-90">Current Grade</span>
          <Award className="w-6 h-6 text-[#dcac6e]" />
        </div>
        <p className="text-4xl font-bold">Grade {currentGrade}</p>
      </div>

      <div className="bg-gradient-to-br from-[#dcac6e] to-[#c49654] text-[#32303b] rounded-lg shadow-lg p-4 border-2 border-[#c49654]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-90">Current Points</span>
          <Star className="w-6 h-6" />
        </div>
        <p className="text-3xl font-bold">{progress.totalPoints} / {gradeReq}</p>
        <p className="text-xs opacity-75 mt-1">
          {gradeReq - progress.totalPoints > 0 
            ? `${gradeReq - progress.totalPoints} more needed` 
            : 'Ready for grade!'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-4 border-2 border-purple-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-90">Total Points Ever</span>
          <Trophy className="w-6 h-6 opacity-80" />
        </div>
        <p className="text-4xl font-bold">{allTimeStats.total_points}</p>
        <p className="text-xs opacity-75 mt-1">
          {allTimeStats.total_skills} skills completed
        </p>
      </div>

      <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-lg p-4 border-2 border-[#dcac6e]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-90">Sections</span>
          <Book className="w-6 h-6 text-[#dcac6e]" />
        </div>
        <p className="text-4xl font-bold">{progress.sectionsWithSkills.length} / 6</p>
      </div>
    </div>
  );
}

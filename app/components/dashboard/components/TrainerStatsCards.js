// app/components/dashboard/components/TrainerStatsCards.js
'use client';
import React from 'react';
import { User, Book, Clock, Award } from 'lucide-react';

export default function TrainerStatsCards({ 
  totalStudents, 
  totalClasses, 
  pendingReviews, 
  readyForCert,
  showMyClassesOnly 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-[#32303b] to-[#43414d] text-white rounded-lg shadow-lg p-4 border-2 border-[#dcac6e]">
        <div className="flex items-center justify-between mb-2">
          <User className="w-6 h-6 text-[#dcac6e]" />
        </div>
        <p className="text-3xl font-bold">{totalStudents}</p>
        <p className="text-sm opacity-90">
          {showMyClassesOnly ? 'My Students' : 'Total Students'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#dcac6e] to-[#c49654] text-[#32303b] rounded-lg shadow-lg p-4 border-2 border-[#c49654]">
        <div className="flex items-center justify-between mb-2">
          <Book className="w-6 h-6" />
        </div>
        <p className="text-3xl font-bold">{totalClasses || 0}</p>
        <p className="text-sm opacity-90">Classes</p>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-4 border-2 border-orange-700">
        <div className="flex items-center justify-between mb-2">
          <Clock className="w-6 h-6 opacity-80" />
        </div>
        <p className="text-3xl font-bold">{pendingReviews}</p>
        <p className="text-sm opacity-90">Pending Reviews</p>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-4 border-2 border-green-700">
        <div className="flex items-center justify-between mb-2">
          <Award className="w-6 h-6 opacity-80" />
        </div>
        <p className="text-3xl font-bold">{readyForCert}</p>
        <p className="text-sm opacity-90">Ready for Cert</p>
      </div>
    </div>
  );
}

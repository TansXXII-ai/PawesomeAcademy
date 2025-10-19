// app/components/dashboard/components/ClassSelector.js
'use client';
import React from 'react';

export default function ClassSelector({ classes, selectedClass, onSelectClass }) {
  return (
    <div className="border-b border-[#dcac6e] flex overflow-x-auto">
      {classes.map(cls => (
        <button
          key={cls.id}
          onClick={() => onSelectClass(cls)}
          className={`px-6 py-4 whitespace-nowrap font-medium transition ${
            selectedClass?.id === cls.id
              ? 'border-b-4 border-[#32303b] text-[#32303b] bg-[#dcac6e] bg-opacity-10'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="text-left">
            <div className="font-bold">{cls.name}</div>
            <div className="text-xs opacity-75">
              {cls.day_of_week} • {cls.time_slot} • {cls.students?.length || cls.student_count || 0} students
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

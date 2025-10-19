// app/components/dashboard/components/SectionProgressCard.js
'use client';
import React from 'react';
import { Check } from 'lucide-react';

export default function SectionProgressCard({ sections, progress }) {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
      <h3 className="text-xl font-bold text-[#32303b] mb-4">Section Progress</h3>
      <div className="space-y-4">
        {sections.filter(s => s.active).map(section => {
          const sectionPoints = progress.sectionPoints[section.id] || 0;
          const hasSkill = progress.sectionsWithSkills.includes(section.id);
          const sectionCompletions = progress.sectionCompletionCounts?.[section.id] || 0;
          
          return (
            <div key={section.id}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-[#32303b]">{section.name}</span>
                  {hasSkill && <Check className="w-4 h-4 text-green-600" />}
                </div>
                <span className="text-sm text-gray-600">
                  {sectionPoints} pts (current) • {sectionCompletions} skills (total)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 border border-gray-300">
                <div
                  className={`h-3 rounded-full transition-all ${
                    hasSkill ? 'bg-gradient-to-r from-[#32303b] to-[#dcac6e]' : 'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min((sectionPoints / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

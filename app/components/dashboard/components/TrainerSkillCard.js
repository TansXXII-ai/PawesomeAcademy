// app/components/dashboard/components/TrainerSkillCard.js
'use client';
import React from 'react';
import { Check, Clock, CheckSquare, Square } from 'lucide-react';

export default function TrainerSkillCard({ 
  skill, 
  onClick, 
  multiSelectMode = false, 
  isSelected = false, 
  onToggleSelect 
}) {
  const statusConfig = {
    completed: {
      bg: 'bg-green-50 border-green-300',
      icon: Check,
      iconColor: 'text-green-600',
      text: 'Completed'
    },
    pending: {
      bg: 'bg-[#dcac6e] bg-opacity-10 border-[#dcac6e]',
      icon: Clock,
      iconColor: 'text-[#dcac6e]',
      text: 'Pending Review'
    },
    available: {
      bg: 'bg-white border-gray-200',
      icon: null,
      iconColor: '',
      text: 'Not Started'
    }
  };

  const config = statusConfig[skill.status] || statusConfig.available;
  const Icon = config.icon;

  const handleClick = () => {
    if (multiSelectMode) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!multiSelectMode && skill.status === 'completed'}
      className={`${config.bg} ${isSelected ? 'ring-2 ring-[#32303b]' : ''} border-2 rounded-lg p-3 text-left hover:shadow-md transition ${
        skill.status === 'completed' && !multiSelectMode ? 'cursor-default opacity-75' : 'cursor-pointer hover:border-[#32303b]'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1">
          {multiSelectMode && skill.status !== 'completed' && (
            <div>
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-[#32303b]" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}
          <h4 className="font-bold text-[#32303b] text-sm flex-1">{skill.title}</h4>
        </div>
        {Icon && !multiSelectMode && <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0 ml-2`} />}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
            {'⭐'.repeat(skill.difficulty)}
          </span>
          <span className="text-sm font-bold text-[#32303b]">{skill.points} pts</span>
        </div>
        <span className="text-xs text-gray-500">{config.text}</span>
      </div>
    </button>
  );
}

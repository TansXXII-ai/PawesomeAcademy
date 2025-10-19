// app/components/dashboard/MemberDashboard.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/app/page';
import MemberStatsCards from './components/MemberStatsCards';
import SectionProgressCard from './components/SectionProgressCard';
import GradeRequestModal from './components/GradeRequestModal';

export default function MemberDashboard({ profile, progress, currentUser, onReload }) {
  const { sections } = useContext(AppContext);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [allTimeStats, setAllTimeStats] = useState({ total_points: 0, total_skills: 0 });

  useEffect(() => {
    loadAllTimeStats();
  }, [currentUser]);

  const loadAllTimeStats = async () => {
    try {
      const response = await fetch(`/api/completions/all-time?userId=${currentUser.id}`);
      const data = await response.json();
      setAllTimeStats(data);
    } catch (error) {
      console.error('Failed to load all-time stats:', error);
    }
  };

  if (!progress) {
    return <div className="text-center py-8">Failed to load progress data</div>;
  }

  const gradeReq = progress.pointsRequired;
  const currentGrade = progress.currentGrade;
  const hasEnoughPoints = progress.totalPoints >= gradeReq;
  const canRequestGrade = hasEnoughPoints;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <h2 className="text-2xl font-bold text-[#32303b] mb-4">
          Welcome back, {currentUser.username}!
        </h2>
        {profile && <p className="text-gray-600">Training {profile.dog_name}</p>}
      </div>

      {/* Stats Cards */}
      <MemberStatsCards 
        currentGrade={currentGrade}
        progress={progress}
        gradeReq={gradeReq}
        allTimeStats={allTimeStats}
      />

      {/* Grade Request Banner */}
      {canRequestGrade && (
        <div className="bg-[#dcac6e] bg-opacity-20 border-2 border-[#dcac6e] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#32303b] mb-2">
                🎉 Ready for Grade {currentGrade}!
              </h3>
              <p className="text-[#32303b] text-sm">
                You've earned {progress.totalPoints} points (required: {gradeReq}). Request approval from your trainer.
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-[#32303b] text-white px-6 py-3 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition font-medium shadow-lg whitespace-nowrap"
            >
              Request Grade Approval
            </button>
          </div>
        </div>
      )}

      {/* Progress Banner */}
      {!hasEnoughPoints && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {gradeReq - progress.totalPoints}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-blue-900">
                Keep Going! You're making great progress!
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Complete <strong>{gradeReq - progress.totalPoints} more points</strong> to reach Grade {currentGrade} requirement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section Progress */}
      <SectionProgressCard 
        sections={sections}
        progress={progress}
      />

      {/* Grade Request Modal */}
      {showRequestModal && (
        <GradeRequestModal
          currentUser={currentUser}
          progress={progress}
          currentGrade={currentGrade}
          gradeReq={gradeReq}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            if (onReload) onReload();
          }}
        />
      )}
    </div>
  );
}

// app/components/dashboard/TrainerAdminDashboard.js
'use client';
import React, { useState, useEffect } from 'react';
import TrainerStatsCards from './components/TrainerStatsCards';
import ClassSelector from './components/ClassSelector';
import LeaderBoard from './components/LeaderBoard';
import StudentCard from './components/StudentCard';

export default function TrainerAdminDashboard({ 
  currentUser, 
  classData, 
  selectedClass, 
  setSelectedClass,
  onViewStudent 
}) {
  const [showMyClassesOnly, setShowMyClassesOnly] = useState(currentUser.role === 'trainer');
  
  // Filter classes based on toggle
  const filteredClasses = showMyClassesOnly
    ? classData?.classes.filter(cls => cls.trainer_id === currentUser.id) || []
    : classData?.classes || [];

  const totalStudents = filteredClasses.reduce(
    (sum, cls) => sum + (cls.students?.length || cls.student_count || 0), 0
  );
  
  const pendingReviews = filteredClasses.reduce((sum, cls) => 
    sum + (cls.students?.reduce((s, st) => s + (st.pending_submissions || 0), 0) || 0), 0
  );
  
  const readyForCert = filteredClasses.reduce((sum, cls) => 
    sum + (cls.students?.filter(st => 
      (st.progress?.total_points || 0) >= (st.progress?.points_required || 20)
    ).length || 0), 0
  );

  // Update selected class when filter changes
  useEffect(() => {
    if (filteredClasses.length > 0 && !filteredClasses.find(c => c.id === selectedClass?.id)) {
      setSelectedClass(filteredClasses[0]);
    }
  }, [showMyClassesOnly, filteredClasses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#32303b]">
              {currentUser.role === 'admin' ? 'Training Overview' : 'Classes'}
            </h2>
            <p className="text-gray-600">
              Welcome back, {classData?.trainer_name || currentUser.username}
            </p>
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMyClassesOnly}
                onChange={(e) => setShowMyClassesOnly(e.target.checked)}
                className="w-4 h-4 accent-[#32303b]"
              />
              <span className="text-sm font-medium text-[#32303b]">
                My Classes Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <TrainerStatsCards
        totalStudents={totalStudents}
        totalClasses={filteredClasses.length}
        pendingReviews={pendingReviews}
        readyForCert={readyForCert}
        showMyClassesOnly={showMyClassesOnly}
      />

      {/* Class View */}
      {filteredClasses && filteredClasses.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e]">
          <ClassSelector
            classes={filteredClasses}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
          />

          {selectedClass && (
            <div className="p-6">
              {/* Top Performers */}
              <LeaderBoard 
                classObj={selectedClass}
              />

              {/* Full Roster */}
              <h4 className="font-bold text-[#32303b] mb-3">Full Roster</h4>
              {selectedClass.students && selectedClass.students.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedClass.students.map(student => (
                    <StudentCard 
                      key={student.user_id} 
                      student={student}
                      onClick={() => onViewStudent(student)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No students enrolled in this class yet.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center">
          <p className="text-gray-600 mb-2">
            {showMyClassesOnly 
              ? 'You have no classes assigned yet.' 
              : 'No classes have been created yet.'}
          </p>
          <p className="text-sm text-gray-500">
            {showMyClassesOnly
              ? 'Uncheck "My Classes Only" to see all classes or contact an administrator.'
              : currentUser.role === 'admin'
                ? 'Create a class to get started.'
                : 'Contact an administrator to be assigned to a class.'}
          </p>
        </div>
      )}
    </div>
  );
}

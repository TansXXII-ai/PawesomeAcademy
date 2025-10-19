// app/components/leaderboard/LeaderboardView.js - REPLACE ENTIRE FILE
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { AppContext } from '@/app/page';
import { api } from '@/lib/api';

export default function LeaderboardView() {
  const { currentUser } = useContext(AppContext);
  const [classData, setClassData] = useState(null);
  const [selectedView, setSelectedView] = useState('overall');
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMyClassesOnly, setShowMyClassesOnly] = useState(currentUser.role === 'trainer');

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const data = currentUser.role === 'admin' 
        ? await api.getAllClasses() 
        : await api.getMyStudents();
      
      if (currentUser.role === 'admin') {
        setClassData({ classes: data });
        if (data.length > 0) {
          setSelectedClass(data[0]);
        }
      } else {
        setClassData(data);
        if (data.classes && data.classes.length > 0) {
          setSelectedClass(data.classes[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllStudents = () => {
    if (!classData || !classData.classes) return [];
    
    // Filter classes based on toggle
    const classesToShow = showMyClassesOnly && currentUser.role === 'admin'
      ? classData.classes.filter(cls => cls.trainer_id === currentUser.id)
      : classData.classes;
    
    const allStudents = [];
    classesToShow.forEach(cls => {
      if (cls.students) {
        cls.students.forEach(student => {
          allStudents.push({
            ...student,
            class_name: cls.name
          });
        });
      }
    });
    return allStudents.sort((a, b) => {
      const gradeA = a.progress?.current_grade || 0;
      const gradeB = b.progress?.current_grade || 0;
      if (gradeB !== gradeA) return gradeB - gradeA;
      return (b.progress?.total_points || 0) - (a.progress?.total_points || 0);
    });
  };

  const getClassStudents = (classObj) => {
    if (!classObj || !classObj.students) return [];
    return [...classObj.students].sort((a, b) => {
      const gradeA = a.progress?.current_grade || 0;
      const gradeB = b.progress?.current_grade || 0;
      if (gradeB !== gradeA) return gradeB - gradeA;
      return (b.progress?.total_points || 0) - (a.progress?.total_points || 0);
    });
  };

  // Get filtered classes for the class selector
  const getFilteredClasses = () => {
    if (!classData || !classData.classes) return [];
    if (showMyClassesOnly && currentUser.role === 'admin') {
      return classData.classes.filter(cls => cls.trainer_id === currentUser.id);
    }
    return classData.classes;
  };

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  const overallStudents = getAllStudents();
  const classStudents = selectedClass ? getClassStudents(selectedClass) : [];
  const filteredClasses = getFilteredClasses();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#32303b]">Leaderboard</h2>
            <p className="text-gray-600">Top performing students</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Filter Toggle - Only show for admins */}
            {currentUser.role === 'admin' && (
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
            )}
            <Trophy className="w-12 h-12 text-[#dcac6e]" />
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedView('overall')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            selectedView === 'overall'
              ? 'bg-[#32303b] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-[#dcac6e] hover:bg-opacity-20'
          }`}
        >
          Overall
        </button>
        <button
          onClick={() => setSelectedView('class')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            selectedView === 'class'
              ? 'bg-[#32303b] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-[#dcac6e] hover:bg-opacity-20'
          }`}
        >
          By Class
        </button>
      </div>

      {selectedView === 'class' && filteredClasses.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-4">
          <label className="block text-sm font-medium text-[#32303b] mb-2">Select Class</label>
          <select
            value={selectedClass?.id || ''}
            onChange={(e) => {
              const cls = filteredClasses.find(c => c.id === parseInt(e.target.value));
              setSelectedClass(cls);
            }}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
          >
            {filteredClasses.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.day_of_week} {cls.time_slot}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e]">
        <div className="p-6 border-b border-[#dcac6e]">
          <h3 className="text-xl font-bold text-[#32303b]">
            {selectedView === 'overall' ? 'Overall Rankings' : `${selectedClass?.name || 'Class'} Rankings`}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Sorted by grade level and total points
            {showMyClassesOnly && currentUser.role === 'admin' && ' (My Classes Only)'}
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {(selectedView === 'overall' ? overallStudents : classStudents).map((student, idx) => (
              <LeaderboardRow 
                key={student.user_id} 
                student={student} 
                rank={idx + 1} 
                showClass={selectedView === 'overall'} 
              />
            ))}
            {(selectedView === 'overall' ? overallStudents : classStudents).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {showMyClassesOnly && currentUser.role === 'admin'
                  ? 'No students in your classes yet.'
                  : 'No students found'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= LEADERBOARD ROW =============
function LeaderboardRow({ student, rank, showClass }) {
  const progress = student.progress || {};
  const currentGrade = progress.current_grade || 0;
  const totalPoints = progress.total_points || 0;
  
  const medalColors = {
    1: 'bg-gradient-to-br from-[#dcac6e] to-[#c49654] border-2 border-[#b8935d]',
    2: 'bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600',
    3: 'bg-gradient-to-br from-[#b8935d] to-[#8b6f45] border-2 border-[#6d5436]'
  };

  return (
    <div className={`flex items-center space-x-4 p-4 rounded-lg ${
      rank <= 3 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-[#dcac6e]' : 'bg-gray-50 border-2 border-gray-200'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${
        medalColors[rank] || 'bg-gray-400'
      }`}>
        {rank <= 3 ? <Trophy className="w-6 h-6" /> : rank}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-bold text-[#32303b]">{student.dog_name}</h4>
          {rank === 1 && <span className="text-xs bg-[#dcac6e] text-[#32303b] px-2 py-1 rounded-full font-medium">Champion</span>}
        </div>
        <p className="text-sm text-gray-600">{student.owners}</p>
        {showClass && <p className="text-xs text-gray-500">{student.class_name}</p>}
      </div>

      <div className="text-center px-4">
        <div className="text-2xl font-bold text-[#32303b]">{currentGrade}</div>
        <div className="text-xs text-gray-500">Grade</div>
      </div>

      <div className="text-center px-4">
        <div className="text-lg font-bold text-[#dcac6e]">{totalPoints}</div>
        <div className="text-xs text-gray-500">Points</div>
      </div>

      <div className="text-center px-4">
        <div className="text-lg font-bold text-green-600">{progress.sections_with_skills || 0}/6</div>
        <div className="text-xs text-gray-500">Sections</div>
      </div>
    </div>
  );
}

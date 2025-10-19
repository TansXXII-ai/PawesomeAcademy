// app/components/dashboard/Dashboard.js - REFACTORED MAIN FILE
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/app/page';
import { api } from '@/lib/api';
import MemberDashboard from './MemberDashboard';
import TrainerAdminDashboard from './TrainerAdminDashboard';
import StudentDetailView from './StudentDetailView';

export default function Dashboard() {
  const { currentUser } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [classData, setClassData] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentView, setStudentView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (currentUser.role === 'member') {
        const [profileData, progressData] = await Promise.all([
          api.getProfile(currentUser.id).catch(() => null),
          api.getGradeProgress(currentUser.id)
        ]);
        setProfile(profileData);
        setProgress(progressData);
      } else {
        const [classesData] = await Promise.all([
          api.getMyStudents()
        ]);
        setClassData(classesData);
        
        if (classesData.classes && classesData.classes.length > 0) {
          setSelectedClass(classesData.classes[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (student) => {
    setLoading(true);
    try {
      const details = await api.getStudentDetails(student.user_id);
      setSelectedStudent(details);
      setStudentView(true);
    } catch (error) {
      console.error('Failed to load student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromStudent = () => {
    setStudentView(false);
    setSelectedStudent(null);
    loadDashboardData();
  };

  if (loading && !profile && !classData) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  // Student Detail View
  if (studentView && selectedStudent) {
    return (
      <StudentDetailView
        student={selectedStudent}
        onBack={handleBackFromStudent}
      />
    );
  }

  // Member Dashboard
  if (currentUser.role === 'member') {
    return (
      <MemberDashboard 
        profile={profile} 
        progress={progress} 
        currentUser={currentUser}
        onReload={loadDashboardData}
      />
    );
  }

  // Trainer/Admin Dashboard
  return (
    <TrainerAdminDashboard
      currentUser={currentUser}
      classData={classData}
      selectedClass={selectedClass}
      setSelectedClass={setSelectedClass}
      onViewStudent={handleViewStudent}
    />
  );
}

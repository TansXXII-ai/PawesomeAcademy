// app/components/dashboard/Dashboard.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Award, Book, User, Star, Check, Clock, Upload, ChevronRight, Trophy, CheckSquare, Square } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';
import { gradeRequirements, getRoleDisplayName } from '@/lib/constants';

export default function Dashboard() {
  const { currentUser, sections, skills } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [submissions, setSubmissions] = useState([]);
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
        const [submissionsData, classesData] = await Promise.all([
          api.getSubmissions(null, null, currentUser.role === 'trainer'),
          currentUser.role === 'admin' ? api.getAllClasses() : api.getMyStudents()
        ]);
        setSubmissions(submissionsData);
        
        if (currentUser.role === 'admin') {
          const formattedClasses = classesData.map(cls => ({
            ...cls,
            students: [],
            student_count: cls.member_count || 0
          }));
          setClassData({ classes: formattedClasses });
          if (formattedClasses.length > 0) {
            setSelectedClass(formattedClasses[0]);
          }
        } else {
          setClassData(classesData);
          if (classesData.classes && classesData.classes.length > 0) {
            setSelectedClass(classesData.classes[0]);
          }
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

  if (loading && !profile && !classData) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (studentView && selectedStudent) {
    return (
      <StudentDetailView
        student={selectedStudent}
        onBack={() => {
          setStudentView(false);
          setSelectedStudent(null);
          loadDashboardData();
        }}
      />
    );
  }

  if (currentUser.role === 'member') {
    return <MemberDashboard 
      profile={profile} 
      progress={progress} 
      sections={sections} 
      currentUser={currentUser}
    />;
  }

  return (
    <TrainerAdminDashboard
      currentUser={currentUser}
      classData={classData}
      selectedClass={selectedClass}
      setSelectedClass={setSelectedClass}
      submissions={submissions}
      sections={sections}
      skills={skills}
      onViewStudent={handleViewStudent}
    />
  );
}

// ============= MEMBER DASHBOARD =============
function MemberDashboard({ profile, progress, sections, currentUser }) {
  const { showToast } = useContext(ToastContext);
  const [showRequestModal, setShowRequestModal] = useState(false);

  if (!progress) {
    return <div className="text-center py-8">Failed to load progress data</div>;
  }

  const gradeReq = progress.pointsRequired;
  const currentGrade = progress.currentGrade;
  const hasEnoughPoints = progress.totalPoints >= gradeReq;
  const canRequestGrade = hasEnoughPoints;

  const handleRequestGrade = async () => {
    try {
      const achievement = await api.achieveGrade({
        user_id: currentUser.id,
        grade_number: currentGrade,
        completion_ids: progress.completionIds,
      });

      const gradeId = achievement?.grade_id;
      if (!gradeId) {
        throw new Error('Unable to record grade achievement');
      }

      await api.requestCertificate({
        user_id: currentUser.id,
        grade_number: currentGrade
      });
      
      showToast(`Grade ${currentGrade} request submitted!`, 'success');
      setShowRequestModal(false);
      window.location.reload();
    } catch (error) {
      showToast(error.message || 'Failed to request grade', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <h2 className="text-2xl font-bold text-[#32303b] mb-4">
          Welcome back, {currentUser.username}!
        </h2>
        {profile && <p className="text-gray-600">Training {profile.dog_name}</p>}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#32303b] to-[#43414d] text-white rounded-lg shadow-lg p-6 border-2 border-[#dcac6e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Current Grade</span>
            <Award className="w-6 h-6 text-[#dcac6e]" />
          </div>
          <p className="text-4xl font-bold">Grade {currentGrade}</p>
        </div>

        <div className="bg-gradient-to-br from-[#dcac6e] to-[#c49654] text-[#32303b] rounded-lg shadow-lg p-6 border-2 border-[#c49654]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Points Progress</span>
            <Star className="w-6 h-6" />
          </div>
          <p className="text-4xl font-bold">{progress.totalPoints} / {gradeReq}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-lg p-6 border-2 border-[#dcac6e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Sections Complete</span>
            <Book className="w-6 h-6 text-[#dcac6e]" />
          </div>
          <p className="text-4xl font-bold">{progress.sectionsWithSkills.length} / 6</p>
        </div>
      </div>

      {canRequestGrade && (
        <div className="bg-[#dcac6e] bg-opacity-20 border-2 border-[#dcac6e] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#32303b] mb-2">
                Ready for Grade {currentGrade}!
              </h3>
              <p className="text-[#32303b] text-sm">
                You've earned {progress.totalPoints} points (required: {gradeReq}). Request approval from your trainer.
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-[#32303b] text-white px-6 py-3 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition font-medium shadow-lg"
            >
              Request Grade Approval
            </button>
          </div>
        </div>
      )}

      {!hasEnoughPoints && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Need {gradeReq - progress.totalPoints} more points</strong> to reach Grade {currentGrade} requirement.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <h3 className="text-xl font-bold text-[#32303b] mb-4">Section Progress</h3>
        <div className="space-y-4">
          {sections.filter(s => s.active).map(section => {
            const sectionPoints = progress.sectionPoints[section.id] || 0;
            const hasSkill = progress.sectionsWithSkills.includes(section.id);
            return (
              <div key={section.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[#32303b]">{section.name}</span>
                  <span className="text-sm text-gray-600">
                    {sectionPoints} pts {hasSkill ? '✓' : ''}
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

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
            <h3 className="text-xl font-bold text-[#32303b] mb-4">Request Grade {currentGrade} Approval</h3>
            <p className="text-gray-600 mb-4">
              You've completed all requirements for Grade {currentGrade}:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center space-x-2 text-green-700">
                <Check className="w-5 h-5" />
                <span>{progress.totalPoints} points (required: {gradeReq})</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 mb-6">
              Your trainer will review and approve your grade completion.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRequestGrade}
                className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= TRAINER/ADMIN DASHBOARD =============
function TrainerAdminDashboard({ 
  currentUser, 
  classData, 
  selectedClass, 
  setSelectedClass,
  submissions,
  sections,
  skills,
  onViewStudent 
}) {
  const totalStudents = classData?.classes.reduce((sum, cls) => sum + cls.student_count, 0) || 0;
  const pendingReviews = classData?.classes.reduce((sum, cls) => 
    sum + (cls.students?.reduce((s, st) => s + st.pending_submissions, 0) || 0), 0
  );
  const readyForCert = classData?.classes.reduce((sum, cls) => 
    sum + (cls.students?.filter(st => 
      st.progress?.total_points >= st.progress?.points_required
    ).length || 0), 0
  );

  const getTopStudents = (classObj) => {
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <h2 className="text-2xl font-bold text-[#32303b] mb-2">
          {currentUser.role === 'admin' ? 'Training Overview' : 'My Classes'}
        </h2>
        <p className="text-gray-600">
          Welcome back, {classData?.trainer_name || currentUser.username}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#32303b] to-[#43414d] text-white rounded-lg shadow-lg p-4 border-2 border-[#dcac6e]">
          <div className="flex items-center justify-between mb-2">
            <User className="w-6 h-6 text-[#dcac6e]" />
          </div>
          <p className="text-3xl font-bold">{totalStudents}</p>
          <p className="text-sm opacity-90">Total Students</p>
        </div>

        <div className="bg-gradient-to-br from-[#dcac6e] to-[#c49654] text-[#32303b] rounded-lg shadow-lg p-4 border-2 border-[#c49654]">
          <div className="flex items-center justify-between mb-2">
            <Book className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">{classData?.classes.length || 0}</p>
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

      {classData && classData.classes && classData.classes.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e]">
          <div className="border-b border-[#dcac6e] flex overflow-x-auto">
            {classData.classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`px-6 py-4 whitespace-nowrap font-medium transition ${
                  selectedClass?.id === cls.id
                    ? 'border-b-4 border-[#32303b] text-[#32303b] bg-[#dcac6e] bg-opacity-10'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold">{cls.name}</div>
                  <div className="text-xs opacity-75">
                    {cls.day_of_week} • {cls.time_slot} • {cls.student_count} students
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedClass && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#32303b]">
                  {selectedClass.name} - Top Performers
                </h3>
              </div>
              
              {getTopStudents(selectedClass).length > 0 && (
                <div className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-[#dcac6e] rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Trophy className="w-5 h-5 text-[#dcac6e]" />
                    <h4 className="font-bold text-[#32303b]">Class Leaders</h4>
                  </div>
                  <div className="space-y-2">
                    {getTopStudents(selectedClass).map((student, idx) => (
                      <div key={student.user_id} className="flex items-center space-x-3 bg-white rounded p-2 border border-[#dcac6e]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-[#dcac6e]' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-[#b8935d]' : 'bg-gray-300'
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
                    ))}
                  </div>
                </div>
              )}

              <h4 className="font-bold text-[#32303b] mb-3">Full Roster</h4>
              {selectedClass.students && selectedClass.students.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedClass.students.map(student => (
                    <TrainerStudentCard 
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
            {currentUser.role === 'admin' 
              ? 'No classes have been created yet.' 
              : 'You are not assigned to any classes yet.'}
          </p>
          <p className="text-sm text-gray-500">
            {currentUser.role === 'admin'
              ? 'Create a class to get started.'
              : 'Contact an administrator to be assigned to a class.'}
          </p>
        </div>
      )}
    </div>
  );
}

function TrainerStudentCard({ student, onClick }) {
  const progress = student.progress || {};
  const currentGrade = progress.current_grade || 0;
  const nextGrade = currentGrade + 1;
  const pointsRequired = progress.points_required || 20;
  const totalPoints = progress.total_points || 0;
  const progressPercent = Math.min((totalPoints / pointsRequired) * 100, 100);
  const canCertify = progressPercent >= 100;

  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-[#dcac6e] rounded-lg p-4 hover:shadow-lg hover:border-[#32303b] transition text-left w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-[#32303b] text-lg">{student.dog_name}</h4>
          <p className="text-sm text-gray-600">{student.owners}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#32303b]">
            {currentGrade > 0 ? currentGrade : '-'}
          </div>
          <div className="text-xs text-gray-500">Grade</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">
            Progress to Grade {nextGrade > 12 ? 12 : nextGrade}
          </span>
          <span className="text-xs font-medium text-gray-700">
            {totalPoints}/{pointsRequired}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              canCertify ? 'bg-gradient-to-r from-[#32303b] to-[#dcac6e]' : 'bg-[#32303b]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
        <div className="bg-white rounded p-2 border border-gray-200">
          <div className="font-bold text-purple-600">{progress.sections_with_skills || 0}/6</div>
          <div className="text-gray-600">Sections</div>
        </div>
        <div className="bg-white rounded p-2 border border-gray-200">
          <div className="font-bold text-orange-600">{student.pending_submissions || 0}</div>
          <div className="text-gray-600">Pending</div>
        </div>
      </div>

      {canCertify && (
        <div className="bg-[#dcac6e] bg-opacity-20 border border-[#dcac6e] rounded px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-medium text-[#32303b]">Ready for Certificate</span>
          <Award className="w-4 h-4 text-[#32303b]" />
        </div>
      )}

      <div className="mt-3 flex items-center justify-end text-[#32303b]">
        <span className="text-xs font-medium">View Details</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  );
}

// ============= STUDENT DETAIL VIEW =============
function StudentDetailView({ student, onBack }) {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [selectedSection, setSelectedSection] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [approving, setApproving] = useState(false);

  const toggleSkillSelection = (skill) => {
    if (skill.status === 'completed') return;
    
    setSelectedSkills(prev => {
      const exists = prev.find(s => s.id === skill.id);
      if (exists) {
        return prev.filter(s => s.id !== skill.id);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleBulkApprove = async () => {
    if (selectedSkills.length === 0) return;
    
    setApproving(true);
    try {
      for (const skill of selectedSkills) {
        await api.directApproveSkill({
          user_id: student.user_id,
          skill_id: skill.id,
          notes: 'Bulk approved'
        });
      }
      
      const totalPoints = selectedSkills.reduce((sum, s) => sum + s.points, 0);
      showToast(`${selectedSkills.length} skills approved! +${totalPoints} points`, 'success');
      setSelectedSkills([]);
      setMultiSelectMode(false);
      onBack();
    } catch (error) {
      showToast(error.message || 'Failed to approve skills', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleSingleApprove = async (skill) => {
    if (multiSelectMode) {
      toggleSkillSelection(skill);
      return;
    }

    if (skill.status === 'completed') return;
    
    try {
      await api.directApproveSkill({
        user_id: student.user_id,
        skill_id: skill.id,
        notes: 'Quick approved'
      });
      showToast(`${skill.title} approved! +${skill.points} points`, 'success');
      onBack();
    } catch (error) {
      showToast(error.message || 'Failed to approve skill', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back to Class
        </button>
        <div className="flex space-x-2">
          {multiSelectMode && selectedSkills.length > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={approving}
              className="px-4 py-2 bg-[#32303b] text-white rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition disabled:opacity-50 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Approve {selectedSkills.length} Skills</span>
            </button>
          )}
          <button
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              setSelectedSkills([]);
            }}
            className={`px-4 py-2 rounded-lg transition ${
              multiSelectMode 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-[#dcac6e] text-[#32303b] hover:bg-[#c49654]'
            }`}
          >
            {multiSelectMode ? 'Cancel Multi-Select' : 'Multi-Select Mode'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#32303b] to-[#43414d] text-white rounded-lg shadow-lg p-6 border-2 border-[#dcac6e]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{student.dog_name}</h2>
            <p className="text-[#dcac6e] mb-1">Owner: {student.owners}</p>
            <p className="text-[#dcac6e] mb-1">Email: {student.email}</p>
            <p className="text-[#dcac6e]">Class: {student.class_name}</p>
          </div>
          <div className="text-center bg-[#dcac6e] bg-opacity-20 rounded-lg px-6 py-4 border-2 border-[#dcac6e]">
            <div className="text-4xl font-bold">{student.current_grade || 0}</div>
            <div className="text-sm opacity-90">Current Grade</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-4">
        <h3 className="font-bold text-[#32303b] mb-3">Progress Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#32303b]">{student.progress?.total_points || 0}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#dcac6e]">{student.progress?.sections_with_skills || 0}/6</div>
            <div className="text-sm text-gray-600">Sections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {student.sections?.reduce((sum, sec) => 
                sum + sec.skills.filter(sk => sk.status === 'pending').length, 0) || 0}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {multiSelectMode && (
        <div className="bg-[#dcac6e] bg-opacity-20 border-2 border-[#dcac6e] rounded-lg p-4">
          <p className="text-sm text-[#32303b] font-medium">
            Multi-Select Mode Active - Click skills to select/deselect, then approve all at once
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e]">
        <div className="p-6 border-b border-[#dcac6e]">
          <h3 className="text-xl font-bold text-[#32303b]">Skill Progress</h3>
          <p className="text-sm text-gray-600 mt-1">
            {multiSelectMode ? 'Select multiple skills to approve' : 'Click any available skill to mark as complete'}
          </p>
        </div>

        {student.sections?.map(section => (
          <div key={section.id} className="border-b last:border-b-0">
            <button
              onClick={() => setSelectedSection(
                selectedSection === section.id ? null : section.id
              )}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center space-x-3">
                <Book className="w-5 h-5 text-[#32303b]" />
                <span className="font-bold text-[#32303b]">{section.name}</span>
                <span className="text-sm text-gray-500">
                  ({section.skills.filter(s => s.status === 'completed').length}/{section.skills.length} completed)
                </span>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                selectedSection === section.id ? 'rotate-90' : ''
              }`} />
            </button>

            {selectedSection === section.id && (
              <div className="px-6 pb-4 bg-gray-50">
                <div className="grid md:grid-cols-2 gap-3 pt-3">
                  {section.skills.map(skill => (
                    <TrainerSkillCard
                      key={skill.id}
                      skill={skill}
                      onClick={() => handleSingleApprove(skill)}
                      multiSelectMode={multiSelectMode}
                      isSelected={selectedSkills.some(s => s.id === skill.id)}
                      onToggleSelect={() => toggleSkillSelection(skill)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {student.recent_activity && student.recent_activity.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
          <h3 className="text-lg font-bold text-[#32303b] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {student.recent_activity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <div>
                  <p className="font-medium text-[#32303b]">{activity.skill}</p>
                  <p className="text-sm text-gray-600">by {activity.trainer}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    activity.action === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.action}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrainerSkillCard({ skill, onClick, multiSelectMode = false, isSelected = false, onToggleSelect }) {
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

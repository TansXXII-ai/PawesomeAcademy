'use client';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { Camera, Award, Book, User, LogOut, Menu, X, Check, Clock, AlertCircle, Upload, FileText, Star, ChevronRight, Trophy, TrendingUp, CheckSquare, Square } from 'lucide-react';

// ============= TOAST NOTIFICATION SYSTEM =============
const ToastContext = createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-slide-in border-2 ${
              toast.type === 'success' ? 'bg-[#32303b] border-[#dcac6e]' :
              toast.type === 'error' ? 'bg-red-600 border-red-800' :
              toast.type === 'info' ? 'bg-[#dcac6e] text-[#32303b] border-[#c49654]' : 'bg-gray-600 border-gray-800'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ============= API CLIENT =============
const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}

const api = {
  login: (email, password) => 
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  logout: () => 
    fetchAPI('/auth/logout', { method: 'POST' }),
  
  getSections: () => 
    fetchAPI('/sections'),
  
  getSkills: (sectionId = null) => 
    fetchAPI(`/skills${sectionId ? `?sectionId=${sectionId}` : ''}`),
  
  getProfile: (userId) => 
    fetchAPI(`/profiles?userId=${userId}`),
  
  saveProfile: (profile) =>
    fetchAPI('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),
  
  getSubmissions: (userId = null, status = null, myClassOnly = false) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status) params.append('status', status);
    if (myClassOnly) params.append('myClassOnly', 'true');
    return fetchAPI(`/submissions?${params}`);
  },
  
  createSubmission: (submission) =>
    fetchAPI('/submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    }),
  
  updateSubmission: (id, data) =>
    fetchAPI(`/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  getGradeProgress: (userId) =>
    fetchAPI(`/grades/progress?userId=${userId}`),
  
  achieveGrade: (data) =>
    fetchAPI('/grades/achieve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getCertificates: (userId = null, status = null) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status) params.append('status', status);
    return fetchAPI(`/certificates?${params}`);
  },
  
  requestCertificate: (data) =>
    fetchAPI('/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  approveCertificate: (data) =>
    fetchAPI('/certificates', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getClasses: (trainerId = null, includeMembers = false) => {
    const params = new URLSearchParams();
    if (trainerId) params.append('trainerId', trainerId);
    if (includeMembers) params.append('includeMembers', 'true');
    return fetchAPI(`/classes?${params}`);
  },

  getAllClasses: () => fetchAPI('/classes?includeMembers=true'),

  createClass: (classData) =>
    fetchAPI('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    }),

  getMyStudents: (classId = null) => {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    return fetchAPI(`/classes/my-students?${params}`);
  },

  getStudentDetails: (userId) =>
    fetchAPI(`/students/${userId}`),

  directApproveSkill: (data) =>
    fetchAPI('/completions/direct-approve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============= CONTEXT =============
const AppContext = createContext();

const gradeRequirements = {
  1: 20, 2: 20, 3: 20,
  4: 40, 5: 40, 6: 40,
  7: 60, 8: 60, 9: 60,
  10: 80, 11: 80, 12: 80
};

// Helper function to display role names
const getRoleDisplayName = (role) => {
  if (role === 'member') return 'Pawsome Pal';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// ============= MAIN APP =============
export default function PawcademyApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [sections, setSections] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    try {
      const result = await api.login(email, password);
      if (result.success) {
        setCurrentUser(result.user);
        setView('dashboard');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setCurrentUser(null);
    setView('login');
  };

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sectionsData, skillsData] = await Promise.all([
        api.getSections(),
        api.getSkills()
      ]);
      setSections(sectionsData);
      setSkills(skillsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToastProvider>
      <AppContext.Provider value={{ 
        currentUser, 
        sections, 
        skills,
        setSections,
        setSkills,
        setView, 
        logout,
        loading 
      }}>
        <div className="min-h-screen bg-gray-50">
          {!currentUser ? (
            <LoginPage onLogin={login} />
          ) : (
            <>
              <Navigation view={view} setView={setView} />
              <main className="container mx-auto px-4 py-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Loading...</div>
                  </div>
                ) : (
                  <>
                    {view === 'dashboard' && <Dashboard />}
                    {view === 'sections' && <SectionsView />}
                    {view === 'myclasses' && <MyClassesView />}
                    {view === 'leaderboard' && <LeaderboardView />}
                    {view === 'inbox' && <TrainerInbox />}
                    {view === 'admin' && <AdminPanel />}
                    {view === 'profile' && <ProfileView />}
                    {view === 'certificates' && <CertificatesView />}
                  </>
                )}
              </main>
            </>
          )}
        </div>
      </AppContext.Provider>
    </ToastProvider>
  );
}

// ============= LOGIN =============
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="min-h-screen flex items-center justify-center bg-[#32303b]">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-4 border-[#dcac6e]">
        <div className="text-center mb-8">
          <img src="/PawcademyLogo.png" alt="Logo" className="w-32 h-32 mx-auto mb-4 rounded-full" />
          <h1 className="text-3xl font-bold text-gray-800">Potter Pawcademy</h1>
          <p className="text-gray-600">Dog Training Platform</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#dcac6e] focus:border-transparent"
              placeholder="member@pawesomeacademy.com"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#dcac6e] focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t text-sm text-gray-600">
          <p className="font-semibold mb-2">For Members Only</p>
          <p className="text-xs">You will need to use your email and password provided to you by your trainer</p>
        </div>
      </div>
    </div>
  );
}

// ============= NAVIGATION =============
function Navigation({ view, setView }) {
  const { currentUser, logout } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'member') {
        loadProfile();
      }
      if (currentUser.role !== 'member') {
        loadPendingCount();
      }
    }
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile(currentUser.id);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadPendingCount = async () => {
    try {
      const [submissions, certificates] = await Promise.all([
        api.getSubmissions(null, null, false),
        api.getCertificates(null, 'pending')
      ]);
      const pending = submissions.filter(s => 
        s.status === 'submitted' || s.status === 'requested'
      ).length;
      const pendingCerts = certificates.length;
      setPendingCount(pending + pendingCerts);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Award, roles: ['member', 'trainer', 'admin'] },
    { key: 'sections', label: 'Skills', icon: Book, roles: ['member', 'trainer', 'admin'] },
    { key: 'myclasses', label: 'My Classes', icon: User, roles: ['trainer', 'admin'] },
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['trainer', 'admin'] },
    { key: 'inbox', label: `Inbox ${pendingCount > 0 ? `(${pendingCount})` : ''}`, icon: Clock, roles: ['trainer', 'admin'] },
    { key: 'certificates', label: 'Certificates', icon: FileText, roles: ['member', 'trainer', 'admin'] },
    { key: 'admin', label: 'Admin', icon: User, roles: ['admin'] },
    { key: 'profile', label: 'Profile', icon: User, roles: ['member', 'trainer', 'admin'] }
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <nav className="bg-[#32303b] shadow-md border-b-4 border-[#dcac6e]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-[#dcac6e]" />
            <div>
              <h1 className="text-xl font-bold text-white">PawesomeAcademy</h1>
              {currentUser.role === 'member' && profile && (
                <p className="text-xs text-[#dcac6e]">{profile.dog_name}</p>
              )}
              {currentUser.role !== 'member' && (
                <p className="text-xs text-[#dcac6e]">{getRoleDisplayName(currentUser.role)}</p>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {allowedItems.map(item => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  view === item.key ? 'bg-[#dcac6e] text-[#32303b] font-medium' : 'text-white hover:bg-[#dcac6e] hover:bg-opacity-20'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-[#dcac6e] hover:bg-[#dcac6e] hover:bg-opacity-20 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            {allowedItems.map(item => (
              <button
                key={item.key}
                onClick={() => { setView(item.key); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  view === item.key ? 'bg-[#dcac6e] text-[#32303b] font-medium' : 'text-white hover:bg-[#dcac6e] hover:bg-opacity-20'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-[#dcac6e] hover:bg-[#dcac6e] hover:bg-opacity-20 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

// ============= DASHBOARD =============
function Dashboard() {
  const { currentUser, sections, skills, setView } = useContext(AppContext);
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

// ============= MY CLASSES VIEW (Placeholder) =============
function MyClassesView() {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center">
      <h2 className="text-2xl font-bold text-[#32303b] mb-4">My Classes</h2>
      <p className="text-gray-600">Class management view - Coming soon</p>
    </div>
  );
}

// ============= LEADERBOARD VIEW =============
function LeaderboardView() {
  const { currentUser } = useContext(AppContext);
  const [classData, setClassData] = useState(null);
  const [selectedView, setSelectedView] = useState('overall');
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const allStudents = [];
    classData.classes.forEach(cls => {
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

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  const overallStudents = getAllStudents();
  const classStudents = selectedClass ? getClassStudents(selectedClass) : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#32303b]">Leaderboard</h2>
            <p className="text-gray-600">Top performing students</p>
          </div>
          <Trophy className="w-12 h-12 text-[#dcac6e]" />
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

      {selectedView === 'class' && classData && classData.classes && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-4">
          <label className="block text-sm font-medium text-[#32303b] mb-2">Select Class</label>
          <select
            value={selectedClass?.id || ''}
            onChange={(e) => {
              const cls = classData.classes.find(c => c.id === parseInt(e.target.value));
              setSelectedClass(cls);
            }}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
          >
            {classData.classes.map(cls => (
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
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {(selectedView === 'overall' ? overallStudents : classStudents).map((student, idx) => (
              <LeaderboardRow key={student.user_id} student={student} rank={idx + 1} showClass={selectedView === 'overall'} />
            ))}
            {(selectedView === 'overall' ? overallStudents : classStudents).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

// ============= SECTIONS VIEW =============
function SectionsView() {
  const { sections } = useContext(AppContext);
  const [selectedSection, setSelectedSection] = useState(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#32303b]">Skills & Sections</h2>
      
      {!selectedSection ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.filter(s => s.active).sort((a, b) => a.display_order - b.display_order).map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section)}
              className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6 hover:shadow-xl hover:border-[#32303b] transition text-left"
            >
              <h3 className="text-xl font-bold text-[#32303b] mb-2">{section.name}</h3>
              <p className="text-gray-600 mb-4">{section.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <SectionDetail section={selectedSection} onBack={() => setSelectedSection(null)} />
      )}
    </div>
  );
}

function SectionDetail({ section, onBack }) {
  const { currentUser, skills } = useContext(AppContext);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [sectionSkills, setSectionSkills] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSectionData();
  }, [section]);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      const skillsData = await api.getSkills(section.id);
      setSectionSkills(skillsData);

      if (currentUser.role === 'member') {
        const [submissionsData, progressData] = await Promise.all([
          api.getSubmissions(currentUser.id),
          api.getGradeProgress(currentUser.id)
        ]);
        
        setSubmissions(submissionsData);
        const completionSkills = progressData.availableCompletions?.map(c => c.skill_id) || [];
        setCompletions(completionSkills);
      } else {
        setSubmissions([]);
        setCompletions([]);
      }
    } catch (error) {
      console.error('Failed to load section data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillStatus = (skillId) => {
    if (currentUser.role !== 'member') {
      return 'available';
    }

    if (completions.includes(skillId)) return 'completed';
    
    const submission = submissions.find(s => 
      s.skill_id === skillId && 
      (s.status === 'requested' || s.status === 'submitted')
    );
    if (submission) return submission.status;
    
    return 'available';
  };

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#32303b]">{section.name}</h2>
          <p className="text-gray-600">{section.description}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Unless stated otherwise, food/toys only as a reward, not as a lure or encouragement.
        </p>
      </div>

      {sectionSkills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center text-gray-500">
          No skills found in this section.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionSkills.map(skill => {
            const status = getSkillStatus(skill.id);
            const statusColors = {
              completed: 'border-green-500 bg-green-50',
              requested: 'border-[#dcac6e] bg-[#dcac6e] bg-opacity-10',
              submitted: 'border-[#32303b] bg-[#32303b] bg-opacity-5',
              available: 'border-gray-200 bg-white'
            };
            
            return (
              <div
                key={skill.id}
                className={`border-2 rounded-lg p-4 ${statusColors[status]} ${
                  currentUser.role === 'member' ? 'cursor-pointer hover:shadow-lg hover:border-[#32303b]' : ''
                } transition`}
                onClick={() => currentUser.role === 'member' && setSelectedSkill(skill)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#32303b]">{skill.title}</h3>
                  {status === 'completed' && <Check className="w-5 h-5 text-green-600" />}
                  {status === 'requested' && <Clock className="w-5 h-5 text-[#dcac6e]" />}
                  {status === 'submitted' && <Upload className="w-5 h-5 text-[#32303b]" />}
                </div>
                <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {'⭐'.repeat(skill.difficulty)}
                    </span>
                    <span className="text-sm font-bold text-[#32303b]">{skill.points} pts</span>
                  </div>
                  {currentUser.role === 'member' && (
                    <span className="text-xs text-gray-500 capitalize">{status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSkill && currentUser.role === 'member' && (
        <SkillSubmissionModal
          skill={selectedSkill}
          onClose={() => {
            setSelectedSkill(null);
            loadSectionData();
          }}
        />
      )}
    </div>
  );
}

function SkillSubmissionModal({ skill, onClose }) {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [mode, setMode] = useState('class_request');
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      await api.createSubmission({
        user_id: currentUser.id,
        skill_id: skill.id,
        mode,
        video_url: mode === 'home_video' ? videoUrl : null,
        member_notes: notes
      });
      showToast('Skill submission sent!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-[#dcac6e]">
        <h3 className="text-xl font-bold text-[#32303b] mb-4">Submit: {skill.title}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#32303b] mb-2">Submission Type</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'class_request'}
                  onChange={() => setMode('class_request')}
                  className="w-4 h-4 accent-[#32303b]"
                />
                <span>Request Class Assessment</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'home_video'}
                  onChange={() => setMode('home_video')}
                  className="w-4 h-4 accent-[#32303b]"
                />
                <span>Submit Home Video</span>
              </label>
            </div>
          </div>

          {mode === 'home_video' && (
            <div>
              <label className="block text-sm font-medium text-[#32303b] mb-1">
                Video URL or Description
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                placeholder="YouTube link or description"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#32303b] mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= TRAINER INBOX =============
function TrainerInbox() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [filter, setFilter] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const statusFilter = filter === 'all' ? null : filter === 'pending' ? null : filter;
      const data = await api.getSubmissions(null, statusFilter);
      
      let filtered = data;
      if (filter === 'pending') {
        filtered = data.filter(s => s.status === 'requested' || s.status === 'submitted');
      }
      
      setSubmissions(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (submissionId, decision, trainerNotes = '') => {
    try {
      await api.updateSubmission(submissionId, {
        status: decision,
        trainer_notes: trainerNotes,
        trainer_id: currentUser.id
      });
      
      showToast(`Submission ${decision}!`, decision === 'approved' ? 'success' : 'info');
      loadSubmissions();
    } catch (error) {
      showToast(error.message || 'Failed to update submission', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#32303b]">Trainer Inbox</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition font-medium border-2 ${
                filter === f
                  ? 'bg-[#32303b] text-white border-[#dcac6e]'
                  : 'bg-gray-200 text-gray-700 hover:bg-[#dcac6e] hover:bg-opacity-20 border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center text-gray-500">
            No submissions found
          </div>
        ) : (
          submissions.map(submission => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onDecision={handleDecision}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SubmissionCard({ submission, onDecision }) {
  const [notes, setNotes] = useState('');
  const [showDecision, setShowDecision] = useState(false);

  const statusColors = {
    requested: 'bg-[#dcac6e] bg-opacity-10 border-[#dcac6e]',
    submitted: 'bg-[#32303b] bg-opacity-5 border-[#32303b]',
    approved: 'bg-green-50 border-green-300',
    rejected: 'bg-red-50 border-red-300'
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[submission.status]}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#32303b]">
            {submission.member_name} - {submission.skill_title}
          </h3>
          <p className="text-sm text-gray-600">{submission.section_name} • {submission.skill_points} points</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(submission.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
          submission.status === 'approved' ? 'bg-green-200 text-green-800' :
          submission.status === 'rejected' ? 'bg-red-200 text-red-800' :
          submission.status === 'submitted' ? 'bg-[#32303b] text-white' :
          'bg-[#dcac6e] text-[#32303b]'
        }`}>
          {submission.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[#32303b]">Type:</p>
          <p className="text-sm text-gray-600 capitalize">{submission.mode.replace('_', ' ')}</p>
        </div>

        {submission.video_url && (
          <div>
            <p className="text-sm font-medium text-[#32303b]">Video:</p>
            <p className="text-sm text-[#32303b] underline">{submission.video_url}</p>
          </div>
        )}

        {submission.member_notes && (
          <div>
            <p className="text-sm font-medium text-[#32303b]">Member Notes:</p>
            <p className="text-sm text-gray-600">{submission.member_notes}</p>
          </div>
        )}

        {submission.trainer_notes && (
          <div>
            <p className="text-sm font-medium text-[#32303b]">Trainer Notes:</p>
            <p className="text-sm text-gray-600">{submission.trainer_notes}</p>
          </div>
        )}

        {(submission.status === 'requested' || submission.status === 'submitted') && (
          <div>
            {!showDecision ? (
              <button
                onClick={() => setShowDecision(true)}
                className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
              >
                Review & Decide
              </button>
            ) : (
              <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#dcac6e] rounded-lg h-20 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
                  placeholder="Trainer feedback..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => { onDecision(submission.id, 'approved', notes); setShowDecision(false); }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => { onDecision(submission.id, 'rejected', notes); setShowDecision(false); }}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => setShowDecision(false)}
                    className="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============= CERTIFICATES =============
function CertificatesView() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [progress, setProgress] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificatesData();
  }, [currentUser]);

  const loadCertificatesData = async () => {
    setLoading(true);
    try {
      const [progressData, certsData, profileData] = await Promise.all([
        api.getGradeProgress(currentUser.id),
        api.getCertificates(currentUser.id),
        api.getProfile(currentUser.id).catch(() => null)
      ]);
      
      setProgress(progressData);
      setCertificates(certsData);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load certificates data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCertificate = async (certId) => {
    try {
      await api.approveCertificate({
        certificate_id: certId,
        trainer_id: currentUser.id
      });
      
      showToast('Certificate approved!', 'success');
      loadCertificatesData();
    } catch (error) {
      showToast(error.message || 'Failed to approve certificate', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#32303b]">Certificates</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {certificates.map(cert => (
          <CertificateCard key={cert.id} certificate={cert} profile={profile} />
        ))}
        
        {certificates.length === 0 && (
          <div className="col-span-2 bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center text-gray-500">
            No certificates yet. Keep training to earn your first grade!
          </div>
        )}
      </div>

      {currentUser.role !== 'member' && (
        <TrainerCertificateApprovals onApprove={handleApproveCertificate} />
      )}
    </div>
  );
}

function CertificateCard({ certificate, profile }) {
  const statusColors = {
    pending: 'border-[#dcac6e] bg-[#dcac6e] bg-opacity-10',
    approved: 'border-green-300 bg-green-50'
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[certificate.status]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#32303b]">Grade {certificate.grade_number}</h3>
          <p className="text-sm text-gray-600">{profile?.dog_name || certificate.dog_name}</p>
        </div>
        <Award className={`w-8 h-8 ${certificate.status === 'approved' ? 'text-green-600' : 'text-[#dcac6e]'}`} />
      </div>
      
      <div className="space-y-2 text-sm">
        <p className="text-gray-600">
          Status: <span className="font-medium capitalize">{certificate.status}</span>
        </p>
        {certificate.approved_at && (
          <p className="text-gray-600">
            Approved: {new Date(certificate.approved_at).toLocaleDateString()}
          </p>
        )}
        {certificate.public_code && (
          <p className="text-gray-600">
            Certificate ID: <span className="font-mono font-bold">{certificate.public_code}</span>
          </p>
        )}
      </div>

      {certificate.status === 'approved' && (
        <button className="mt-4 w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition">
          Download PDF
        </button>
      )}
    </div>
  );
}

function TrainerCertificateApprovals({ onApprove }) {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingCertificates();
  }, []);

  const loadPendingCertificates = async () => {
    setLoading(true);
    try {
      const data = await api.getCertificates(null, 'pending');
      setPendingCerts(data);
    } catch (error) {
      console.error('Failed to load pending certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || pendingCerts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
      <h3 className="text-xl font-bold text-[#32303b] mb-4">Pending Certificate Approvals</h3>
      <div className="space-y-4">
        {pendingCerts.map(cert => (
          <div key={cert.id} className="border-2 border-[#dcac6e] rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#32303b]">
                {cert.dog_name} - Grade {cert.grade_number}
              </p>
              <p className="text-sm text-gray-600">{cert.member_name}</p>
            </div>
            <button
              onClick={() => onApprove(cert.id)}
              className="bg-[#32303b] text-white px-4 py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= PROFILE =============
function ProfileView() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    dog_name: '',
    owners: '',
    notes: ''
  });

  useEffect(() => {
    if (currentUser.role === 'member') {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getProfile(currentUser.id);
      setProfile(data);
      setFormData({
        dog_name: data.dog_name || '',
        owners: data.owners || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveProfile({
        user_id: currentUser.id,
        ...formData
      });
      
      showToast('Profile saved!', 'success');
      loadProfile();
    } catch (error) {
      showToast(error.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  // Trainer/Admin Profile View
  if (currentUser.role === 'trainer' || currentUser.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6 space-y-6">
          <h2 className="text-2xl font-bold text-[#32303b]">Account Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#32303b] to-[#43414d] text-white rounded-lg">
              <User className="w-12 h-12 text-[#dcac6e]" />
              <div>
                <p className="text-sm opacity-90">Logged in as</p>
                <p className="text-xl font-bold">{currentUser.username}</p>
                <p className="text-sm text-[#dcac6e]">{getRoleDisplayName(currentUser.role)}</p>
              </div>
            </div>

            <div className="border-2 border-[#dcac6e] rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-[#32303b] font-medium">{currentUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <p className="text-[#32303b] font-medium capitalize">{getRoleDisplayName(currentUser.role)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-green-600 font-medium">Active</p>
                </div>
              </div>
            </div>

            <div className="bg-[#dcac6e] bg-opacity-10 border-2 border-[#dcac6e] rounded-lg p-4">
              <h3 className="font-bold text-[#32303b] mb-2">Profile Management</h3>
              <p className="text-sm text-gray-700">
                As a {currentUser.role}, you don't need to maintain a dog profile. 
                Your account is used for managing students and approving their progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Member Profile View
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#32303b]">Dog Profile</h2>

        <div>
          <label className="block text-sm font-medium text-[#32303b] mb-1">Dog Name</label>
          <input
            type="text"
            value={formData.dog_name}
            onChange={(e) => setFormData({ ...formData, dog_name: e.target.value })}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
            placeholder="Max"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#32303b] mb-1">Owner(s)</label>
          <input
            type="text"
            value={formData.owners}
            onChange={(e) => setFormData({ ...formData, owners: e.target.value })}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
            placeholder="Sarah Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#32303b] mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border-2 border-[#dcac6e] rounded-lg h-24 focus:ring-2 focus:ring-[#32303b] focus:border-transparent"
            placeholder="Any important information about your dog..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

// ============= ADMIN PANEL =============
function AdminPanel() {
  const [activeTab, setActiveTab] = useState('skills');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#32303b]">Admin Panel</h2>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Admin panel features (skill/section/user management) will be connected to API in future update.
          For now, manage data directly in Azure SQL Database using Query Editor.
        </p>
      </div>

      <div className="flex space-x-2 border-b-2 border-[#dcac6e]">
        {['skills', 'sections', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? 'border-b-4 border-[#32303b] text-[#32303b] font-medium'
                : 'text-gray-600 hover:text-[#32303b]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <p className="text-gray-600">
          Admin CRUD operations will be implemented in a future update. 
          Currently, use Azure Portal Query Editor to manage {activeTab}.
        </p>
      </div>
    </div>
  );
}

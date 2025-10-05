'use client';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { Camera, Award, Book, User, LogOut, Menu, X, Check, Clock, AlertCircle, Upload, FileText, Star } from 'lucide-react';

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
  
  getSubmissions: (userId = null, status = null) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status) params.append('status', status);
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
};

// ============= CONTEXT =============
const AppContext = createContext();

const gradeRequirements = {
  1: 20, 2: 20, 3: 20,
  4: 40, 5: 40, 6: 40,
  7: 60, 8: 60, 9: 60,
  10: 80, 11: 80, 12: 80
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

  // Load initial data when user logs in
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
      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="••••••••"
      disabled={loading}
    />
  </div>
  
  {error && <p className="text-red-600 text-sm">{error}</p>}
  
  <button
    onClick={handleSubmit}
    disabled={loading}
    className="w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#32303b] transition disabled:opacity-50"
  >
    {loading ? 'Logging in...' : 'Login'}
  </button>
</div>

<div className="mt-6 pt-6 border-t text-sm text-gray-600">
  <p className="font-semibold mb-2">Database Connected</p>
  <p className="text-xs">Using Azure SQL Database for data storage</p>
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
      loadProfile();
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
      const submissions = await api.getSubmissions(null, null);
      const pending = submissions.filter(s => 
        s.status === 'submitted' || s.status === 'requested'
      ).length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Award, roles: ['member', 'trainer', 'admin'] },
    { key: 'sections', label: 'Skills', icon: Book, roles: ['member', 'trainer', 'admin'] },
    { key: 'inbox', label: `Inbox ${pendingCount > 0 ? `(${pendingCount})` : ''}`, icon: Clock, roles: ['trainer', 'admin'] },
    { key: 'certificates', label: 'Certificates', icon: FileText, roles: ['member', 'trainer', 'admin'] },
    { key: 'admin', label: 'Admin', icon: User, roles: ['admin'] },
    { key: 'profile', label: 'Profile', icon: User, roles: ['member', 'trainer', 'admin'] }
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">PawesomeAcademy</h1>
              {profile && <p className="text-xs text-gray-600">{profile.dog_name}</p>}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {allowedItems.map(item => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  view === item.key ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
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
                  view === item.key ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
  const { currentUser, sections, skills } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profileData, progressData, submissionsData] = await Promise.all([
        api.getProfile(currentUser.id).catch(() => null),
        api.getGradeProgress(currentUser.id),
        currentUser.role !== 'member' 
          ? api.getSubmissions() 
          : Promise.resolve([])
      ]);
      
      setProfile(profileData);
      setProgress(progressData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (!progress) {
    return <div className="text-center py-8">Failed to load progress data</div>;
  }

  const gradeReq = progress.pointsRequired;
  const currentGrade = progress.currentGrade;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome back, {currentUser.username}!
        </h2>
        {profile && (
          <p className="text-gray-600">Training {profile.dog_name}</p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Current Grade</span>
            <Award className="w-6 h-6" />
          </div>
          <p className="text-4xl font-bold">Grade {currentGrade}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Points Progress</span>
            <Star className="w-6 h-6" />
          </div>
          <p className="text-4xl font-bold">{progress.totalPoints} / {gradeReq}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Sections Complete</span>
            <Book className="w-6 h-6" />
          </div>
          <p className="text-4xl font-bold">{progress.sectionsWithSkills.length} / 6</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Section Progress</h3>
        <div className="space-y-4">
          {sections.filter(s => s.active).map(section => {
            const sectionPoints = progress.sectionPoints[section.id] || 0;
            const hasSkill = progress.sectionsWithSkills.includes(section.id);
            return (
              <div key={section.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{section.name}</span>
                  <span className="text-sm text-gray-600">
                    {sectionPoints} pts {hasSkill ? '✓' : '❌'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${hasSkill ? 'bg-green-500' : 'bg-gray-400'}`}
                    style={{ width: `${Math.min((sectionPoints / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {progress.canRequestCertificate && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Congratulations! You've completed Grade {currentGrade}!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Request your certificate from the Certificates page.
            </p>
          </div>
        )}
      </div>

      {currentUser.role !== 'member' && submissions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Trainer Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {submissions.filter(s => s.status === 'requested' || s.status === 'submitted').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {submissions.filter(s => s.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {sections.length}
              </p>
              <p className="text-sm text-gray-600">Sections</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {skills.filter(s => s.active).length}
              </p>
              <p className="text-sm text-gray-600">Active Skills</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= SECTIONS VIEW =============
function SectionsView() {
  const { sections } = useContext(AppContext);
  const [selectedSection, setSelectedSection] = useState(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Skills & Sections</h2>
      
      {!selectedSection ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.filter(s => s.active).sort((a, b) => a.display_order - b.display_order).map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">{section.name}</h3>
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
      const [skillsData, submissionsData, progressData] = await Promise.all([
        api.getSkills(section.id),
        api.getSubmissions(currentUser.id),
        api.getGradeProgress(currentUser.id)
      ]);
      
      setSectionSkills(skillsData);
      setSubmissions(submissionsData);
      
      // Extract completions from progress data
      const completionSkills = progressData.availableCompletions?.map(c => c.skill_id) || [];
      setCompletions(completionSkills);
    } catch (error) {
      console.error('Failed to load section data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillStatus = (skillId) => {
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
          <h2 className="text-2xl font-bold text-gray-800">{section.name}</h2>
          <p className="text-gray-600">{section.description}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Unless stated otherwise, food/toys only as a reward, not as a lure or encouragement.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionSkills.map(skill => {
          const status = getSkillStatus(skill.id);
          const statusColors = {
            completed: 'border-green-500 bg-green-50',
            requested: 'border-yellow-500 bg-yellow-50',
            submitted: 'border-blue-500 bg-blue-50',
            available: 'border-gray-200 bg-white'
          };
          
          return (
            <div
              key={skill.id}
              className={`border-2 rounded-lg p-4 ${statusColors[status]} cursor-pointer hover:shadow-lg transition`}
              onClick={() => setSelectedSkill(skill)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">{skill.title}</h3>
                {status === 'completed' && <Check className="w-5 h-5 text-green-600" />}
                {status === 'requested' && <Clock className="w-5 h-5 text-yellow-600" />}
                {status === 'submitted' && <Upload className="w-5 h-5 text-blue-600" />}
              </div>
              <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {'⭐'.repeat(skill.difficulty)}
                  </span>
                  <span className="text-sm font-bold text-blue-600">{skill.points} pts</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSkill && (
        <SkillSubmissionModal
          skill={selectedSkill}
          onClose={() => {
            setSelectedSkill(null);
            loadSectionData(); // Reload to update status
          }}
        />
      )}
    </div>
  );
}

function SkillSubmissionModal({ skill, onClose }) {
  const { currentUser } = useContext(AppContext);
  const [mode, setMode] = useState('class_request');
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      await api.createSubmission({
        user_id: currentUser.id,
        skill_id: skill.id,
        mode,
        video_url: mode === 'home_video' ? videoUrl : null,
        member_notes: notes
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Submit: {skill.title}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Submission Type</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'class_request'}
                  onChange={() => setMode('class_request')}
                  className="w-4 h-4"
                />
                <span>Request Class Assessment</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'home_video'}
                  onChange={() => setMode('home_video')}
                  className="w-4 h-4"
                />
                <span>Submit Home Video</span>
              </label>
            </div>
          </div>

          {mode === 'home_video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL or Description
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="YouTube link or description"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg h-24"
              placeholder="Any additional information..."
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
      
      loadSubmissions(); // Reload after update
    } catch (error) {
      console.error('Failed to update submission:', error);
      alert('Failed to update submission: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Trainer Inbox</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
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
    requested: 'bg-yellow-50 border-yellow-300',
    submitted: 'bg-blue-50 border-blue-300',
    approved: 'bg-green-50 border-green-300',
    rejected: 'bg-red-50 border-red-300'
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[submission.status]}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
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
          submission.status === 'submitted' ? 'bg-blue-200 text-blue-800' :
          'bg-yellow-200 text-yellow-800'
        }`}>
          {submission.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Type:</p>
          <p className="text-sm text-gray-600 capitalize">{submission.mode.replace('_', ' ')}</p>
        </div>

        {submission.video_url && (
          <div>
            <p className="text-sm font-medium text-gray-700">Video:</p>
            <p className="text-sm text-blue-600">{submission.video_url}</p>
          </div>
        )}

        {submission.member_notes && (
          <div>
            <p className="text-sm font-medium text-gray-700">Member Notes:</p>
            <p className="text-sm text-gray-600">{submission.member_notes}</p>
          </div>
        )}

        {submission.trainer_notes && (
          <div>
            <p className="text-sm font-medium text-gray-700">Trainer Notes:</p>
            <p className="text-sm text-gray-600">{submission.trainer_notes}</p>
          </div>
        )}

        {(submission.status === 'requested' || submission.status === 'submitted') && (
          <div>
            {!showDecision ? (
              <button
                onClick={() => setShowDecision(true)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Review & Decide
              </button>
            ) : (
              <div className="space-y-3 pt-4 border-t">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg h-20"
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

  const handleRequestCertificate = async () => {
    if (!progress || !progress.canRequestCertificate) return;
    
    try {
      // First achieve the grade
      await api.achieveGrade({
        user_id: currentUser.id,
        grade_number: progress.currentGrade,
        completion_ids: progress.completionIds
      });
      
      // Then request certificate
      await api.requestCertificate({
        user_id: currentUser.id,
        grade_id: progress.currentGrade // This should actually be the grade record ID, but we'll use grade number for now
      });
      
      loadCertificatesData(); // Reload
    } catch (error) {
      console.error('Failed to request certificate:', error);
      alert('Failed to request certificate: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Certificates</h2>

      {progress && progress.canRequestCertificate && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">
            Ready for Grade {progress.currentGrade} Certificate!
          </h3>
          <p className="text-green-700 mb-4">
            You've completed all requirements. Request your certificate now!
          </p>
          <button
            onClick={handleRequestCertificate}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Request Certificate
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {certificates.map(cert => (
          <CertificateCard key={cert.id} certificate={cert} profile={profile} />
        ))}
        
        {certificates.length === 0 && (!progress || !progress.canRequestCertificate) && (
          <div className="col-span-2 bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No certificates yet. Keep training to earn your first grade!
          </div>
        )}
      </div>

      {currentUser.role !== 'member' && (
        <TrainerCertificateApprovals onUpdate={loadCertificatesData} />
      )}
    </div>
  );
}

function CertificateCard({ certificate, profile }) {
  const statusColors = {
    pending: 'border-yellow-300 bg-yellow-50',
    approved: 'border-green-300 bg-green-50'
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[certificate.status]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Grade {certificate.grade_number}</h3>
          <p className="text-sm text-gray-600">{profile?.dog_name || certificate.dog_name}</p>
        </div>
        <Award className={`w-8 h-8 ${certificate.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`} />
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
        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
          Download PDF
        </button>
      )}
    </div>
  );
}

function TrainerCertificateApprovals({ onUpdate }) {
  const { currentUser } = useContext(AppContext);
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

  const handleApprove = async (certId) => {
    try {
      await api.approveCertificate({
        certificate_id: certId,
        trainer_id: currentUser.id
      });
      
      loadPendingCertificates();
      onUpdate();
    } catch (error) {
      console.error('Failed to approve certificate:', error);
      alert('Failed to approve certificate: ' + error.message);
    }
  };

  if (loading || pendingCerts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Certificate Approvals</h3>
      <div className="space-y-4">
        {pendingCerts.map(cert => (
          <div key={cert.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">
                {cert.dog_name} - Grade {cert.grade_number}
              </p>
              <p className="text-sm text-gray-600">{cert.member_name}</p>
            </div>
            <button
              onClick={() => handleApprove(cert.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    dog_name: '',
    owners: '',
    notes: ''
  });

  useEffect(() => {
    loadProfile();
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
      // If profile doesn't exist, use empty form
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
      
      loadProfile(); // Reload
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dog Name</label>
          <input
            type="text"
            value={formData.dog_name}
            onChange={(e) => setFormData({ ...formData, dog_name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Max"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner(s)</label>
          <input
            type="text"
            value={formData.owners}
            onChange={(e) => setFormData({ ...formData, owners: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Sarah Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg h-24"
            placeholder="Any important information about your dog..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
      <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Admin panel features (skill/section/user management) will be connected to API in future update.
          For now, manage data directly in Azure SQL Database using Query Editor.
        </p>
      </div>

      <div className="flex space-x-2 border-b">
        {['skills', 'sections', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Admin CRUD operations will be implemented in a future update. 
          Currently, use Azure Portal Query Editor to manage {activeTab}.
        </p>
      </div>
    </div>
  );
}

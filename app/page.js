'use client';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { Camera, Award, Book, User, LogOut, Menu, X, Check, Clock, AlertCircle, Upload, FileText, Star } from 'lucide-react';

// ============= CONTEXT & DATA =============
const AppContext = createContext();

// Initial data structure
const initialData = {
  users: [
    { id: 1, email: 'member@test.com', password: 'member123', username: 'Sarah', role: 'member', active: true },
    { id: 2, email: 'trainer@test.com', password: 'trainer123', username: 'Alex', role: 'trainer', active: true },
    { id: 3, email: 'admin@test.com', password: 'admin123', username: 'Admin', role: 'admin', active: true }
  ],
  profiles: [
    { id: 1, userId: 1, dogName: 'Max', owners: 'Sarah Johnson', dogPhoto: null, notes: 'Energetic golden retriever' }
  ],
  sections: [
    { id: 1, name: 'Recall', description: 'Coming when called', order: 1, active: true },
    { id: 2, name: 'Leads', description: 'Walking on lead', order: 2, active: true },
    { id: 3, name: 'Life Skills', description: 'Everyday behaviors', order: 3, active: true },
    { id: 4, name: 'Tricks', description: 'Fun tricks', order: 4, active: true },
    { id: 5, name: 'Conditioning', description: 'Physical fitness', order: 5, active: true },
    { id: 6, name: 'Real World', description: 'Public behavior', order: 6, active: true }
  ],
  skills: [
    // Recall skills
    { id: 1, sectionId: 1, title: 'Verbal cue', description: 'Come when called by name', difficulty: 1, points: 2, active: true, order: 1 },
    { id: 2, sectionId: 1, title: 'Sit on return', description: 'Sit when they reach you', difficulty: 1, points: 2, active: true, order: 2 },
    { id: 3, sectionId: 1, title: 'Whistle cue', description: 'Come to whistle sound', difficulty: 2, points: 5, active: true, order: 3 },
    { id: 4, sectionId: 1, title: 'From 20 metres', description: 'Recall from 20m distance', difficulty: 3, points: 5, active: true, order: 4 },
    { id: 5, sectionId: 1, title: 'Past a toy', description: 'Recall past distraction toy', difficulty: 3, points: 10, active: true, order: 5 },
    { id: 6, sectionId: 1, title: 'From dog play', description: 'Come during play with other dogs', difficulty: 5, points: 15, active: true, order: 6 },
    // Leads
    { id: 7, sectionId: 2, title: 'Loose lead', description: 'Walk without pulling', difficulty: 1, points: 2, active: true, order: 1 },
    { id: 8, sectionId: 2, title: 'Stop on cue', description: 'Stop when asked', difficulty: 2, points: 5, active: true, order: 2 },
    // Life Skills
    { id: 9, sectionId: 3, title: 'Wait at door', description: 'Wait before going through doors', difficulty: 1, points: 2, active: true, order: 1 },
    { id: 10, sectionId: 3, title: 'Settle on mat', description: 'Calm on designated mat', difficulty: 2, points: 5, active: true, order: 2 },
    // Tricks
    { id: 11, sectionId: 4, title: 'Paw shake', description: 'Offer paw on cue', difficulty: 1, points: 2, active: true, order: 1 },
    { id: 12, sectionId: 4, title: 'Spin', description: 'Turn in a circle', difficulty: 2, points: 5, active: true, order: 2 },
    // Conditioning
    { id: 13, sectionId: 5, title: 'Balance work', description: 'Stand on wobble board', difficulty: 2, points: 5, active: true, order: 1 },
    // Real World
    { id: 14, sectionId: 6, title: 'Cafe visit', description: 'Calm in public cafe', difficulty: 3, points: 10, active: true, order: 1 }
  ],
  submissions: [],
  completions: [],
  grades: [],
  certificates: [],
  settings: {
    clubName: 'Pawcademy Training Club',
    maxUploadSize: 50
  }
};

const gradeRequirements = [
  { grade: 1, points: 20 }, { grade: 2, points: 20 }, { grade: 3, points: 20 },
  { grade: 4, points: 40 }, { grade: 5, points: 40 }, { grade: 6, points: 40 },
  { grade: 7, points: 60 }, { grade: 8, points: 60 }, { grade: 9, points: 60 },
  { grade: 10, points: 80 }, { grade: 11, points: 80 }, { grade: 12, points: 80 }
];

// ============= MAIN APP =============
export default function PawcademyApp() {
const [data, setData] = useState(initialData);

useEffect(() => {
  // Only run in browser, not on server
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pawcademyData');
    if (saved) {
      setData(JSON.parse(saved));
    }
  }
}, []);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');

  useEffect(() => {
    localStorage.setItem('pawcademyData', JSON.stringify(data));
  }, [data]);

  const login = (email, password) => {
    const user = data.users.find(u => u.email === email && u.password === password && u.active);
    if (user) {
      setCurrentUser(user);
      setView('dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setView('login');
  };

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppContext.Provider value={{ data, updateData, currentUser, setView, logout }}>
      <div className="min-h-screen bg-gray-50">
        {!currentUser ? (
          <LoginPage onLogin={login} />
        ) : (
          <>
            <Navigation view={view} setView={setView} />
            <main className="container mx-auto px-4 py-6">
              {view === 'dashboard' && <Dashboard />}
              {view === 'sections' && <SectionsView />}
              {view === 'inbox' && <TrainerInbox />}
              {view === 'admin' && <AdminPanel />}
              {view === 'profile' && <ProfileView />}
              {view === 'certificates' && <CertificatesView />}
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
    const result = await api.login(email, password);
    if (result.success) {
      onLogin(result.user);
    }
  } catch (err) {
    setError(err.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <Award className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Pawcademy</h1>
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
              placeholder="member@test.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t text-sm text-gray-600">
          <p className="font-semibold mb-2">Demo Accounts:</p>
          <p>Member: member@test.com / member123</p>
          <p>Trainer: trainer@test.com / trainer123</p>
          <p>Admin: admin@test.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

// ============= NAVIGATION =============
function Navigation({ view, setView }) {
  const { currentUser, logout, data } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const profile = data.profiles.find(p => p.userId === currentUser.id);
  const pendingCount = data.submissions.filter(s => 
    s.status === 'submitted' || s.status === 'requested'
  ).length;

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
              <h1 className="text-xl font-bold text-gray-800">Pawcademy</h1>
              {profile && <p className="text-xs text-gray-600">{profile.dogName}</p>}
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
  const { data, currentUser } = useContext(AppContext);
  const profile = data.profiles.find(p => p.userId === currentUser.id);
  
  const currentGrade = getCurrentGrade(currentUser.id, data);
  const progress = calculateProgress(currentUser.id, currentGrade, data);
  const gradeReq = gradeRequirements.find(g => g.grade === currentGrade);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome back, {currentUser.username}! 🐾
        </h2>
        {profile && (
          <p className="text-gray-600">Training {profile.dogName}</p>
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
          <p className="text-4xl font-bold">{progress.totalPoints} / {gradeReq?.points || 0}</p>
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
          {data.sections.filter(s => s.active).map(section => {
            const sectionPoints = progress.pointsBySection[section.id] || 0;
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
              🎉 Congratulations! You've completed Grade {currentGrade}!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Request your certificate from the Certificates page.
            </p>
          </div>
        )}
      </div>

      {currentUser.role !== 'member' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Trainer Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {data.submissions.filter(s => s.status === 'requested' || s.status === 'submitted').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {data.completions.length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {data.users.filter(u => u.role === 'member').length}
              </p>
              <p className="text-sm text-gray-600">Members</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {data.skills.filter(s => s.active).length}
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
  const { data } = useContext(AppContext);
  const [selectedSection, setSelectedSection] = useState(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Skills & Sections</h2>
      
      {!selectedSection ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.sections.filter(s => s.active).sort((a, b) => a.order - b.order).map(section => {
            const skillCount = data.skills.filter(sk => sk.sectionId === section.id && sk.active).length;
            return (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{section.name}</h3>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <p className="text-sm text-blue-600">{skillCount} skills available</p>
              </button>
            );
          })}
        </div>
      ) : (
        <SectionDetail section={selectedSection} onBack={() => setSelectedSection(null)} />
      )}
    </div>
  );
}

function SectionDetail({ section, onBack }) {
  const { data, updateData, currentUser } = useContext(AppContext);
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const skills = data.skills.filter(sk => sk.sectionId === section.id && sk.active)
    .sort((a, b) => a.order - b.order);

  const getSkillStatus = (skillId) => {
    const completion = data.completions.find(c => c.userId === currentUser.id && c.skillId === skillId);
    if (completion) return 'completed';
    
    const submission = data.submissions.find(s => 
      s.userId === currentUser.id && s.skillId === skillId && 
      (s.status === 'requested' || s.status === 'submitted')
    );
    if (submission) return submission.status;
    
    return 'available';
  };

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
          ⚠️ Unless stated otherwise, food/toys only as a reward, not as a lure or encouragement.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map(skill => {
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
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}

function SkillSubmissionModal({ skill, onClose }) {
  const { data, updateData, currentUser } = useContext(AppContext);
  const [mode, setMode] = useState('class_request');
  const [notes, setNotes] = useState('');
  const [videoFile, setVideoFile] = useState('');

  const handleSubmit = () => {
    const newSubmission = {
      id: Date.now(),
      userId: currentUser.id,
      skillId: skill.id,
      mode,
      videoUrl: mode === 'home_video' ? videoFile : null,
      memberNotes: notes,
      status: mode === 'class_request' ? 'requested' : 'submitted',
      trainerNotes: '',
      createdAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null
    };
    
    updateData('submissions', [...data.submissions, newSubmission]);
    onClose();
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
                value={videoFile}
                onChange={(e) => setVideoFile(e.target.value)}
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

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Submit
            </button>
            <button
              onClick={onClose}
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
  const { data, updateData, currentUser } = useContext(AppContext);
  const [filter, setFilter] = useState('all');
  
  const submissions = data.submissions
    .filter(s => {
      if (filter === 'pending') return s.status === 'requested' || s.status === 'submitted';
      if (filter === 'approved') return s.status === 'approved';
      if (filter === 'rejected') return s.status === 'rejected';
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleDecision = (submissionId, decision, trainerNotes = '') => {
    const submission = data.submissions.find(s => s.id === submissionId);
    if (!submission) return;

    const updatedSubmissions = data.submissions.map(s =>
      s.id === submissionId
        ? {
            ...s,
            status: decision,
            trainerNotes,
            decidedBy: currentUser.id,
            decidedAt: new Date().toISOString()
          }
        : s
    );

    updateData('submissions', updatedSubmissions);

    if (decision === 'approved') {
      const existingCompletion = data.completions.find(
        c => c.userId === submission.userId && c.skillId === submission.skillId
      );

      if (!existingCompletion) {
        const newCompletion = {
          id: Date.now(),
          userId: submission.userId,
          skillId: submission.skillId,
          approvedBy: currentUser.id,
          approvedAt: new Date().toISOString()
        };
        updateData('completions', [...data.completions, newCompletion]);
      }
    }
  };

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
          submissions.map(submission => {
            const user = data.users.find(u => u.id === submission.userId);
            const profile = data.profiles.find(p => p.userId === submission.userId);
            const skill = data.skills.find(sk => sk.id === submission.skillId);
            const section = data.sections.find(sec => sec.id === skill?.sectionId);

            return (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                user={user}
                profile={profile}
                skill={skill}
                section={section}
                onDecision={handleDecision}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function SubmissionCard({ submission, user, profile, skill, section, onDecision }) {
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
            {profile?.dogName || user?.username} - {skill?.title}
          </h3>
          <p className="text-sm text-gray-600">{section?.name} • {skill?.points} points</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(submission.createdAt).toLocaleDateString()}
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

        {submission.videoUrl && (
          <div>
            <p className="text-sm font-medium text-gray-700">Video:</p>
            <p className="text-sm text-blue-600">{submission.videoUrl}</p>
          </div>
        )}

        {submission.memberNotes && (
          <div>
            <p className="text-sm font-medium text-gray-700">Member Notes:</p>
            <p className="text-sm text-gray-600">{submission.memberNotes}</p>
          </div>
        )}

        {submission.trainerNotes && (
          <div>
            <p className="text-sm font-medium text-gray-700">Trainer Notes:</p>
            <p className="text-sm text-gray-600">{submission.trainerNotes}</p>
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
  const { data, updateData, currentUser } = useContext(AppContext);
  const currentGrade = getCurrentGrade(currentUser.id, data);
  const progress = calculateProgress(currentUser.id, currentGrade, data);
  
  const userCertificates = data.certificates.filter(c => c.userId === currentUser.id);
  
  const handleRequestCertificate = () => {
    if (!progress.canRequestCertificate) return;
    
    const newCert = {
      id: Date.now(),
      userId: currentUser.id,
      grade: currentGrade,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      certificateUrl: null,
      publicCode: Math.random().toString(36).substring(2, 10).toUpperCase()
    };
    
    updateData('certificates', [...data.certificates, newCert]);
    
    // Mark grade as achieved
    const newGrade = {
      id: Date.now(),
      userId: currentUser.id,
      grade: currentGrade,
      achievedAt: new Date().toISOString(),
      completionIds: progress.currentGradeCompletions.map(c => c.id)
    };
    updateData('grades', [...data.grades, newGrade]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Certificates</h2>

      {progress.canRequestCertificate && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">
            🎉 Ready for Grade {currentGrade} Certificate!
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
        {userCertificates.map(cert => {
          const profile = data.profiles.find(p => p.userId === currentUser.id);
          return (
            <CertificateCard key={cert.id} certificate={cert} profile={profile} data={data} />
          );
        })}
        
        {userCertificates.length === 0 && !progress.canRequestCertificate && (
          <div className="col-span-2 bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No certificates yet. Keep training to earn your first grade!
          </div>
        )}
      </div>

      {currentUser.role !== 'member' && (
        <TrainerCertificateApprovals />
      )}
    </div>
  );
}

function CertificateCard({ certificate, profile, data }) {
  const statusColors = {
    pending: 'border-yellow-300 bg-yellow-50',
    approved: 'border-green-300 bg-green-50'
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[certificate.status]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Grade {certificate.grade}</h3>
          <p className="text-sm text-gray-600">{profile?.dogName}</p>
        </div>
        <Award className={`w-8 h-8 ${certificate.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`} />
      </div>
      
      <div className="space-y-2 text-sm">
        <p className="text-gray-600">
          Status: <span className="font-medium capitalize">{certificate.status}</span>
        </p>
        {certificate.approvedAt && (
          <p className="text-gray-600">
            Approved: {new Date(certificate.approvedAt).toLocaleDateString()}
          </p>
        )}
        {certificate.publicCode && (
          <p className="text-gray-600">
            Certificate ID: <span className="font-mono font-bold">{certificate.publicCode}</span>
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

function TrainerCertificateApprovals() {
  const { data, updateData, currentUser } = useContext(AppContext);
  
  const pendingCerts = data.certificates.filter(c => c.status === 'pending');

  const handleApprove = (certId) => {
    const updatedCerts = data.certificates.map(c =>
      c.id === certId
        ? {
            ...c,
            status: 'approved',
            approvedBy: currentUser.id,
            approvedAt: new Date().toISOString()
          }
        : c
    );
    updateData('certificates', updatedCerts);
  };

  if (pendingCerts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Certificate Approvals</h3>
      <div className="space-y-4">
        {pendingCerts.map(cert => {
          const user = data.users.find(u => u.id === cert.userId);
          const profile = data.profiles.find(p => p.userId === cert.userId);
          
          return (
            <div key={cert.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">
                  {profile?.dogName} - Grade {cert.grade}
                </p>
                <p className="text-sm text-gray-600">{user?.username}</p>
              </div>
              <button
                onClick={() => handleApprove(cert.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Approve
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============= PROFILE =============
function ProfileView() {
  const { data, updateData, currentUser } = useContext(AppContext);
  const [profile, setProfile] = useState(
    data.profiles.find(p => p.userId === currentUser.id) || {
      userId: currentUser.id,
      dogName: '',
      owners: '',
      dogPhoto: null,
      notes: ''
    }
  );

  const handleSave = () => {
    const existingProfile = data.profiles.find(p => p.userId === currentUser.id);
    if (existingProfile) {
      updateData('profiles', data.profiles.map(p =>
        p.userId === currentUser.id ? { ...profile, id: p.id } : p
      ));
    } else {
      updateData('profiles', [...data.profiles, { ...profile, id: Date.now() }]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dog Name</label>
          <input
            type="text"
            value={profile.dogName}
            onChange={(e) => setProfile({ ...profile, dogName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Max"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner(s)</label>
          <input
            type="text"
            value={profile.owners}
            onChange={(e) => setProfile({ ...profile, owners: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Sarah Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={profile.notes}
            onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg h-24"
            placeholder="Any important information about your dog..."
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}

// ============= ADMIN PANEL =============
function AdminPanel() {
  const { data, updateData } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('skills');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>

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

      {activeTab === 'skills' && <SkillsManager />}
      {activeTab === 'sections' && <SectionsManager />}
      {activeTab === 'users' && <UsersManager />}
    </div>
  );
}

function SkillsManager() {
  const { data, updateData } = useContext(AppContext);
  const [editingSkill, setEditingSkill] = useState(null);

  const handleSave = (skill) => {
    if (skill.id) {
      updateData('skills', data.skills.map(s => s.id === skill.id ? skill : s));
    } else {
      updateData('skills', [...data.skills, { ...skill, id: Date.now() }]);
    }
    setEditingSkill(null);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setEditingSkill({ title: '', description: '', sectionId: 1, difficulty: 1, points: 2, active: true, order: 1 })}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        + Add Skill
      </button>

      {editingSkill && (
        <div className="bg-white border-2 border-blue-300 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-lg">Edit Skill</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={editingSkill.title}
              onChange={(e) => setEditingSkill({ ...editingSkill, title: e.target.value })}
              placeholder="Skill title"
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={editingSkill.sectionId}
              onChange={(e) => setEditingSkill({ ...editingSkill, sectionId: parseInt(e.target.value) })}
              className="px-3 py-2 border rounded-lg"
            >
              {data.sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={editingSkill.difficulty}
              onChange={(e) => setEditingSkill({ ...editingSkill, difficulty: parseInt(e.target.value) })}
              placeholder="Difficulty (1-5)"
              min="1"
              max="5"
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              value={editingSkill.points}
              onChange={(e) => setEditingSkill({ ...editingSkill, points: parseInt(e.target.value) })}
              placeholder="Points"
              className="px-3 py-2 border rounded-lg"
            />
            <textarea
              value={editingSkill.description}
              onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
              placeholder="Description"
              className="col-span-2 px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleSave(editingSkill)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingSkill(null)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {data.skills.map(skill => {
          const section = data.sections.find(s => s.id === skill.sectionId);
          return (
            <div key={skill.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-bold">{skill.title}</p>
                <p className="text-sm text-gray-600">{section?.name} • {skill.points}pts • {'⭐'.repeat(skill.difficulty)}</p>
              </div>
              <button
                onClick={() => setEditingSkill(skill)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionsManager() {
  const { data } = useContext(AppContext);
  
  return (
    <div className="space-y-4">
      {data.sections.map(section => (
        <div key={section.id} className="bg-white border rounded-lg p-4">
          <h3 className="font-bold text-lg">{section.name}</h3>
          <p className="text-gray-600">{section.description}</p>
        </div>
      ))}
    </div>
  );
}

function UsersManager() {
  const { data, updateData } = useContext(AppContext);

  const toggleActive = (userId) => {
    updateData('users', data.users.map(u =>
      u.id === userId ? { ...u, active: !u.active } : u
    ));
  };

  return (
    <div className="space-y-2">
      {data.users.map(user => (
        <div key={user.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="font-bold">{user.username}</p>
            <p className="text-sm text-gray-600">{user.email} • {user.role}</p>
          </div>
          <button
            onClick={() => toggleActive(user.id)}
            className={`px-4 py-2 rounded-lg ${
              user.active
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {user.active ? 'Active' : 'Inactive'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ============= HELPER FUNCTIONS =============
function getCurrentGrade(userId, data) {
  const userGrades = data.grades.filter(g => g.userId === userId).sort((a, b) => b.grade - a.grade);
  return userGrades.length > 0 ? userGrades[0].grade + 1 : 1;
}

function calculateProgress(userId, currentGrade, data) {
  const lastGrade = data.grades.filter(g => g.userId === userId).find(g => g.grade === currentGrade - 1);
  const usedCompletionIds = data.grades
    .filter(g => g.userId === userId && g.grade < currentGrade)
    .flatMap(g => g.completionIds || []);

  const availableCompletions = data.completions.filter(c =>
    c.userId === userId && !usedCompletionIds.includes(c.id)
  );

  const currentGradeCompletions = availableCompletions;
  
  let totalPoints = 0;
  const pointsBySection = {};
  const sectionsWithSkills = new Set();

  currentGradeCompletions.forEach(completion => {
    const skill = data.skills.find(s => s.id === completion.skillId);
    if (skill) {
      totalPoints += skill.points;
      pointsBySection[skill.sectionId] = (pointsBySection[skill.sectionId] || 0) + skill.points;
      sectionsWithSkills.add(skill.sectionId);
    }
  });

  const gradeReq = gradeRequirements.find(g => g.grade === currentGrade);
  const canRequestCertificate = 
    totalPoints >= (gradeReq?.points || 0) && 
    sectionsWithSkills.size === 6 &&
    !data.certificates.some(c => c.userId === userId && c.grade === currentGrade);

  return {
    totalPoints,
    pointsBySection,
    sectionsWithSkills: Array.from(sectionsWithSkills),
    canRequestCertificate,
    currentGradeCompletions
  };
}

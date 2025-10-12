// app/page.js (NEW SIMPLIFIED VERSION - Replace your entire current file with this)
'use client';
import React, { useState, createContext, useEffect } from 'react';
import { ToastProvider } from './components/shared/ToastProvider';
import LoginPage from './components/auth/LoginPage';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/dashboard/Dashboard';
import SectionsView from './components/sections/SectionsView';
import TrainerInbox from './components/inbox/TrainerInbox';
import CertificatesView from './components/certificates/CertificatesView';
import ProfileView from './components/profile/ProfileView';
import AdminPanel from './components/admin/AdminPanel';
import LeaderboardView from './components/leaderboard/LeaderboardView';
import MyClassesView from './components/myclasses/MyClassesView';
import { api } from '@/lib/api';

// Create and export AppContext so child components can use it
export const AppContext = createContext();

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

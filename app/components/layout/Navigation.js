// app/components/layout/Navigation.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Award, Book, User, LogOut, Menu, X, Clock, FileText, Trophy } from 'lucide-react';
import { AppContext } from '@/app/page';
import { api } from '@/lib/api';
import { getRoleDisplayName } from '@/lib/constants';

export default function Navigation({ view, setView }) {
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
    { key: 'myclasses', label: 'Classes', icon: User, roles: ['trainer', 'admin'] },
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

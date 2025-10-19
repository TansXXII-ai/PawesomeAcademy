// app/components/admin/AdminPanel.js - REPLACE ENTIRE FILE
'use client';
import React, { useState } from 'react';
import { Users, Book, Award, Calendar } from 'lucide-react';
import AdminUsersTab from './AdminUsersTab';
import AdminSectionsTab from './AdminSectionsTab';
import AdminSkillsTab from './AdminSkillsTab';
import AdminClassesTab from './AdminClassesTab';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'sections', label: 'Sections', icon: Book },
    { key: 'skills', label: 'Skills', icon: Award },
    { key: 'classes', label: 'Classes', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
        <h2 className="text-2xl font-bold text-[#32303b]">Admin Panel</h2>
        <p className="text-gray-600">Manage users, content, and classes</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] overflow-hidden">
        <div className="border-b-2 border-[#dcac6e] flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#32303b] text-white border-b-4 border-[#dcac6e]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'sections' && <AdminSectionsTab />}
          {activeTab === 'skills' && <AdminSkillsTab />}
          {activeTab === 'classes' && <AdminClassesTab />}
        </div>
      </div>
    </div>
  );
}

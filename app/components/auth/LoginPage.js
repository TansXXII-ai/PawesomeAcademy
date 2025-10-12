// app/components/auth/LoginPage.js
'use client';
import React, { useState } from 'react';

export default function LoginPage({ onLogin }) {
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

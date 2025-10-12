// lib/api.js
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

export const api = {
  // Auth
  login: (email, password) => 
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  logout: () => 
    fetchAPI('/auth/logout', { method: 'POST' }),
  
  // Sections
  getSections: () => 
    fetchAPI('/sections'),
  
  // Skills
  getSkills: (sectionId = null) => 
    fetchAPI(`/skills${sectionId ? `?sectionId=${sectionId}` : ''}`),
  
  // Profiles
  getProfile: (userId) => 
    fetchAPI(`/profiles?userId=${userId}`),
  
  saveProfile: (profile) =>
    fetchAPI('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),
  
  // Submissions
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
  
  // Grades
  getGradeProgress: (userId) =>
    fetchAPI(`/grades/progress?userId=${userId}`),
  
  achieveGrade: (data) =>
    fetchAPI('/grades/achieve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Certificates
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

  // Classes
  getClasses: (trainerId = null, includeMembers = false) => {
    const params = new URLSearchParams();
    if (trainerId) params.append('trainerId', trainerId);
    if (includeMembers) params.append('includeMembers', 'true');
    return fetchAPI(`/classes?${params}`);
  },

  getAllClasses: () => 
    fetchAPI('/classes?includeMembers=true'),

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

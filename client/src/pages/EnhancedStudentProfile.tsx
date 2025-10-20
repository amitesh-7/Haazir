import React, { useEffect, useState, useRef } from 'react';
import { api, getProfile } from '../services/api';

interface StudentData {
  name: string;
  email: string;
  student_id: string;
  roll_number: string;
  contact_number: string;
  parent_name: string;
  parent_contact: string;
  address: string;
  date_of_birth: string;
  gender: string;
  year_of_study: number;
  department_name: string;
  profile_picture?: string;
}

interface AcademicInfo {
  gpa: number;
  totalCredits: number;
  completedCredits: number;
  currentSemester: number;
  academicYear: string;
  admissionDate: string;
}

const EnhancedStudentProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [studentData, setStudentData] = useState<StudentData>({
    name: '',
    email: '',
    student_id: '',
    roll_number: '',
    contact_number: '',
    parent_name: '',
    parent_contact: '',
    address: '',
    date_of_birth: '',
    gender: '',
    year_of_study: 1,
    department_name: '',
    profile_picture: ''
  });
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo>({
    gpa: 3.75,
    totalCredits: 120,
    completedCredits: 75,
    currentSemester: 6,
    academicYear: '2024-25',
    admissionDate: '2022-09-15'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'settings'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getProfile();
      setProfile(data.user);
      
      const student = data.user?.student || data.user?.profile || {};
      setStudentData({
        name: student.name || data.user?.name || '',
        email: data.user?.email || '',
        student_id: student.student_id || '',
        roll_number: student.roll_number || '',
        contact_number: student.contact_number || '',
        parent_name: student.parent_name || '',
        parent_contact: student.parent_contact || '',
        address: student.address || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        year_of_study: student.year_of_study || 1,
        department_name: student.department?.name || student.department_name || '',
        profile_picture: student.profile_picture || ''
      });
      
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setError(null);
    setMessage(null);
    try {
      setSaving(true);
      await api.put('/students/me/profile', {
        name: studentData.name,
        contact_number: studentData.contact_number,
        parent_name: studentData.parent_name,
        parent_contact: studentData.parent_contact,
        address: studentData.address,
        date_of_birth: studentData.date_of_birth,
        gender: studentData.gender
      });
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size should be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      // Mock API call for image upload
      // await api.post('/students/me/profile-picture', formData);
      
      // For demo, create object URL
      const imageUrl = URL.createObjectURL(file);
      setStudentData(prev => ({
        ...prev,
        profile_picture: imageUrl
      }));
      
      setMessage('Profile picture updated!');
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setError('Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
    return Math.round((academicInfo.completedCredits / academicInfo.totalCredits) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button 
                  onClick={loadProfile}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            My Profile 👤
          </h1>
          <p className="text-gray-600 text-lg">Manage your personal information and academic details</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="relative mb-6">
                <div className="relative inline-block">
                  <img
                    src={studentData.profile_picture || 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=Profile'}
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-100"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                    title="Change profile picture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{studentData.name}</h2>
              <p className="text-gray-600 mb-4">{studentData.email}</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Student ID:</span>
                  <span className="text-gray-900">{studentData.student_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Roll Number:</span>
                  <span className="text-gray-900">{studentData.roll_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Department:</span>
                  <span className="text-gray-900">{studentData.department_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Year:</span>
                  <span className="text-gray-900">{studentData.year_of_study}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Academic Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {academicInfo.completedCredits} / {academicInfo.totalCredits} Credits ({calculateProgress()}%)
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { id: 'personal', name: 'Personal Info', icon: '👤' },
                    { id: 'academic', name: 'Academic Details', icon: '📚' },
                    { id: 'settings', name: 'Settings', icon: '⚙️' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Personal Info Tab */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-semibold text-gray-900">Personal Information</h3>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isEditing
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={studentData.name}
                            onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                            {studentData.name || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-500">
                          {studentData.email} (Cannot be changed)
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={studentData.contact_number}
                            onChange={(e) => setStudentData(prev => ({ ...prev, contact_number: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                            {studentData.contact_number || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={studentData.date_of_birth}
                            onChange={(e) => setStudentData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                            {studentData.date_of_birth ? new Date(studentData.date_of_birth).toLocaleDateString() : 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        {isEditing ? (
                          <select
                            value={studentData.gender}
                            onChange={(e) => setStudentData(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                            {studentData.gender || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parent/Guardian Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={studentData.parent_name}
                            onChange={(e) => setStudentData(prev => ({ ...prev, parent_name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                            {studentData.parent_name || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parent/Guardian Contact</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={studentData.parent_contact}
                            onChange={(e) => setStudentData(prev => ({ ...prev, parent_contact: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                            {studentData.parent_contact || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        {isEditing ? (
                          <textarea
                            value={studentData.address}
                            onChange={(e) => setStudentData(prev => ({ ...prev, address: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                            {studentData.address || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveProfile}
                          disabled={saving}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Academic Details Tab */}
                {activeTab === 'academic' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">Academic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-blue-900">Current GPA</h4>
                          <div className="p-2 bg-blue-100 rounded-full">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{academicInfo.gpa.toFixed(2)}</p>
                        <p className="text-sm text-blue-600 mt-2">out of 4.0</p>
                      </div>

                      <div className="bg-green-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-green-900">Credits</h4>
                          <div className="p-2 bg-green-100 rounded-full">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-green-900">{academicInfo.completedCredits}</p>
                        <p className="text-sm text-green-600 mt-2">of {academicInfo.totalCredits} required</p>
                      </div>

                      <div className="bg-purple-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-purple-900">Semester</h4>
                          <div className="p-2 bg-purple-100 rounded-full">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-purple-900">{academicInfo.currentSemester}</p>
                        <p className="text-sm text-purple-600 mt-2">Current semester</p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Academic Timeline</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium text-gray-700">Academic Year</span>
                          <span className="text-gray-900">{academicInfo.academicYear}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium text-gray-700">Admission Date</span>
                          <span className="text-gray-900">{new Date(academicInfo.admissionDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium text-gray-700">Expected Graduation</span>
                          <span className="text-gray-900">May 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h3>

                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">Email Notifications</h5>
                              <p className="text-sm text-gray-500">Receive important updates via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">SMS Notifications</h5>
                              <p className="text-sm text-gray-500">Get text messages for urgent updates</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">Profile Visibility</h5>
                              <p className="text-sm text-gray-500">Control who can see your profile</p>
                            </div>
                            <select className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>Everyone</option>
                              <option>Students Only</option>
                              <option>Teachers Only</option>
                              <option>Private</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentProfile;
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from 'axios';

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    family_name: '',
    school_year: '',
    school_year_other: '',
    experience: [] as string[],
    needs_device: false,
    medical_info: '',
    parent_name: '',
    parent_phone: '',
  });

  const [experienceInput, setExperienceInput] = useState('');

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://127.0.0.1:8000/api/waitlist/students/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = response.data;
      setFormData({
        email: data.email || '',
        first_name: data.first_name || '',
        family_name: data.family_name || '',
        school_year: data.school_year || '',
        school_year_other: data.school_year_other || '',
        experience: data.experience || [],
        needs_device: data.needs_device || false,
        medical_info: data.medical_info || '',
        parent_name: data.parent_name || '',
        parent_phone: data.parent_phone || '',
      });
      if (data.experience && data.experience.length > 0) {
        setExperienceInput(data.experience.join(', '));
      }
    } catch (error) {
      console.error('Failed to load student:', error);
      setError('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setExperienceInput(value);
    // Convert comma-separated string to array
    const expArray = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setFormData(prev => ({ ...prev, experience: expArray }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `http://127.0.0.1:8000/api/waitlist/students/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccess('Student updated successfully!');
      setTimeout(() => {
        navigate('/admin/students');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update student:', error);
      setError(error.response?.data?.detail || 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/admin/students')}
                className="mb-4 flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
                style={{ 
                  color: '#6AA469',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Students
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
              <p className="text-gray-600 mt-2">Update student information</p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600">{success}</p>
              </div>
            )}

            {/* Form */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6AA469' }}></div>
                <p className="mt-4 text-gray-600">Loading student data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-8">
                {/* Student Information */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                        style={{ 
                          focusRingColor: '#6AA469'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Family Name *
                      </label>
                      <input
                        type="text"
                        name="family_name"
                        value={formData.family_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Year *
                      </label>
                      <select
                        name="school_year"
                        value={formData.school_year}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                      >
                        <option value="">Select Year</option>
                        <option value="Year 9">Year 9</option>
                        <option value="Year 10">Year 10</option>
                        <option value="Year 11">Year 11</option>
                        <option value="Year 12">Year 12</option>
                        <option value="Year 13">Year 13</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {formData.school_year === 'Other' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Please specify school year
                        </label>
                        <input
                          type="text"
                          name="school_year_other"
                          value={formData.school_year_other}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Previous Experience (comma-separated)
                      </label>
                      <textarea
                        name="experience"
                        value={experienceInput}
                        onChange={handleExperienceChange}
                        rows={3}
                        placeholder="e.g., Python, HTML, CSS"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Separate multiple items with commas
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="needs_device"
                          checked={formData.needs_device}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-300"
                          style={{ accentColor: '#6AA469' }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Student needs a device loan
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical Information or Allergies
                      </label>
                      <textarea
                        name="medical_info"
                        value={formData.medical_info}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                        placeholder="Any medical conditions, allergies, or special requirements we should know about..."
                      />
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Parent/Guardian Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent/Guardian Name *
                      </label>
                      <input
                        type="text"
                        name="parent_name"
                        value={formData.parent_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent/Guardian Phone *
                      </label>
                      <input
                        type="tel"
                        name="parent_phone"
                        value={formData.parent_phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/students')}
                    disabled={isSaving}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    style={{ 
                      backgroundColor: '#00A8E8'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.backgroundColor = '#0077B6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.backgroundColor = '#00A8E8';
                      }
                    }}
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditStudent;

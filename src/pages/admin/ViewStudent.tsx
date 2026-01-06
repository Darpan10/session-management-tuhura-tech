import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, User, Calendar, GraduationCap, Laptop, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from 'axios';

interface Student {
  id: number;
  email: string;
  first_name: string;
  family_name: string;
  school_year: string;
  school_year_other?: string;
  experience: string[];
  needs_device: boolean;
  medical_info?: string;
  parent_name: string;
  parent_phone: string;
  created_at: string;
}

const ViewStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      setStudent(response.data);
    } catch (error) {
      console.error('Failed to load student:', error);
      setError('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/admin/students/${id}/edit`);
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
                className="mb-4 flex items-center gap-2 px-4 py-2 rounded-md transition-colors hover:bg-gray-100"
                style={{ color: '#00A8E8' }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Students
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Student Details</h1>
                  <p className="text-gray-600 mt-2">View complete student information</p>
                </div>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 text-white rounded-md transition-colors"
                  style={{ backgroundColor: '#00A8E8' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0077B6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00A8E8';
                  }}
                >
                  <Edit className="w-5 h-5" />
                  Edit Student
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00A8E8' }}></div>
                <p className="mt-4 text-gray-600">Loading student data...</p>
              </div>
            ) : student ? (
              <div className="space-y-6">
                {/* Student Information Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b" style={{ color: '#6AA469' }}>
                    Student Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="text-base font-medium text-gray-900">
                          {student.first_name} {student.family_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-base font-medium text-gray-900">{student.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">School Year</p>
                        <p className="text-base font-medium text-gray-900">
                          {student.school_year}
                          {student.school_year === 'Other' && student.school_year_other && 
                            ` (${student.school_year_other})`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Submitted On</p>
                        <p className="text-base font-medium text-gray-900">
                          {new Date(student.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {student.experience && student.experience.length > 0 && (
                      <div className="md:col-span-2 flex items-start gap-3">
                        <GraduationCap className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">Previous Experience</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {student.experience.map((exp, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: '#6AA469' }}
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2 flex items-start gap-3">
                      <Laptop className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Device Loan Required</p>
                        <p className="text-base font-medium text-gray-900">
                          {student.needs_device ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {student.medical_info && (
                      <div className="md:col-span-2 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Medical Information</p>
                          <p className="text-base text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                            {student.medical_info}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent/Guardian Information Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b" style={{ color: '#6AA469' }}>
                    Parent/Guardian Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="text-base font-medium text-gray-900">{student.parent_name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-base font-medium text-gray-900">{student.parent_phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Student not found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewStudent;

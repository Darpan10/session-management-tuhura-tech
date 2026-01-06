import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import type { SessionFormData, StaffMember } from '../../types/session';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect non-admin users
  useEffect(() => {
    if (user && !user.roles?.includes('ADMIN')) {
      navigate('/admin/calendar');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState<SessionFormData>({
    title: '',
    term: 'Term 1',
    dayOfWeek: 'Monday',
    startDate: '',
    endDate: '',
    startTime: '15:30', // 3:30 PM
    endTime: '17:30',   // 5:30 PM
    location: '',
    city: '',
    locationUrl: '',
    capacity: 20,
    minAge: 5,
    maxAge: 18,
    staffIds: [],
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load staff members on component mount
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await sessionAPI.getStaff();
        setStaffMembers(staff);
      } catch (error) {
        console.error('Failed to load staff members:', error);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadStaff();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.term) {
      newErrors.term = 'Term is required';
    }

    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = 'Day of week is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be after or equal to start date';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (!formData.location || formData.location.trim().length < 3) {
      newErrors.location = 'Location must be at least 3 characters';
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    }

    if (!formData.capacity || formData.capacity < 1 || formData.capacity > 200) {
      newErrors.capacity = 'Capacity must be between 1 and 200';
    }

    if (!formData.minAge || formData.minAge < 0 || formData.minAge > 100) {
      newErrors.minAge = 'Minimum age must be between 0 and 100';
    }

    if (!formData.maxAge || formData.maxAge < 0 || formData.maxAge > 100) {
      newErrors.maxAge = 'Maximum age must be between 0 and 100';
    }

    if (formData.minAge >= formData.maxAge) {
      newErrors.maxAge = 'Maximum age must be greater than minimum age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseInt(value);
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    setErrors((prev) => ({ ...prev, [name]: '', general: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await sessionAPI.createSession({
        title: formData.title.trim(),
        term: formData.term,
        dayOfWeek: formData.dayOfWeek,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location.trim(),
        city: formData.city.trim(),
        locationUrl: formData.locationUrl?.trim(),
        capacity: formData.capacity,
        minAge: formData.minAge,
        maxAge: formData.maxAge,
        staffIds: formData.staffIds,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/admin/sessions');
      }, 2000);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create session',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin/sessions')}
              className="text-[#6AA469] hover:text-[#5a9159] mb-4 flex items-center font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sessions
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Session</h1>
            <p className="mt-2 text-tuhura-gray">Fill in the details to create a new session.</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="success-message bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                  Session created successfully! Redirecting...
                </div>
              )}

              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Robotics"
                  className={`input-field ${errors.title ? 'input-error' : ''}`}
                />
                {errors.title && <p className="error-message">{errors.title}</p>}
              </div>

              {/* Term and Day of Week */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="term" className="block text-sm font-medium text-gray-700">
                    Term <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="term"
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    className={`input-field ${errors.term ? 'input-error' : ''}`}
                  >
                    {TERMS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                  {errors.term && <p className="error-message">{errors.term}</p>}
                </div>

                <div>
                  <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                    Day of Week <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="dayOfWeek"
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleChange}
                    className={`input-field ${errors.dayOfWeek ? 'input-error' : ''}`}
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  {errors.dayOfWeek && <p className="error-message">{errors.dayOfWeek}</p>}
                </div>
              </div>

              {/* Start Date and End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`input-field ${errors.startDate ? 'input-error' : ''}`}
                  />
                  {errors.startDate && <p className="error-message">{errors.startDate}</p>}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={`input-field ${errors.endDate ? 'input-error' : ''}`}
                  />
                  {errors.endDate && <p className="error-message">{errors.endDate}</p>}
                </div>
              </div>

              {/* Start Time and End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`input-field ${errors.startTime ? 'input-error' : ''}`}
                  />
                  {errors.startTime && <p className="error-message">{errors.startTime}</p>}
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={`input-field ${errors.endTime ? 'input-error' : ''}`}
                  />
                  {errors.endTime && <p className="error-message">{errors.endTime}</p>}
                </div>
              </div>

              {/* Location and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Walter Nash Centre"
                    className={`input-field ${errors.location ? 'input-error' : ''}`}
                  />
                  {errors.location && <p className="error-message">{errors.location}</p>}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Auckland"
                    className={`input-field ${errors.city ? 'input-error' : ''}`}
                  />
                  {errors.city && <p className="error-message">{errors.city}</p>}
                </div>
              </div>

              {/* Location URL (optional) */}
              <div>
                <label htmlFor="locationUrl" className="block text-sm font-medium text-gray-700">
                  Location URL (optional)
                </label>
                <input
                  id="locationUrl"
                  name="locationUrl"
                  type="url"
                  value={formData.locationUrl || ''}
                  onChange={handleChange}
                  placeholder="https://www.google.com/maps/place/..."
                  className="input-field"
                />
                <p className="mt-1 text-xs text-tuhura-gray">
                  Optional Google Maps link for the location
                </p>
              </div>

              {/* Capacity */}
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={`input-field ${errors.capacity ? 'input-error' : ''}`}
                />
                {errors.capacity && <p className="error-message">{errors.capacity}</p>}
              </div>

              {/* Age Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="minAge" className="block text-sm font-medium text-gray-700">
                    Minimum Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="minAge"
                    name="minAge"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.minAge}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    className={`input-field ${errors.minAge ? 'input-error' : ''}`}
                  />
                  {errors.minAge && <p className="error-message">{errors.minAge}</p>}
                </div>

                <div>
                  <label htmlFor="maxAge" className="block text-sm font-medium text-gray-700">
                    Maximum Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="maxAge"
                    name="maxAge"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxAge}
                    onChange={handleChange}
                    placeholder="e.g., 18"
                    className={`input-field ${errors.maxAge ? 'input-error' : ''}`}
                  />
                  {errors.maxAge && <p className="error-message">{errors.maxAge}</p>}
                </div>
              </div>

              {/* Staff Assignment */}
              <div>
                <label htmlFor="staffIds" className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Lead Mentors/Staff (optional)
                </label>
                {loadingStaff ? (
                  <p className="text-sm text-gray-500">Loading staff members...</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                    {staffMembers.length === 0 ? (
                      <p className="text-sm text-gray-500">No staff members available</p>
                    ) : (
                      staffMembers.map((staff) => (
                        <label
                          key={staff.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.staffIds.includes(staff.id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                staffIds: isChecked
                                  ? [...prev.staffIds, staff.id]
                                  : prev.staffIds.filter(id => id !== staff.id)
                              }));
                            }}
                            className="h-4 w-4 text-tuhura-green focus:ring-tuhura-green border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{staff.userName}</p>
                            <p className="text-xs text-gray-500">{staff.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {formData.staffIds.length > 0 && (
                  <p className="mt-2 text-xs text-tuhura-gray">
                    {formData.staffIds.length} staff member{formData.staffIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/sessions')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Session'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;

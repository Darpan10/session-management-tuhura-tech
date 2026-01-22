import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import { termAPI, Term } from '../../services/termAPI';
import type { SessionFormData, StaffMember } from '../../types/session';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useGooglePlacesAutocomplete } from '../../hooks/useGooglePlacesAutocomplete';

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
    description: '',
    termIds: [],
    dayOfWeek: 'Monday',
    startTime: '15:30', // 3:30 PM
    endTime: '17:30',   // 5:30 PM
    location: '',
    city: 'Wellington',
    locationUrl: '',
    capacity: 20,
    minAge: 5,
    maxAge: 13,
    staffIds: [],
  });

  const [terms, setTerms] = useState<Term[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Load terms and staff members on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [termsData, staff] = await Promise.all([
          termAPI.getAllTerms(),
          sessionAPI.getStaff()
        ]);
        setTerms(termsData);
        setStaffMembers(staff);
      } catch (error) {
        console.error('Failed to load data:', error);
        setErrors({ general: 'Failed to load terms and staff. Please refresh the page.' });
      } finally {
        setLoadingStaff(false);
        setLoadingTerms(false);
      }
    };

    loadData();
  }, []);

  // Setup Google Places Autocomplete
  useGooglePlacesAutocomplete(locationInputRef, (place) => {
    if (place.formatted_address) {
      setFormData(prev => ({
        ...prev,
        location: place.formatted_address || '',
        locationUrl: place.url || '',
      }));
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (formData.termIds.length === 0) {
      newErrors.termIds = 'At least one term is required';
    }

    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = 'Day of week is required';
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        description: formData.description?.trim(),
        termIds: formData.termIds,
        dayOfWeek: formData.dayOfWeek,
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
                  placeholder="e.g., Walter Nash Neighbourhood Hub"
                  className={`input-field ${errors.title ? 'input-error' : ''}`}
                />
                {errors.title && <p className="error-message">{errors.title}</p>}
              </div>

              {/* Session Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter session description..."
                  className="input-field resize-y min-h-[100px]"
                />
              </div>

              {/* Terms Selection with Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms <span className="text-red-500">*</span>
                </label>
                {loadingTerms ? (
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                ) : (
                  <div className="space-y-2">
                    {terms.map((term) => (
                      <label key={term.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.termIds.includes(term.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              termIds: checked
                                ? [...prev.termIds, term.id]
                                : prev.termIds.filter(id => id !== term.id)
                            }));
                          }}
                          className="mt-1 h-4 w-4 text-[#6AA469] focus:ring-[#6AA469] border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{term.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {errors.termIds && <p className="error-message">{errors.termIds}</p>}
              </div>

              {/* Day of Week */}
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

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  ref={locationInputRef}
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Search for a location in New Zealand..."
                  className={`input-field ${errors.location ? 'input-error' : ''}`}
                />
                {errors.location && <p className="error-message">{errors.location}</p>}
              </div>

              {/* City */}
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
                  placeholder="e.g., Wellington"
                  className={`input-field ${errors.city ? 'input-error' : ''}`}
                />
                {errors.city && <p className="error-message">{errors.city}</p>}
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

              {/* Years Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="minAge" className="block text-sm font-medium text-gray-700">
                    Minimum Years <span className="text-red-500">*</span>
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
                    Maximum Years <span className="text-red-500">*</span>
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
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
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

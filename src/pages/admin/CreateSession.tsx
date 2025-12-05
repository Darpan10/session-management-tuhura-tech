import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import type { SessionFormData, Term, Staff } from '../../types/session';

const CreateSession: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SessionFormData>({
    term: '',
    year: new Date().getFullYear(),
    startDateTime: '',
    location: '',
    capacity: 20,
    minAge: 5,
    maxAge: 18,
    assignedStaff: [],
    recurringPattern: 'weekly',
    endDate: '',
  });

  const [terms, setTerms] = useState<Term[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);
      const [termsData, staffData] = await Promise.all([
        sessionAPI.getTerms(),
        sessionAPI.getStaff(),
      ]);
      setTerms(termsData);
      setStaff(staffData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setErrors({ general: 'Failed to load required data. Please refresh the page.' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.term) {
      newErrors.term = 'Please select a term';
    }

    if (!formData.year || formData.year < 2020 || formData.year > 2100) {
      newErrors.year = 'Please enter a valid year';
    }

    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Start date and time is required';
    }

    if (!formData.location || formData.location.trim().length < 3) {
      newErrors.location = 'Location must be at least 3 characters';
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

    if (selectedStaff.length === 0) {
      newErrors.assignedStaff = 'Please assign at least one staff member';
    }

    if (formData.recurringPattern !== 'none' && !formData.endDate) {
      newErrors.endDate = 'End date is required for recurring sessions';
    }

    if (formData.endDate && formData.startDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseInt(value) || 0 : value;
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    setErrors((prev) => ({ ...prev, [name]: '', general: '' }));
  };

  const handleStaffToggle = (staffId: number) => {
    setSelectedStaff((prev) => {
      if (prev.includes(staffId)) {
        return prev.filter((id) => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
    setErrors((prev) => ({ ...prev, assignedStaff: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const requestData = {
        term: formData.term,
        year: formData.year,
        startDateTime: formData.startDateTime,
        location: formData.location.trim(),
        capacity: formData.capacity,
        minAge: formData.minAge,
        maxAge: formData.maxAge,
        assignedStaffIds: selectedStaff,
        recurringPattern: formData.recurringPattern,
        endDate: formData.endDate || undefined,
      };

      await sessionAPI.createSession(requestData);
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

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tuhura-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/sessions')}
            className="text-tuhura-blue hover:text-tuhura-darkBlue mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sessions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Session</h1>
          <p className="mt-2 text-gray-600">
            Set up a new session with term details, location, and assigned staff.
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                Session created successfully! Redirecting...
              </div>
            )}

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            {/* Term and Year */}
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
                  className={`input-field mt-1 ${errors.term ? 'input-error' : ''}`}
                >
                  <option value="">Select a term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.name}>
                      {term.name} {term.year}
                    </option>
                  ))}
                </select>
                {errors.term && <p className="error-message">{errors.term}</p>}
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="2020"
                  max="2100"
                  value={formData.year}
                  onChange={handleChange}
                  className={`input-field mt-1 ${errors.year ? 'input-error' : ''}`}
                />
                {errors.year && <p className="error-message">{errors.year}</p>}
              </div>
            </div>

            {/* Start Date/Time and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDateTime" className="block text-sm font-medium text-gray-700">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDateTime"
                  name="startDateTime"
                  type="datetime-local"
                  value={formData.startDateTime}
                  onChange={handleChange}
                  className={`input-field mt-1 ${errors.startDateTime ? 'input-error' : ''}`}
                />
                {errors.startDateTime && <p className="error-message">{errors.startDateTime}</p>}
              </div>

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
                  placeholder="e.g., Main Hall, Room 101"
                  className={`input-field mt-1 ${errors.location ? 'input-error' : ''}`}
                />
                {errors.location && <p className="error-message">{errors.location}</p>}
              </div>
            </div>

            {/* Capacity and Age Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  className={`input-field mt-1 ${errors.capacity ? 'input-error' : ''}`}
                />
                {errors.capacity && <p className="error-message">{errors.capacity}</p>}
              </div>

              <div>
                <label htmlFor="minAge" className="block text-sm font-medium text-gray-700">
                  Min Age <span className="text-red-500">*</span>
                </label>
                <input
                  id="minAge"
                  name="minAge"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minAge}
                  onChange={handleChange}
                  className={`input-field mt-1 ${errors.minAge ? 'input-error' : ''}`}
                />
                {errors.minAge && <p className="error-message">{errors.minAge}</p>}
              </div>

              <div>
                <label htmlFor="maxAge" className="block text-sm font-medium text-gray-700">
                  Max Age <span className="text-red-500">*</span>
                </label>
                <input
                  id="maxAge"
                  name="maxAge"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.maxAge}
                  onChange={handleChange}
                  className={`input-field mt-1 ${errors.maxAge ? 'input-error' : ''}`}
                />
                {errors.maxAge && <p className="error-message">{errors.maxAge}</p>}
              </div>
            </div>

            {/* Recurring Pattern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="recurringPattern" className="block text-sm font-medium text-gray-700">
                  Recurring Pattern
                </label>
                <select
                  id="recurringPattern"
                  name="recurringPattern"
                  value={formData.recurringPattern}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  <option value="none">None (Single session)</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                </select>
              </div>

              {formData.recurringPattern !== 'none' && (
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
                    className={`input-field mt-1 ${errors.endDate ? 'input-error' : ''}`}
                  />
                  {errors.endDate && <p className="error-message">{errors.endDate}</p>}
                </div>
              )}
            </div>

            {/* Assigned Staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assigned Staff <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {staff.length === 0 ? (
                  <p className="text-gray-500 text-sm">No staff members available</p>
                ) : (
                  <div className="space-y-2">
                    {staff.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(member.id)}
                          onChange={() => handleStaffToggle(member.id)}
                          className="h-4 w-4 text-tuhura-blue focus:ring-tuhura-blue border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email} • {member.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {errors.assignedStaff && <p className="error-message mt-2">{errors.assignedStaff}</p>}
              <p className="text-sm text-gray-500 mt-2">
                Selected: {selectedStaff.length} staff member{selectedStaff.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/admin/sessions')}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || success}
                className="btn-primary"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Session...
                  </span>
                ) : (
                  'Create Session'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📅 About Recurring Sessions
          </h3>
          <p className="text-sm text-blue-700">
            When you select a recurring pattern (Weekly or Bi-weekly), the system will automatically generate 
            an RRULE (Recurrence Rule) based on your start date and end date. This will create multiple session 
            instances according to the schedule.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;

import React, { useState, useEffect } from 'react';
import { waitlistAPI } from '../services/waitlistAPI';
import { sessionAPI } from '../services/sessionAPI';
import type { StudentSignupFormData } from '../types/waitlist';
import type { Session } from '../types/session';

const SCHOOL_YEARS = [
  'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9',
  'Year 10', 'Year 11', 'Year 12', 'Year 13', 'Other'
];

const EXPERIENCE_OPTIONS = [
  'None',
  'Scratch',
  'Python',
  'Robotics',
  'Web Development',
  'Electronics',
  'Game Development'
];

const HEARD_FROM_OPTIONS = [
  'Newsletter', 'School', 'Poster', 'Instagram', 'Facebook',
  'Word of mouth', 'Internet Search', 'Returning', 'Other'
];

const StudentSignup: React.FC = () => {
  const [formData, setFormData] = useState<StudentSignupFormData>({
    email: '',
    firstName: '',
    familyName: '',
    sessionId: 0,
    schoolYear: '',
    schoolYearOther: '',
    experience: [],
    needsDevice: false,
    medicalInfo: '',
    parentName: '',
    parentPhone: '',
    consentShareDetails: false,
    consentPhotos: false,
    heardFrom: '',
    heardFromOther: '',
    newsletterSubscribe: true,
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await sessionAPI.getSessions();
        setSessions(data);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    };
    loadSessions();
  }, []);

  // Load Raisely embed script when success page is shown
  useEffect(() => {
    if (submitSuccess) {
      const existingScript = document.querySelector('script[src="https://cdn.raisely.com/v3/public/embed.js"]');
      
      if (!existingScript) {
        // Add DNS prefetch and preconnect for faster loading
        const prefetch = document.createElement('link');
        prefetch.rel = 'dns-prefetch';
        prefetch.href = 'https://cdn.raisely.com';
        document.head.appendChild(prefetch);

        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://cdn.raisely.com';
        document.head.appendChild(preconnect);

        const script = document.createElement('script');
        script.src = 'https://cdn.raisely.com/v3/public/embed.js';
        script.async = true;
        script.onload = () => {
          // Give the widget a moment to initialize
          setTimeout(() => setWidgetReady(true), 500);
        };
        document.head.appendChild(script); // Use head for faster parsing
        
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
          if (document.head.contains(prefetch)) {
            document.head.removeChild(prefetch);
          }
          if (document.head.contains(preconnect)) {
            document.head.removeChild(preconnect);
          }
        };
      } else {
        // Script already loaded
        setWidgetReady(true);
      }
    }
  }, [submitSuccess]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.familyName) newErrors.familyName = 'Family name is required';
    if (!formData.sessionId) newErrors.sessionId = 'Please select a session';
    if (!formData.schoolYear) newErrors.schoolYear = 'School year is required';
    if (formData.schoolYear === 'Other' && !formData.schoolYearOther) {
      newErrors.schoolYearOther = 'Please specify school year';
    }
    if (!formData.parentName) newErrors.parentName = 'Parent/Guardian name is required';
    if (!formData.parentPhone) newErrors.parentPhone = 'Contact phone is required';
    if (formData.needsDevice === null) newErrors.needsDevice = 'Please select if you need a device';
    if (!formData.heardFrom) newErrors.heardFrom = 'Please select how you heard about us';
    if (formData.heardFrom === 'Other' && !formData.heardFromOther) {
      newErrors.heardFromOther = 'Please specify';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleExperienceChange = (exp: string) => {
    setFormData(prev => {
      const experience = prev.experience.includes(exp)
        ? prev.experience.filter(e => e !== exp)
        : [...prev.experience, exp];
      return { ...prev, experience };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      await waitlistAPI.submitSignup(formData);
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to submit signup' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Signup Successful!</h2>
              <p className="text-lg text-gray-600 mb-6">
                Thank you for signing up! You've been added to the waitlist.
                We'll be in touch soon with more information.
              </p>
            </div>

            {/* Donation Section */}
            <div className="border-t pt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Support Tuhura Tech
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                If you'd like to support our mission, you can make a donation below. This is completely optional.
              </p>
              
              {/* Raisely Donation Widget - Using JS embed for better integration */}
              <div className="w-full overflow-auto rounded-lg shadow-sm relative" style={{ minHeight: '700px' }}>
                {!widgetReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6AA469' }}></div>
                      <p className="text-gray-600 mt-4">Loading donation form...</p>
                    </div>
                  </div>
                )}
                <div
                  className="raisely-donate"
                  data-campaign-path="tuhura-tech"
                  data-profile=""
                  data-width="100%"
                  data-height="700"
                >
                </div>
              </div>
            </div>

            {/* Submit Another Response Button */}
            <div className="text-center mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setWidgetReady(false); // Reset widget state
                  setFormData({
                    email: '', firstName: '', familyName: '', sessionId: 0,
                    schoolYear: '', schoolYearOther: '', experience: [],
                    needsDevice: false, medicalInfo: '', parentName: '',
                    parentPhone: '', consentShareDetails: false,
                    consentPhotos: false, heardFrom: '', heardFromOther: '',
                    newsletterSubscribe: true,
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-3 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#6AA469' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4A8449'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6AA469'}
              >
                Submit Another Signup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#6AA469' }}>
            Waitlist Signup
          </h1>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-3">
              Our sessions are free of charge with no associated cost and targeted at school years 5 to 13. 
              A koha is recommended but not required{' '}
              <a 
                href="https://givealittle.co.nz/org/tuhura-tech" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
                style={{ color: '#6AA469' }}
              >
                https://givealittle.co.nz/org/tuhura-tech
              </a>
            </p>
            <p className="text-gray-700">
              If you have any questions please contact us at{' '}
              <a 
                href="mailto:contact@tuhuratech.org.nz"
                className="underline"
                style={{ color: '#6AA469' }}
              >
                contact@tuhuratech.org.nz
              </a>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Rangatahi Details */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rangatahi (youth) details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Family Name *
                </label>
                <input
                  type="text"
                  name="familyName"
                  value={formData.familyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                {errors.familyName && <p className="mt-1 text-sm text-red-600">{errors.familyName}</p>}
              </div>
            </div>

            {/* Session Select */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Session Select *
              </label>
              <select
                name="sessionId"
                value={formData.sessionId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={loadingSessions}
              >
                <option value="">Select a session</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.title} - {session.dayOfWeek} {session.startTime} ({session.termNames?.join(', ')})
                  </option>
                ))}
              </select>
              {errors.sessionId && <p className="mt-1 text-sm text-red-600">{errors.sessionId}</p>}
            </div>

            {/* School Year */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                School Year *
              </label>
              <select
                name="schoolYear"
                value={formData.schoolYear}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select school year</option>
                {SCHOOL_YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.schoolYear && <p className="mt-1 text-sm text-red-600">{errors.schoolYear}</p>}
            </div>

            {formData.schoolYear === 'Other' && (
              <div className="mt-4">
                <input
                  type="text"
                  name="schoolYearOther"
                  placeholder="Please specify"
                  value={formData.schoolYearOther}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.schoolYearOther && <p className="mt-1 text-sm text-red-600">{errors.schoolYearOther}</p>}
              </div>
            )}

            {/* Experience */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What experience do you have?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EXPERIENCE_OPTIONS.map(exp => (
                  <label key={exp} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.experience.includes(exp)}
                      onChange={() => handleExperienceChange(exp)}
                      className="w-5 h-5 border-gray-300 rounded"
                      style={{ accentColor: '#6AA469' }}
                    />
                    <span className="text-sm text-gray-700">{exp}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Device Loan */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Do you wish to borrow a device? *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Suitable devices are chromebooks or laptops. A tablet/iPad or phone is not suitable. Loan devices are available at no cost.
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="needsDevice"
                    value="true"
                    checked={formData.needsDevice === true}
                    onChange={() => setFormData(prev => ({ ...prev, needsDevice: true }))}
                    className="w-5 h-5 border-gray-300"
                    style={{ accentColor: '#6AA469' }}
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="needsDevice"
                    value="false"
                    checked={formData.needsDevice === false}
                    onChange={() => setFormData(prev => ({ ...prev, needsDevice: false }))}
                    className="w-5 h-5 border-gray-300"
                    style={{ accentColor: '#6AA469' }}
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
              {errors.needsDevice && <p className="mt-1 text-sm text-red-600">{errors.needsDevice}</p>}
            </div>

            {/* Medical Info */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Is there any medical information or other details we should be aware of?
              </label>
              <textarea
                name="medicalInfo"
                value={formData.medicalInfo}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Parent/Guardian Details */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Parent/Guardian Details</h2>
            <p className="text-sm text-gray-600 mb-6">
              These details are collected for emergencies or other times where you need to be contacted.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                {errors.parentName && <p className="mt-1 text-sm text-red-600">{errors.parentName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact phone *
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                {errors.parentPhone && <p className="mt-1 text-sm text-red-600">{errors.parentPhone}</p>}
              </div>
            </div>
          </div>

          {/* Consents */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Consents</h2>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#E6F7FF' }}>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consentShareDetails"
                    checked={formData.consentShareDetails}
                    onChange={handleChange}
                    className="w-5 h-5 border-gray-300 rounded mt-1"
                    style={{ accentColor: '#6AA469' }}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">
                      Do you consent to your sign-up details being shared with the location?
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Only basic emergency details will be shared.
                    </p>
                  </div>
                </label>
                {errors.consentShareDetails && <p className="mt-2 text-sm text-red-600">{errors.consentShareDetails}</p>}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consentPhotos"
                    checked={formData.consentPhotos}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">
                      Do you consent to photos being taken of your child and shared on social media?
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Marketing */}
          <div className="border-t pt-6">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How did you hear about us?
              </label>
              <select
                name="heardFrom"
                value={formData.heardFrom}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select an option</option>
                {HEARD_FROM_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.heardFrom && <p className="mt-1 text-sm text-red-600">{errors.heardFrom}</p>}
            </div>

            {formData.heardFrom === 'Other' && (
              <div className="mb-6">
                <input
                  type="text"
                  name="heardFromOther"
                  placeholder="Please specify"
                  value={formData.heardFromOther}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.heardFromOther && <p className="mt-1 text-sm text-red-600">{errors.heardFromOther}</p>}
              </div>
            )}

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Would you like to subscribe to our newsletter to get updates?
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="newsletterSubscribe"
                    value="true"
                    checked={formData.newsletterSubscribe === true}
                    onChange={() => setFormData(prev => ({ ...prev, newsletterSubscribe: true }))}
                    className="w-5 h-5 border-gray-300"
                    style={{ accentColor: '#6AA469' }}
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="newsletterSubscribe"
                    value="false"
                    checked={formData.newsletterSubscribe === false}
                    onChange={() => setFormData(prev => ({ ...prev, newsletterSubscribe: false }))}
                    className="w-5 h-5 border-gray-300"
                    style={{ accentColor: '#6AA469' }}
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
              {errors.newsletterSubscribe && <p className="mt-1 text-sm text-red-600">{errors.newsletterSubscribe}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-4 rounded-lg font-bold text-lg text-white focus:outline-none focus:ring-4 transform transition-all duration-200 shadow-lg"
              style={{ 
                backgroundColor: isSubmitting ? '#6C757D' : '#6AA469',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#4A8449')}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#6AA469')}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Signup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSignup;

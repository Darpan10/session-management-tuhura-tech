import React, { useState, useEffect } from 'react';
import { sessionAPI } from '../../services/sessionAPI';
import type { StaffMember } from '../../types/session';
import Sidebar from '../../components/Sidebar';
import Skeleton from '../../components/Skeleton';
import { Users, Mail, Search, RefreshCw } from 'lucide-react';

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    // Filter staff based on search term
    if (searchTerm.trim() === '') {
      setFilteredStaff(staff);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredStaff(
        staff.filter(
          (member) =>
            member.userName.toLowerCase().includes(term) ||
            member.email.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, staff]);

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await sessionAPI.getStaff();
      setStaff(data);
      setFilteredStaff(data);
    } catch (err) {
      setError('Failed to load staff members');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <img src="/logo.svg" alt="Tuhura Tech" className="h-10 w-10" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Staff & Mentors</h1>
                  <p className="text-sm text-gray-600 mt-1">View all staff members and mentors</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Refresh */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A8E8] focus:border-transparent"
              />
            </div>
            <button
              onClick={loadStaff}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2.5 bg-[#00A8E8] text-white rounded-lg hover:bg-[#0077B6] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-[#6AA469]/10 rounded-lg">
                <Users className="w-8 h-8 text-[#6AA469]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Staff Members</p>
                <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
              </div>
            </div>
          </div>

          {/* Staff List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A8E8]"></div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="bg-white rounded-lg shadow text-center py-12 px-6">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {searchTerm ? 'No matching staff found' : 'No staff members yet'}
              </h3>
              <p className="mt-1 text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search term'
                  : 'Staff members will appear here once they register'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map((member, index) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#6AA469]/10 rounded-full flex items-center justify-center">
                              <span className="text-[#6AA469] font-semibold text-sm">
                                {member.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.userName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <a
                              href={`mailto:${member.email}`}
                              className="hover:text-[#00A8E8] transition-colors"
                            >
                              {member.email}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            #{member.id}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StaffManagement;

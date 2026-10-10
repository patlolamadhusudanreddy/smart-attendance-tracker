import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Edit, BookOpen, AlertCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import NotificationToast from '../../components/common/NotificationToast';
import api from '../../services/api';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Teacher@123',
    employeeId: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    qualification: 'M.Tech in Computer Science',
    phone: '',
    assignedSubjects: [],
  });

  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, [page, department]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8, search: search || undefined, department: department || undefined };
      const res = await api.get('/teachers', { params });
      if (res.data.success) {
        setTeachers(res.data.data);
        setTotalPages(res.data.meta.pages || 1);
        setTotalTeachers(res.data.meta.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      if (res.data.success) {
        setSubjectsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTeachers();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/teachers', formData);
      if (res.data.success) {
        setToast({ message: 'Teacher created successfully!', type: 'success' });
        setIsAddOpen(false);
        setFormData({
          name: '',
          email: '',
          password: 'Teacher@123',
          employeeId: '',
          department: 'Computer Science',
          designation: 'Assistant Professor',
          qualification: 'M.Tech in Computer Science',
          phone: '',
          assignedSubjects: [],
        });
        fetchTeachers();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error creating teacher', type: 'error' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/teachers/${selectedTeacher._id}`, formData);
      if (res.data.success) {
        setToast({ message: 'Teacher profile updated successfully!', type: 'success' });
        setIsEditOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error updating teacher', type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await api.delete(`/teachers/${selectedTeacher._id}`);
      if (res.data.success) {
        setToast({ message: 'Teacher removed successfully!', type: 'success' });
        setIsDeleteOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error deleting teacher', type: 'error' });
    }
  };

  const openEditModal = (t) => {
    setSelectedTeacher(t);
    setFormData({
      name: t.user?.name || '',
      email: t.user?.email || '',
      employeeId: t.employeeId,
      department: t.department,
      designation: t.designation,
      qualification: t.qualification,
      phone: t.user?.phone || '',
      assignedSubjects: t.assignedSubjects?.map((s) => s._id) || [],
    });
    setIsEditOpen(true);
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData((prev) => {
      const exists = prev.assignedSubjects.includes(subjectId);
      return {
        ...prev,
        assignedSubjects: exists
          ? prev.assignedSubjects.filter((id) => id !== subjectId)
          : [...prev.assignedSubjects, subjectId],
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Manage Faculty & Teachers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Faculty directory, designations, and curriculum subject allocations
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" /> Add Faculty Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by faculty name or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition"
          >
            Search
          </button>
        </form>

        <select
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Electronics & Communication">Electronics & Communication</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <Loader text="Loading faculty records..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">EMP ID</th>
                    <th className="py-3 px-4">FACULTY NAME</th>
                    <th className="py-3 px-4">DEPARTMENT</th>
                    <th className="py-3 px-4">DESIGNATION</th>
                    <th className="py-3 px-4">ASSIGNED SUBJECTS</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400">
                        No faculty records found.
                      </td>
                    </tr>
                  ) : (
                    teachers.map((teacher) => (
                      <tr
                        key={teacher._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {teacher.employeeId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                teacher.user?.avatar ||
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'
                              }
                              alt={teacher.user?.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {teacher.user?.name || 'Faculty Member'}
                              </p>
                              <p className="text-[10px] text-slate-400">{teacher.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {teacher.department}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-medium">{teacher.designation}</span>
                          <span className="block text-[10px] text-slate-400">
                            {teacher.qualification}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(!teacher.assignedSubjects || teacher.assignedSubjects.length === 0) ? (
                              <span className="text-[10px] text-slate-400 italic">None assigned</span>
                            ) : (
                              teacher.assignedSubjects.map((sub) => (
                                <span
                                  key={sub._id}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                >
                                  {sub.code}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Edit Faculty"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Delete Faculty"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pages={totalPages}
              total={totalTeachers}
              limit={8}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Faculty Member">
        <form onSubmit={handleAddSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Faculty Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Prof. Rajesh Sharma"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@college.edu"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="EMP-T105"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assign Curriculum Subjects
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
              {subjectsList.map((sub) => (
                <label
                  key={sub._id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedSubjects.includes(sub._id)}
                    onChange={() => handleSubjectToggle(sub._id)}
                    className="rounded text-indigo-600"
                  />
                  <span className="truncate">{sub.name} ({sub.code})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Faculty
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Faculty Member">
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Subjects
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
              {subjectsList.map((sub) => (
                <label
                  key={sub._id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedSubjects.includes(sub._id)}
                    onChange={() => handleSubjectToggle(sub._id)}
                    className="rounded text-indigo-600"
                  />
                  <span className="truncate">{sub.name} ({sub.code})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Faculty Member">
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Are you sure you want to delete{' '}
            <strong className="text-slate-900 dark:text-white">
              {selectedTeacher?.user?.name} ({selectedTeacher?.employeeId})
            </strong>
            ? Their user account and subject assignments will be removed.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default ManageTeachers;

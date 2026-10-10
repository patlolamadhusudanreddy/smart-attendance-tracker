import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Upload,
  FileSpreadsheet,
  Camera,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import NotificationToast from '../../components/common/NotificationToast';
import api from '../../services/api';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    rollNumber: '',
    department: 'Computer Science',
    semester: 1,
    section: 'A',
    batch: '2023-2027',
    phone: '',
  });

  // Bulk Excel File
  const [excelFile, setExcelFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchStudents();
  }, [page, department, semester]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search: search || undefined,
        department: department || undefined,
        semester: semester || undefined,
      };
      const res = await api.get('/students', { params });
      if (res.data.success) {
        setStudents(res.data.data);
        setTotalPages(res.data.meta.pages || 1);
        setTotalStudents(res.data.meta.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', formData);
      if (res.data.success) {
        setToast({ message: 'Student created successfully!', type: 'success' });
        setIsAddOpen(false);
        setFormData({
          name: '',
          email: '',
          password: 'Password123!',
          rollNumber: '',
          department: 'Computer Science',
          semester: 1,
          section: 'A',
          batch: '2023-2027',
          phone: '',
        });
        fetchStudents();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error creating student', type: 'error' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/students/${selectedStudent._id}`, formData);
      if (res.data.success) {
        setToast({ message: 'Student profile updated successfully!', type: 'success' });
        setIsEditOpen(false);
        fetchStudents();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error updating student', type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await api.delete(`/students/${selectedStudent._id}`);
      if (res.data.success) {
        setToast({ message: 'Student deleted successfully!', type: 'success' });
        setIsDeleteOpen(false);
        fetchStudents();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error deleting student', type: 'error' });
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) return;

    const data = new FormData();
    data.append('file', excelFile);

    try {
      setLoading(true);
      const res = await api.post('/students/bulk-upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setToast({
          message: `Bulk Import Complete: ${res.data.data.insertedCount} inserted, ${res.data.data.skippedCount} skipped.`,
          type: 'success',
        });
        setIsUploadOpen(false);
        setExcelFile(null);
        fetchStudents();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to upload spreadsheet', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (studentId, file) => {
    const data = new FormData();
    data.append('photo', file);

    try {
      const res = await api.post(`/students/${studentId}/photo`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setToast({ message: 'Student profile photo updated!', type: 'success' });
        fetchStudents();
      }
    } catch (err) {
      setToast({ message: 'Failed to upload photo', type: 'error' });
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.user?.name || '',
      email: student.user?.email || '',
      rollNumber: student.rollNumber,
      department: student.department,
      semester: student.semester,
      section: student.section,
      batch: student.batch,
      phone: student.user?.phone || '',
    });
    setIsEditOpen(true);
  };

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" /> Manage Students
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Directory of enrolled students with credentials and profile records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Excel Upload
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, roll number..."
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <Loader text="Loading student records..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">ROLL NO</th>
                    <th className="py-3 px-4">STUDENT</th>
                    <th className="py-3 px-4">DEPARTMENT</th>
                    <th className="py-3 px-4">SEM / SEC</th>
                    <th className="py-3 px-4">BATCH</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {student.rollNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative group">
                              <img
                                src={
                                  student.user?.avatar ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
                                }
                                alt={student.user?.name}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                              />
                              <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white">
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handlePhotoUpload(student._id, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {student.user?.name || 'Unnamed Student'}
                              </p>
                              <p className="text-[10px] text-slate-400">{student.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {student.department}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Sem {student.semester} - {student.section}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {student.batch}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(student)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Edit Student"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Delete Student"
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
              total={totalStudents}
              limit={8}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Student">
        <form onSubmit={handleAddSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@college.edu"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="STD-1011"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Batch
              </label>
              <input
                type="text"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="2023-2027"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
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
              Create Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Profile">
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
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
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
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Are you sure you want to delete student{' '}
            <strong className="text-slate-900 dark:text-white">
              {selectedStudent?.user?.name} ({selectedStudent?.rollNumber})
            </strong>
            ? This action will permanently remove their profile and all associated attendance records.
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

      {/* Bulk Excel Upload Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Bulk Upload Students">
        <form onSubmit={handleExcelUpload} className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <FileSpreadsheet className="w-4 h-4" /> Spreadsheet Format Guidelines:
            </p>
            <p>
              Include columns: <code className="font-bold">Name</code>,{' '}
              <code className="font-bold">Email</code>,{' '}
              <code className="font-bold">RollNumber</code>,{' '}
              <code className="font-bold">Department</code>,{' '}
              <code className="font-bold">Semester</code>,{' '}
              <code className="font-bold">Section</code>,{' '}
              <code className="font-bold">Batch</code>.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {excelFile && (
              <p className="text-xs font-semibold text-emerald-600 mt-2">
                Selected: {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!excelFile}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              Import Spreadsheet
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default ManageStudents;

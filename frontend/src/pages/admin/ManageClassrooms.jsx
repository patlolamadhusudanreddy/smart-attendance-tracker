import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Navigation,
  ShieldCheck,
  Building,
} from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import NotificationToast from '../../components/common/NotificationToast';

const ManageClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [detectingGps, setDetectingGps] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    roomNumber: '',
    building: 'Main Academic Block',
    latitude: '',
    longitude: '',
    radiusMeters: 30,
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/classrooms');
      if (res.data.success) {
        setClassrooms(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load classrooms', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClassroom(null);
    setFormData({
      name: '',
      roomNumber: '',
      building: 'Main Academic Block',
      latitude: '',
      longitude: '',
      radiusMeters: 30,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingClassroom(room);
    setFormData({
      name: room.name,
      roomNumber: room.roomNumber,
      building: room.building || 'Main Academic Block',
      latitude: room.latitude,
      longitude: room.longitude,
      radiusMeters: room.radiusMeters || 30,
    });
    setIsModalOpen(true);
  };

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToast({ message: 'Geolocation is not supported by your browser', type: 'error' });
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setDetectingGps(false);
        setToast({
          message: `GPS Coordinates calibrated! (Accuracy: ±${Math.round(position.coords.accuracy)}m)`,
          type: 'success',
        });
      },
      (error) => {
        setDetectingGps(false);
        setToast({
          message: `GPS error: ${error.message}. Please allow location permissions.`,
          type: 'error',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.roomNumber || !formData.latitude || !formData.longitude) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingClassroom) {
        const res = await api.put(`/classrooms/${editingClassroom._id}`, formData);
        if (res.data.success) {
          setToast({ message: 'Classroom geofence updated successfully!', type: 'success' });
        }
      } else {
        const res = await api.post('/classrooms', formData);
        if (res.data.success) {
          setToast({ message: 'New classroom and geofence created successfully!', type: 'success' });
        }
      }
      setIsModalOpen(false);
      fetchClassrooms();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to save classroom geofence',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete classroom ${roomNumber}?`)) return;
    try {
      const res = await api.delete(`/classrooms/${id}`);
      if (res.data.success) {
        setToast({ message: 'Classroom deleted successfully', type: 'success' });
        fetchClassrooms();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete classroom', type: 'error' });
    }
  };

  const filtered = classrooms.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.building?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-600" /> Classroom Geofencing Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure campus rooms with GPS coordinates and allowed distance radiuses (e.g. 30 meters) to prevent remote attendance fraud.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Geofenced Room
        </button>
      </div>

      {/* Geofence Explainer Card */}
      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Anti-Spoofing Geofence Protection:</span> During an attendance session, students must scan the dynamic QR code while physically standing inside the designated room. The system calculates distance using the Haversine formula and rejects any submission outside the configured radius.
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by room number, name, or building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Total Rooms: {classrooms.length}
        </div>
      </div>

      {/* Classrooms Table */}
      {loading ? (
        <Loader text="Loading classroom geofence data..." />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700/60">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No classrooms found</p>
          <p className="text-xs text-slate-400 mt-1">Add your campus lecture halls and labs to enforce GPS boundaries.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                <tr>
                  <th className="py-3.5 px-4">Room & Name</th>
                  <th className="py-3.5 px-4">Building</th>
                  <th className="py-3.5 px-4">GPS Coordinates (Lat, Lon)</th>
                  <th className="py-3.5 px-4">Allowed Radius</th>
                  <th className="py-3.5 px-4">Geofence Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px]">
                          {c.roomNumber}
                        </span>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">
                      {c.building}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {c.latitude.toFixed(6)}, {c.longitude.toFixed(6)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Within {c.radiusMeters || 30} meters
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          title="Edit Coordinates"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.roomNumber)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition"
                          title="Delete Classroom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClassroom ? 'Edit Classroom Geofence' : 'Add New Geofenced Classroom'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Classroom / Hall Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Science Lecture Hall 1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. LH-101"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Building / Block
              </label>
              <input
                type="text"
                placeholder="e.g. Academic Block A"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* GPS Coordinates Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> GPS Geofence Coordinates
              </span>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={detectingGps}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 transition flex items-center gap-1"
              >
                <Navigation className={`w-3 h-3 ${detectingGps ? 'animate-spin' : ''}`} />
                {detectingGps ? 'Detecting...' : 'Use My Current Location'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 17.385044"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 78.486671"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Allowed Geofence Radius
                </label>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {formData.radiusMeters} meters
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={formData.radiusMeters}
                onChange={(e) => setFormData({ ...formData, radiusMeters: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Standard classroom: 25-35m. Large auditorium or lab: 40-60m.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition"
            >
              {submitting ? 'Saving...' : editingClassroom ? 'Update Room' : 'Save Room'}
            </button>
          </div>
        </form>
      </Modal>

      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default ManageClassrooms;

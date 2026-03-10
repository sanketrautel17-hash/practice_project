import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageExams = () => {
    const [exams, setExams] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        fees: { general: '', obc: '', sc: '', st: '' }
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            // For mockup, we can ignore auth tokens
            const res = await fetch('/api/admin/exams');
            const data = await res.json();
            setExams(data);
        } catch (error) {
            console.error("Failed to fetch exams", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name') {
            setFormData({ ...formData, name: value });
        } else {
            setFormData({
                ...formData,
                fees: { ...formData.fees, [name]: Number(value) }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingExam ? 'PUT' : 'POST';
            const url = editingExam ? `/api/admin/exams/${editingExam.id}` : '/api/admin/exams';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(`Exam ${editingExam ? 'updated' : 'added'} successfully!`);
                closeModal();
                fetchExams();
            } else {
                toast.error("Failed to save exam");
            }
        } catch (error) {
            console.error("Failed to save exam", error);
            toast.error("An error occurred while saving the exam");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this exam?')) {
            try {
                const response = await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    toast.success("Exam deleted successfully");
                    fetchExams();
                } else {
                    toast.error("Failed to delete exam");
                }
            } catch (error) {
                console.error("Failed to delete", error);
                toast.error("An error occurred while deleting the exam");
            }
        }
    };

    const openModal = (exam = null) => {
        if (exam) {
            setEditingExam(exam);
            setFormData({ name: exam.name, fees: { ...exam.fees } });
        } else {
            setEditingExam(null);
            setFormData({ name: '', fees: { general: '', obc: '', sc: '', st: '' } });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExam(null);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Exams</h2>
                    <p className="text-gray-500 text-sm mt-1">Configure available exams and category-wise fee structures.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Exam
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                            <th className="py-4 px-4 font-semibold text-sm">Exam Name</th>
                            <th className="py-4 px-4 font-semibold text-sm">General (₹)</th>
                            <th className="py-4 px-4 font-semibold text-sm">OBC (₹)</th>
                            <th className="py-4 px-4 font-semibold text-sm">SC (₹)</th>
                            <th className="py-4 px-4 font-semibold text-sm">ST (₹)</th>
                            <th className="py-4 px-4 font-semibold text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map((exam) => (
                            <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-4 font-medium text-gray-900">{exam.name}</td>
                                <td className="py-4 px-4 text-gray-600 font-mono">₹{exam.fees.general}</td>
                                <td className="py-4 px-4 text-gray-600 font-mono">₹{exam.fees.obc}</td>
                                <td className="py-4 px-4 text-gray-600 font-mono">₹{exam.fees.sc}</td>
                                <td className="py-4 px-4 text-gray-600 font-mono">₹{exam.fees.st}</td>
                                <td className="py-4 px-4 flex justify-end gap-2">
                                    <button onClick={() => openModal(exam)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(exam.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {exams.length === 0 && (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">No exams configured yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900">{editingExam ? 'Edit Exam' : 'Add New Exam'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
                                    placeholder="e.g. NEET UG 2026"
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Fee Structure (in ₹)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">General</label>
                                        <input type="number" name="general" value={formData.fees.general} onChange={handleChange} required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">OBC</label>
                                        <input type="number" name="obc" value={formData.fees.obc} onChange={handleChange} required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">SC</label>
                                        <input type="number" name="sc" value={formData.fees.sc} onChange={handleChange} required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">ST</label>
                                        <input type="number" name="st" value={formData.fees.st} onChange={handleChange} required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full bg-dark-900 text-white font-medium py-3 rounded-xl hover:bg-dark-800 transition-colors shadow-md">
                                    {editingExam ? 'Save Changes' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageExams;

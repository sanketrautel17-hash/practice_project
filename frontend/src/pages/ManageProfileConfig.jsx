import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageProfileConfig = () => {
    const [documents, setDocuments] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDocText, setNewDocText] = useState('');
    const [newFieldText, setNewFieldText] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/profile-config');
            const data = await res.json();
            setDocuments(data.requiredDocuments || []);
            setCustomFields(data.customFields || []);
        } catch (error) {
            console.error("Failed to load profile config", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        if (!newDocText.trim()) return;

        const newDoc = {
            id: Math.random().toString(36).substr(2, 9),
            name: newDocText.trim()
        };

        setDocuments([...documents, newDoc]);
        setNewDocText('');
    };

    const handleDelete = (id) => {
        setDocuments(documents.filter(doc => doc.id !== id));
    };

    const handleAddField = () => {
        if (!newFieldText.trim()) return;

        const newField = {
            id: 'field_' + Math.random().toString(36).substr(2, 9),
            name: newFieldText.trim()
        };

        setCustomFields([...customFields, newField]);
        setNewFieldText('');
    };

    const handleDeleteField = (id) => {
        setCustomFields(customFields.filter(f => f.id !== id));
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/admin/profile-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requiredDocuments: documents, customFields })
            });
            if (res.ok) {
                toast.success("Profile Document Requirements Updated!");
            } else {
                toast.error("Failed to save configuration.");
            }
        } catch (error) {
            console.error("Save error", error);
            toast.error("An error occurred");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Profile Configuration</h2>
                <p className="text-gray-500 text-sm mt-1">Configure the mandatory document requirements that students must upload when creating their master profiles.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="max-w-2xl space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Required Documents Checklist</h3>

                        <ul className="space-y-3 mb-6">
                            {documents.map((doc) => (
                                <li key={doc.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                    <span className="font-medium text-gray-800">{doc.name}</span>
                                    <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDocText}
                                onChange={(e) => setNewDocText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="Add new document requirement (e.g. Domicile Certificate)"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                            <button onClick={handleAdd} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </div>
                    </div>

                    {/* New Section for Custom Personal Details Fields */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Custom Personal Details Fields</h3>
                        <p className="text-sm text-gray-500 mb-4">Add extra text fields (like &apos;Category&apos;, &apos;Caste&apos;, &apos;Parent Occupation&apos;) that the user must fill out in the Master Profile.</p>

                        <ul className="space-y-3 mb-6">
                            {customFields.map((field) => (
                                <li key={field.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                    <span className="font-medium text-gray-800">{field.name}</span>
                                    <button onClick={() => handleDeleteField(field.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newFieldText}
                                onChange={(e) => setNewFieldText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                                placeholder="Add new detail field (e.g. Caste Certificate No)"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                            <button onClick={handleAddField} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Field
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button onClick={handleSave} className="flex items-center gap-2 bg-dark-900 hover:bg-dark-800 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-colors w-full justify-center">
                            <Save className="w-5 h-5" /> Save Configuration
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProfileConfig;

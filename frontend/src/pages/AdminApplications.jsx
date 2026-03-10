import { useState, useEffect } from 'react';
import { Eye, Edit, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminApplications = () => {
    const [applications, setApplications] = useState([]);
    const [config, setConfig] = useState({ customFields: [] });
    const [loading, setLoading] = useState(true);
    const [viewingApp, setViewingApp] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editedDetails, setEditedDetails] = useState({});
    const [editedCustomFields, setEditedCustomFields] = useState({});

    useEffect(() => {
        fetchApplications();
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/profile-config');
            const data = await res.json();
            setConfig(data);
        } catch (error) {
            console.error("Failed to fetch config", error);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/applications');
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/applications/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast.success(`Application marked as "${newStatus}"`);
                fetchApplications();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("An error occurred");
        }
    };

    const handleEditDetailsChange = (e) => {
        setEditedDetails({
            ...editedDetails,
            [e.target.name]: e.target.value
        });
    };

    const handleEditCustomDetailsChange = (fieldId, value) => {
        setEditedCustomFields({
            ...editedCustomFields,
            [fieldId]: value
        });
    };

    const handleSaveDetails = async () => {
        try {
            const res = await fetch(`/api/applications/${viewingApp.id}/details`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personalDetails: editedDetails, customFields: editedCustomFields }),
            });
            if (res.ok) {
                toast.success('Personal details updated successfully');
                const updatedApp = await res.json();
                setViewingApp(updatedApp);
                setEditMode(false);
                fetchApplications();
            } else {
                toast.error('Failed to update details');
            }
        } catch (error) {
            console.error('Failed to update details', error);
            toast.error('An error occurred');
        }
    };

    const statusColors = {
        'Submitted': 'bg-blue-100 text-blue-800',
        'Under Review': 'bg-purple-100 text-purple-800',
        'Payment Requested': 'bg-orange-100 text-orange-800',
        'Payment Done': 'bg-green-100 text-green-800',
        'Application Submitted': 'bg-gray-800 text-white'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Applications</h2>
                <p className="text-gray-500 text-sm mt-1">Review student applications and manage their statuses.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                <th className="py-4 px-4 font-semibold text-sm">Applicant</th>
                                <th className="py-4 px-4 font-semibold text-sm">Exam & Category</th>
                                <th className="py-4 px-4 font-semibold text-sm">Status</th>
                                <th className="py-4 px-4 font-semibold text-sm">Docs</th>
                                <th className="py-4 px-4 font-semibold text-sm w-48 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((app) => (
                                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <p className="font-semibold text-gray-900">{app.personalDetails?.fullName || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{app.personalDetails?.mobile}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="font-medium text-gray-800">{app.examType?.name}</p>
                                        <p className="text-xs uppercase bg-gray-200 text-gray-600 inline-block px-2 py-0.5 rounded mt-1">{app.category}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[app.status] || 'bg-gray-100'}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        {app.documents?.length > 0 ? (
                                            <a href={app.documents[0].s3Url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                <Eye className="w-4 h-4" /> View ({app.documents.length})
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-sm">No Docs</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex flex-col gap-2 items-end">
                                            <button
                                                onClick={() => {
                                                    setViewingApp(app);
                                                    setEditedDetails(app.personalDetails || {});
                                                    setEditedCustomFields(app.customFields || {});
                                                    setEditMode(false);
                                                }}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors w-32 flex justify-center items-center gap-1"
                                            >
                                                <Eye className="w-3 h-3" /> Details
                                            </button>

                                            {app.status === 'Submitted' && (
                                                <button onClick={() => updateStatus(app.id, 'Under Review')} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors w-32">
                                                    Start Review
                                                </button>
                                            )}
                                            {app.status === 'Under Review' && (
                                                <button onClick={() => updateStatus(app.id, 'Payment Requested')} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors w-32">
                                                    Request Payment
                                                </button>
                                            )}
                                            {app.status === 'Payment Done' && (
                                                <button onClick={() => updateStatus(app.id, 'Application Submitted')} className="flex justify-center items-center gap-1 text-xs bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors w-32">
                                                    <CheckCircle className="w-3 h-3" /> Mark Final
                                                </button>
                                            )}
                                            {app.status === 'Application Submitted' && (
                                                <span className="text-green-600 text-xs font-bold flex items-center justify-end gap-1"><CheckCircle className="w-4 h-4" /> Complete</span>
                                            )}
                                            {app.status === 'Payment Requested' && (
                                                <span className="text-gray-400 text-xs italic w-32 text-center">Awaiting Student</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {applications.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">No applications found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Application Detail Modal View */}
            {viewingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: {viewingApp.id}</p>
                            </div>
                            <button onClick={() => setViewingApp(null)} className="text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-8">
                                {/* Personal Details Section */}
                                <section>
                                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                                        <h4 className="text-lg font-semibold text-gray-800">Personal Information</h4>
                                        {editMode ? (
                                            <div className="space-x-2">
                                                <button onClick={() => setEditMode(false)} className="text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
                                                <button onClick={handleSaveDetails} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors">Save</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setEditMode(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                                                <Edit className="w-4 h-4" /> Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Full Name</p>
                                            {editMode ? <input type="text" name="fullName" value={editedDetails.fullName || ''} onChange={handleEditDetailsChange} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none" /> : <p className="text-sm font-medium text-gray-900">{viewingApp.personalDetails?.fullName}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Date of Birth</p>
                                            {editMode ? <input type="date" name="dob" value={editedDetails.dob || ''} onChange={handleEditDetailsChange} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none" /> : <p className="text-sm font-medium text-gray-900">{viewingApp.personalDetails?.dob}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Aadhar Number</p>
                                            {editMode ? <input type="text" name="aadharNumber" value={editedDetails.aadharNumber || ''} onChange={handleEditDetailsChange} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none" /> : <p className="text-sm font-medium text-gray-900">{viewingApp.personalDetails?.aadharNumber}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Mobile Number</p>
                                            {editMode ? <input type="text" name="mobile" value={editedDetails.mobile || ''} onChange={handleEditDetailsChange} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none" /> : <p className="text-sm font-medium text-gray-900">{viewingApp.personalDetails?.mobile}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Father&apos;s Name</p>
                                            {editMode ? <input type="text" name="fatherName" value={editedDetails.fatherName || ''} onChange={handleEditDetailsChange} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none" /> : <p className="text-sm font-medium text-gray-900">{viewingApp.personalDetails?.fatherName}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Mother&apos;s Name</p>
                                            {editMode ? <input type="text" name="motherName" value={editedDetails.motherName || ''} onChange={handleEditDetailsChange} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none" /> : <p className="text-sm font-medium text-gray-900">{viewingApp.personalDetails?.motherName}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Mailing Address</p>
                                            {editMode ? <textarea name="address" rows="2" value={editedDetails.address || ''} onChange={handleEditDetailsChange} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none"></textarea> : <p className="text-sm font-medium text-gray-900">{viewingApp.personalDetails?.address}</p>}
                                        </div>

                                        {/* Dynamic Custom Fields Rendering */}
                                        {config.customFields?.length > 0 && config.customFields.map((field) => (
                                            <div key={field.id} className="col-span-1">
                                                <p className="text-xs text-gray-500 uppercase font-semibold">{field.name}</p>
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={editedCustomFields[field.id] || ''}
                                                        onChange={(e) => handleEditCustomDetailsChange(field.id, e.target.value)}
                                                        className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-900">{viewingApp.customFields?.[field.id] || 'N/A'}</p>
                                                )}
                                            </div>
                                        ))}

                                    </div>
                                </section>

                                {/* Exam Details Section */}
                                <section>
                                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Exam & Payment</h4>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-gray-50 p-4 rounded-xl">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Exam Applies For</p>
                                            <p className="text-sm font-medium text-gray-900">{viewingApp.examType?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Category</p>
                                            <p className="text-sm font-medium uppercase text-gray-900">{viewingApp.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Application Fee</p>
                                            <p className="text-lg font-bold text-green-700">₹{viewingApp.fee}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Current Status</p>
                                            <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${statusColors[viewingApp.status] || 'bg-gray-100'}`}>
                                                {viewingApp.status}
                                            </span>
                                        </div>
                                        {viewingApp.paymentId && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Payment Reference ID</p>
                                                <p className="text-sm font-mono text-gray-900">{viewingApp.paymentId}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Documents Section */}
                                <section>
                                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Uploaded Documents</h4>
                                    {viewingApp.documents?.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {viewingApp.documents.map((doc, idx) => (
                                                <a
                                                    key={idx}
                                                    href={doc.s3Url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                                                >
                                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <Eye className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 truncate w-full" title={doc.fileName}>{doc.fileName}</span>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No documents were uploaded with this application.</p>
                                    )}
                                </section>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApplications;

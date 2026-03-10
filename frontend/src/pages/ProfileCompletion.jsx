import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, ArrowRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileCompletion = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({ requiredDocuments: [], customFields: [] });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/admin/profile-config');
                const data = await res.json();
                setConfig(data);
            } catch (err) {
                console.error("Failed to fetch admin config", err);
            }
        };
        fetchConfig();
    }, []);

    const [formData, setFormData] = useState({
        personalDetails: {
            firstName: user?.profileData?.personalDetails?.firstName || '',
            middleName: user?.profileData?.personalDetails?.middleName || '',
            lastName: user?.profileData?.personalDetails?.lastName || '',
            fatherName: user?.profileData?.personalDetails?.fatherName || '',
            email: user?.profileData?.personalDetails?.email || user?.email || '',
            mobile: user?.profileData?.personalDetails?.mobile || user?.mobile || '',
        },
        customFields: user?.profileData?.customFields || {},
        hasDiploma: user?.profileData?.hasDiploma || false,
    });

    const [files, setFiles] = useState({
        sscMarksheet: null,
        hscMarksheet: null,
        diplomaCertificate: null,
        diplomaMarksheet: null,
        degreeCertificate: null,
        semesterMarksheets: null,
        photograph: null,
        signature: null,
        aadharCard: null,
    });

    const handlePersonalChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            personalDetails: { ...formData.personalDetails, [name]: value }
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFileChange = (name, file) => {
        if (file) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF, JPG, and PNG files are allowed.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB.');
                return;
            }
            setFiles({ ...files, [name]: file });
        }
    };

    const removeFile = (name) => {
        setFiles({ ...files, [name]: null });
    };

    const uploadDocuments = async () => {
        const uploadData = new FormData();
        let hasFiles = false;

        Object.keys(files).forEach(key => {
            if (files[key]) {
                uploadData.append('files', files[key], `${key}_${files[key].name}`);
                hasFiles = true;
            }
        });

        if (!hasFiles) return [];

        const res = await fetch('/api/applications/upload', {
            method: 'POST',
            body: uploadData,
        });

        if (!res.ok) throw new Error('Failed to upload files to Cloudinary');

        const uploadedDocs = await res.json();
        return uploadedDocs;
    };

    const validateStep1 = () => {
        const { firstName, lastName, fatherName, email, mobile } = formData.personalDetails;
        if (!firstName || !lastName || !fatherName || !email || !mobile) {
            toast.error("Please fill all mandatory personal details.");
            return false;
        }

        // Validate dynamically added custom fields
        const customFieldsArr = config.customFields || [];
        for (const field of customFieldsArr) {
            const fieldValue = formData.customFields ? formData.customFields[field.id] : null;
            if (!fieldValue || !fieldValue.trim()) {
                toast.error(`Please fill the mandatory field: ${field.name}`);
                return false;
            }
        }

        return true;
    };

    const validateStep2 = () => {
        if (!files.sscMarksheet || !files.hscMarksheet || !files.degreeCertificate || !files.semesterMarksheets) {
            toast.error("Please upload all mandatory educational documents (SSC, 12th, Degree, Semesters).");
            return false;
        }
        if (formData.hasDiploma && (!files.diplomaCertificate || !files.diplomaMarksheet)) {
            toast.error("Please upload diploma documents as you selected 'Applicable'.");
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!files.photograph || !files.signature || !files.aadharCard) {
            toast.error("Please upload all identity documents.");
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        if (step === 3 && !validateStep3()) return;

        if (step < 3) {
            setStep(step + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const uploadedDocs = await uploadDocuments();

            const profileData = {
                personalDetails: formData.personalDetails,
                customFields: formData.customFields,
                documents: uploadedDocs
            };

            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?._id, profileData })
            });

            if (res.ok) {
                const data = await res.json();
                updateProfile(data.profileData);
                toast.success('Profile created successfully! You can now apply for exams.');
                navigate('/dashboard');
            } else {
                toast.error('Failed to complete profile.');
            }
        } catch (error) {
            console.error("Profile submission failed", error);
            toast.error('An error occurred while saving profile.');
        } finally {
            setLoading(false);
        }
    };

    const renderFileUpload = (name, label, accept = ".pdf,.jpg,.jpeg,.png", mandatory = false) => (
        <div className="flex flex-col items-start p-4 border rounded-xl bg-gray-50 border-gray-200 w-full hover:shadow-sm transition-shadow">
            <label className="text-sm font-semibold text-gray-800 mb-2">
                {label} {mandatory && <span className="text-red-500">*</span>}
            </label>
            {!files[name] ? (
                <div className="w-full relative">
                    <input
                        type="file"
                        accept={accept}
                        onChange={(e) => handleFileChange(name, e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 py-4 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors bg-white">
                        <UploadCloud className="w-6 h-6 text-gray-400" />
                        <span className="text-sm text-gray-500">Click or drag file to upload</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between w-full bg-white p-3 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 truncate">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium truncate">{files[name].name}</span>
                        <span className="text-xs text-gray-400">({(files[name].size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => removeFile(name)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium ml-2 transition-colors"
                    >
                        Change
                    </button>
                </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Max 5MB (PDF/JPG/PNG)</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-primary-50 px-6 py-6 md:px-8 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-6 h-6 text-primary-600" /> Master Profile Setup
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Complete your profile once to apply for multiple exams instantly.</p>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${step >= s ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">1. Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="firstName" value={formData.personalDetails.firstName} onChange={handlePersonalChange} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                                    <input type="text" name="middleName" value={formData.personalDetails.middleName} onChange={handlePersonalChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Surname / Last Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="lastName" value={formData.personalDetails.lastName} onChange={handlePersonalChange} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Father&apos;s Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="fatherName" value={formData.personalDetails.fatherName} onChange={handlePersonalChange} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={formData.personalDetails.email} onChange={handlePersonalChange} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                    <input type="tel" name="mobile" value={formData.personalDetails.mobile} onChange={handlePersonalChange} maxLength="10" required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500" placeholder="10-digit mobile" />
                                </div>
                                {config.customFields?.map(field => (
                                    <div key={field.id} className="col-span-1 border border-primary-100 bg-primary-50/30 p-4 rounded-xl shadow-sm">
                                        <label className="block text-sm font-semibold text-primary-900 mb-1">{field.name} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.customFields[field.id] || ''}
                                            onChange={(e) => setFormData({ ...formData, customFields: { ...formData.customFields, [field.id]: e.target.value } })}
                                            required
                                            className="w-full px-4 py-2 border border-primary-200 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                                            placeholder={`Enter ${field.name}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-fadeIn">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">2. Educational Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderFileUpload('sscMarksheet', 'SSC / 10th Marksheet', '.pdf,.jpg,.jpeg,.png', true)}
                                    {renderFileUpload('hscMarksheet', '12th Marksheet', '.pdf,.jpg,.jpeg,.png', true)}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="hasDiploma"
                                        checked={formData.hasDiploma}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="font-medium text-gray-800">I have Diploma Details (Applicable)</span>
                                </label>

                                {formData.hasDiploma && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-fadeIn">
                                        {renderFileUpload('diplomaCertificate', 'Diploma Certificate', '.pdf,.jpg,.jpeg,.png', true)}
                                        {renderFileUpload('diplomaMarksheet', 'Diploma Marksheet', '.pdf,.jpg,.jpeg,.png', true)}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-md font-semibold text-gray-800 mb-4">Graduation Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderFileUpload('degreeCertificate', 'Degree Certificate', '.pdf,.jpg,.jpeg,.png', true)}
                                    {renderFileUpload('semesterMarksheets', 'Semester Marksheets (All)', '.pdf,.jpg,.jpeg,.png', true)}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">3. Identity Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderFileUpload('photograph', 'Passport Size Photograph', '.jpg,.jpeg,.png', true)}
                                {renderFileUpload('signature', 'Digital Signature', '.jpg,.jpeg,.png', true)}
                                {renderFileUpload('aadharCard', 'Aadhar Card', '.pdf,.jpg,.jpeg,.png', true)}
                            </div>
                        </div>
                    )}

                    <div className="pt-8 mt-4 flex justify-between items-center border-t border-gray-100">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                disabled={loading}
                                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                        ) : <div></div>}

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md group"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving Profile...
                                </>
                            ) : (
                                <>
                                    {step === 3 ? 'Complete Profile' : 'Continue'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfileCompletion;

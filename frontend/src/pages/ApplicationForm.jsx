import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, ArrowRight, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ApplicationForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [calculatedFee, setCalculatedFee] = useState(0);

    const [formData, setFormData] = useState({
        personalDetails: {
            firstName: '',
            middleName: '',
            lastName: '',
            fatherName: '',
            email: user?.email || '',
            mobile: user?.mobile || '',
        },
        examId: '',
        category: 'general',
        hasDiploma: false,
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
        panCard: null,
        drivingLicence: null,
    });

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await fetch('/api/exams');
                const data = await res.json();
                setExams(data);
            } catch (error) {
                console.error("Failed to fetch exams", error);
            }
        };
        fetchExams();
    }, []);

    useEffect(() => {
        if (formData.examId && formData.category) {
            const selectedExam = exams.find(e => e.id === formData.examId);
            if (selectedExam) {
                setCalculatedFee(selectedExam.fees[formData.category] || 0);
            }
        } else {
            setCalculatedFee(0);
        }
    }, [formData.examId, formData.category, exams]);

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
            if (file.size > 5 * 1024 * 1024) { // 5MB
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
            toast.error("Please fill all mandatory fields.");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address.");
            return false;
        }
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            toast.error("Phone number must be exactly 10 digits.");
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
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

    const validateStep4 = () => {
        // Dynamic requirement based on Exam/Category. Mocking basic requirement:
        // Generally everyone needs at least photo, sign, and Aadhar.
        const requiredIds = ['photograph', 'signature', 'aadharCard'];
        for (let req of requiredIds) {
            if (!files[req]) {
                toast.error(`Please upload your ${req.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !formData.examId) {
            toast.error("Please select an exam.");
            return;
        }
        if (step === 3 && !validateStep3()) return;
        if (step === 4 && !validateStep4()) return;

        setStep(step + 1);
        window.scrollTo(0, 0);
    };

    const handleReviewEdit = (editStep) => {
        setStep(editStep);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            const uploadedDocs = await uploadDocuments();

            const submitData = {
                userId: user?._id,
                personalDetails: formData.personalDetails,
                examType: exams.find(e => e.id === formData.examId),
                category: formData.category,
                fee: calculatedFee,
                documents: uploadedDocs
            };

            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            if (res.ok) {
                toast.success('Application submitted successfully!');
                navigate('/dashboard');
            } else {
                toast.error('Failed to submit application.');
            }
        } catch (error) {
            console.error("Submission failed", error);
            toast.error('An error occurred during submission.');
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

    // Dynamic docs logic: Assuming General needs PAN, others don't, just as an example. 
    // Or certain exams need Driving Licence. We'll show all but mark some mandatory.
    const isPanRequired = formData.category === 'general';
    const isDlRequired = formData.examId === 'e2'; // example condition

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Stepper Header */}
                <div className="bg-gray-50 flex items-center justify-between px-6 py-4 md:px-8 md:py-5 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg md:text-xl font-bold text-gray-900">
                            {step === 1 && "Basic Information"}
                            {step === 2 && "Exam Selection"}
                            {step === 3 && "Educational Details"}
                            {step === 4 && "Identity Documents"}
                            {step === 5 && "Final Review"}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors ${step >= s ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="p-6 md:p-8">

                    {/* STEP 1: Basic Information */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">1. Basic Information Form</h3>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name <span className="text-red-500">*</span></label>
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
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Exam & Category */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">2. Exam Selection</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam <span className="text-red-500">*</span></label>
                                    <select name="examId" value={formData.examId} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-white">
                                        <option value="">-- Choose an Exam --</option>
                                        {exams.map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Category <span className="text-red-500">*</span></label>
                                    <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-white">
                                        <option value="general">General</option>
                                        <option value="obc">OBC / EWS</option>
                                        <option value="sc">SC</option>
                                        <option value="st">ST</option>
                                    </select>
                                </div>
                            </div>

                            {formData.examId && (
                                <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-primary-700 font-medium">Calculated Application Fee</p>
                                        <p className="text-xs text-primary-600 mt-1">Based on {exams.find(e => e.id === formData.examId)?.name} / {formData.category.toUpperCase()}</p>
                                    </div>
                                    <div className="text-3xl font-bold text-primary-800">
                                        ₹{calculatedFee}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: Educational Details & Documents */}
                    {step === 3 && (
                        <div className="space-y-8 animate-fadeIn">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">3. Educational Details & Documents</h3>
                                <p className="text-sm text-gray-500 mb-6">Upload your academic documents in the requested order. All fields marked with * are mandatory.</p>

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

                    {/* STEP 4: Identity & Personal Documents */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">4. Identity & Personal Documents</h3>
                            <p className="text-sm text-gray-500 mb-6">Upload identity documents. Requirements are dynamically adjusted based on your application type.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderFileUpload('photograph', 'Passport Size Photograph', '.jpg,.jpeg,.png', true)}
                                {renderFileUpload('signature', 'Digital Signature', '.jpg,.jpeg,.png', true)}
                                {renderFileUpload('aadharCard', 'Aadhar Card', '.pdf,.jpg,.jpeg,.png', true)}

                                {/* Dynamic logic examples */}
                                {renderFileUpload('panCard', 'PAN Card', '.pdf,.jpg,.jpeg,.png', isPanRequired)}
                                {renderFileUpload('drivingLicence', 'Driving Licence', '.pdf,.jpg,.jpeg,.png', isDlRequired)}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Final Review & Submission */}
                    {step === 5 && (
                        <div className="space-y-8 animate-fadeIn">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">5. Final Review</h3>
                                <p className="text-sm text-gray-500 mb-6">Please review all your details and uploaded documents carefully before submitting. You can edit or change documents directly from here.</p>
                            </div>

                            {/* Review: Basic Info */}
                            <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-800">Basic Information</h4>
                                    <button onClick={() => handleReviewEdit(1)} className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium">
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                </div>
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                    <div><p className="text-xs text-gray-500">Name</p><p className="font-medium text-gray-900">{formData.personalDetails.firstName} {formData.personalDetails.middleName} {formData.personalDetails.lastName}</p></div>
                                    <div><p className="text-xs text-gray-500">Father's Name</p><p className="font-medium text-gray-900">{formData.personalDetails.fatherName}</p></div>
                                    <div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-gray-900">{formData.personalDetails.email}</p></div>
                                    <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium text-gray-900">{formData.personalDetails.mobile}</p></div>
                                </div>
                            </div>

                            {/* Review: Application & Fee */}
                            <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-800">Application Details</h4>
                                    <button onClick={() => handleReviewEdit(2)} className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium">
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                </div>
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8">
                                    <div><p className="text-xs text-gray-500">Exam</p><p className="font-medium text-gray-900">{exams.find(e => e.id === formData.examId)?.name || '-'}</p></div>
                                    <div><p className="text-xs text-gray-500">Category</p><p className="font-medium text-gray-900 uppercase">{formData.category}</p></div>
                                    <div><p className="text-xs text-gray-500">Fee Payable</p><p className="font-medium text-primary-600 text-lg">₹{calculatedFee}</p></div>
                                </div>
                            </div>

                            {/* Review: Documents (with quick edit capability) */}
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">Uploaded Documents</h4>
                                    <p className="text-xs text-gray-500 font-medium">Verify or replace below</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(files).map(([key, file]) => {
                                            // Only show the dropzone if the file was selected or if it's mandatory
                                            const isMandatory = ['sscMarksheet', 'hscMarksheet', 'degreeCertificate', 'semesterMarksheets', 'photograph', 'signature', 'aadharCard'].includes(key);
                                            const isDiplomaRequired = formData.hasDiploma && (key === 'diplomaCertificate' || key === 'diplomaMarksheet');

                                            // Skip showing empty ones if they aren't mandatory to reduce clutter
                                            if (!file && !isMandatory && !isDiplomaRequired && key !== 'panCard' && key !== 'drivingLicence') return null;

                                            // Only show PAN/DL if they are applicable/chosen
                                            if (!file && key === 'panCard' && !isPanRequired) return null;
                                            if (!file && key === 'drivingLicence' && !isDlRequired) return null;

                                            const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                                            return (
                                                <div key={key}>
                                                    {renderFileUpload(key, formattedLabel, '.pdf,.jpg,.jpeg,.png', isMandatory || isDiplomaRequired)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Forms Controls */}
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

                        {step < 5 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 bg-dark-900 text-white font-semibold rounded-xl hover:bg-dark-800 transition-all shadow-md group"
                            >
                                Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting securely...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Final Submit Application
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ApplicationForm;

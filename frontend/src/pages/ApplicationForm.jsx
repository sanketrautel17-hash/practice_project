import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const ApplicationForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialExamId = queryParams.get('examId') || '';

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [calculatedFee, setCalculatedFee] = useState(0);

    const [formData, setFormData] = useState({
        examId: initialExamId,
        category: 'general',
    });

    useEffect(() => {
        // Redirect to profile setup if they haven't completed it
        if (!user?.isProfileComplete) {
            toast.error("Please complete your Master Profile first.");
            navigate('/profile-setup');
        }

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
    }, [user, navigate]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleNext = () => {
        if (step === 1 && !formData.examId) {
            toast.error("Please select an exam.");
            return;
        }

        setStep(step + 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // We use the Master Profile data instead of asking the user to upload again
            const submitData = {
                userId: user?._id,
                personalDetails: user?.profileData?.personalDetails,
                customFields: user?.profileData?.customFields || {},
                examType: exams.find(e => e.id === formData.examId),
                category: formData.category,
                fee: calculatedFee,
                documents: user?.profileData?.documents || [] // Already uploaded in master profile
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

    if (!user || !user.isProfileComplete) {
        return null; // Will redirect in useEffect
    }

    const { personalDetails } = user.profileData || {};

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                <div className="bg-gray-50 flex items-center justify-between px-6 py-4 md:px-8 md:py-5 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                        <h1 className="text-lg md:text-xl font-bold text-gray-900">
                            {step === 1 && "Start Application"}
                            {step === 2 && "Final Review"}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2].map(s => (
                            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${step >= s ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="p-6 md:p-8">

                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">1. Select Job/Exam</h3>
                            <p className="text-sm text-gray-500 mb-6">Choose the test or job you are applying for. Your master profile details will be attached automatically.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam / Job <span className="text-red-500">*</span></label>
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
                                <div className="bg-primary-50 mt-6 rounded-xl p-6 border border-primary-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-primary-700 font-medium">Application Fee</p>
                                        <p className="text-xs text-primary-600 mt-1">Based on category and exam selection</p>
                                    </div>
                                    <div className="text-3xl font-bold text-primary-800">
                                        ₹{calculatedFee}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-fadeIn">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">2. Application Review</h3>
                                <p className="text-sm text-gray-500 mb-6">Review your final application details before submitting. Your Master Profile documents are automatically attached.</p>
                            </div>

                            <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                    <h4 className="font-semibold text-gray-800">Attached Profile Details</h4>
                                </div>
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                    {personalDetails && (
                                        <>
                                            <div><p className="text-xs text-gray-500">Name</p><p className="font-medium text-gray-900">{personalDetails.firstName} {personalDetails.lastName}</p></div>
                                            <div><p className="text-xs text-gray-500">Father&apos;s Name</p><p className="font-medium text-gray-900">{personalDetails.fatherName}</p></div>
                                            <div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-gray-900">{personalDetails.email}</p></div>
                                            <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium text-gray-900">{personalDetails.mobile}</p></div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-800">Application Selection</h4>
                                </div>
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8">
                                    <div><p className="text-xs text-gray-500">Exam / Job</p><p className="font-medium text-gray-900">{exams.find(e => e.id === formData.examId)?.name || '-'}</p></div>
                                    <div><p className="text-xs text-gray-500">Category applying under</p><p className="font-medium text-gray-900 uppercase">{formData.category}</p></div>
                                    <div><p className="text-xs text-gray-500">Fee Payable</p><p className="font-medium text-primary-600 text-lg">₹{calculatedFee}</p></div>
                                </div>
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

                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 bg-dark-900 text-white font-semibold rounded-xl hover:bg-dark-800 transition-all shadow-md group"
                            >
                                Continue to Review <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Submit Final Application
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

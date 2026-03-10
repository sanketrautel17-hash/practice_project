import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, CreditCard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const StatusStepper = ({ status }) => {
    const steps = [
        { label: 'Submitted', key: 'Submitted' },
        { label: 'Under Review', key: 'Under Review' },
        { label: 'Payment Requested', key: 'Payment Requested' },
        { label: 'Payment Done', key: 'Payment Done' },
        { label: 'Application Submitted', key: 'Application Submitted' }
    ];

    const currentIndex = steps.findIndex(s => s.key === status);
    const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="w-full py-4">
            <div className="flex items-center w-full justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index <= normalizedIndex;
                    const isCurrent = index === normalizedIndex;

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${isCompleted ? 'bg-primary-500 text-white shadow-md shadow-primary-200' : 'bg-gray-200 text-gray-500'}`}>
                                {isCompleted ? <CheckCircle className="w-5 h-5" /> : (index + 1)}
                            </div>
                            <p className={`text-[10px] sm:text-xs text-center mt-2 font-medium ${isCurrent ? 'text-primary-700' : 'text-gray-500'}`}>{step.label}</p>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className={`absolute top-4 left-[50%] w-full h-1 -z-0 ${index < normalizedIndex ? 'bg-primary-400' : 'bg-gray-200'}`}></div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

const UserDashboard = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(null);
    const [availableExams, setAvailableExams] = useState([]);
    const [examsLoading, setExamsLoading] = useState(true);

    const fetchApps = async () => {
        try {
            const res = await fetch(`/api/applications/my?userId=${user?._id || '2'}`);
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExams = async () => {
        try {
            const res = await fetch('/api/exams');
            const data = await res.json();
            setAvailableExams(data);
        } catch (error) {
            console.error("Failed to fetch exams", error);
        } finally {
            setExamsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchApps();
            fetchExams();
        }
    }, [user]);

    const handlePayment = async (appId, amount) => {
        setProcessingPayment(appId);
        try {
            // 1. Mock creating Razorpay Order
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            const orderData = await orderRes.json();

            // 2. Simulate User clicking "Success" on Razorpay interface (using a small timeout for realism)
            await new Promise(resolve => setTimeout(resolve, 800));

            // 3. Verify Payment with backend
            const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: appId,
                    orderId: orderData.id,
                    paymentId: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
                    signature: 'mock_signature'
                })
            });

            if (verifyRes.ok) {
                toast.success("Payment successful! Application status updated to 'Payment Done'.");
                fetchApps();
            }

        } catch (error) {
            console.error("Payment failed", error);
            toast.error("Payment failed. Please try again.");
        } finally {
            setProcessingPayment(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {user?.name}.</p>
                </div>
            </div>

            <div className="mb-10">
                <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
                    <h2 className="text-xl font-bold text-gray-900">Available Exams & Jobs</h2>
                    <div className="text-sm">
                        <span className="text-gray-500 hidden sm:inline">Profile Status: </span>
                        <span className={user?.isProfileComplete ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{user?.isProfileComplete ? "Complete" : "Incomplete"}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <Link to="/profile-setup" className="text-primary-600 hover:text-primary-700 font-semibold">{user?.isProfileComplete ? "Edit Profile" : "Complete Profile To Apply"}</Link>
                    </div>
                </div>

                {examsLoading ? (
                    <div className="flex justify-center p-6"><div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : availableExams.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center text-gray-500">No exams or opportunities are currently available. Please check back later.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableExams.map(exam => (
                            <div key={exam.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{exam.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 flex-grow">Apply now for {exam.name}. Ensure your master profile is complete before starting.</p>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Application Fee</p>
                                        <p className="font-bold text-gray-800">₹{exam.fees?.general || 0}</p>
                                    </div>
                                    <Link to={`/apply?examId=${exam.id}`} className="bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                        Apply Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Track Previous Applications</h2>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : applications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No applications to track</h3>
                        <p className="text-gray-500 mb-6">You haven't applied for any exams or jobs yet.</p>
                        <Link to="/apply" className="inline-flex bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md items-center gap-2 transition-all">
                            Apply Now
                        </Link>
                    </div>
                ) : (
                    applications.map(app => (
                        <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between mb-6 border-b border-gray-50 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{app.examType?.name || 'Unknown Exam'}</h3>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                                        <span className="bg-gray-100 px-2 py-0.5 rounded-md uppercase font-medium">Category: {app.category}</span>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                    <p className="text-sm text-gray-500">Application Fee</p>
                                    <p className="text-2xl font-bold text-dark-900">₹{app.fee}</p>
                                </div>
                            </div>

                            <div className="py-2">
                                <StatusStepper status={app.status} />
                            </div>

                            {app.status === 'Payment Requested' && (
                                <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-orange-800">Payment Required</h4>
                                        <p className="text-sm text-orange-600">Your application has been reviewed. Please pay the fee to continue.</p>
                                    </div>
                                    <button
                                        onClick={() => handlePayment(app.id, app.fee)}
                                        disabled={processingPayment === app.id}
                                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {processingPayment === app.id ? 'Processing...' : `Pay ₹${app.fee} Now`}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserDashboard;

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, CheckCircle, ShieldCheck } from 'lucide-react';

const Home = () => {
    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="relative w-full py-24 sm:py-32 lg:py-40 flex items-center justify-center overflow-hidden bg-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100 opacity-50 blur-3xl mix-blend-multiply pointer-events-none"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-green-200 opacity-50 blur-3xl mix-blend-multiply pointer-events-none"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-6 shadow-sm border border-primary-200">
                        <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
                        Govt. Forms Simplified
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-dark-900 tracking-tight leading-tight mb-8">
                        Apply for Exams <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-green-400">Without the Hassle</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-10">
                        Your one-stop portal for NEET, JEE, UPSC, and more. Apply seamlessly, track your application real-time, and get everything done from your device.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1">
                            Start Application <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-dark-800 border border-gray-200 hover:border-gray-300 font-semibold rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                            Track Status
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

                        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-dark-800 mb-3">All Forms, One Place</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Skip the confusion. Find forms for all major government exams and university entrances beautifully organized in one dashboard.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-dark-800 mb-3">Secure Document Vault</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Upload your Aadhar, photos, and marksheets once. We store them securely using AWS S3 so you can re-use them for future applications.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-6">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-dark-800 mb-3">Live Application Status</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Stop wondering. Watch your application progress from "Submitted" to "Under Review" and finalize your payment instantly when requested.
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;

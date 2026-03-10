import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { BookOpen, FileText, Settings } from 'lucide-react';
import ManageExams from './ManageExams';
import ManageProfileConfig from './ManageProfileConfig';
import AdminApplications from './AdminApplications';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('applications'); // 'applications' or 'exams'

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">

            {/* Admin Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-dark-900 tracking-tight">Admin Portal</h2>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                    </p>
                </div>

                <div className="p-4 flex-grow">
                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'applications' ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <FileText className={`w-5 h-5 ${activeTab === 'applications' ? 'text-primary-600' : 'text-gray-400'}`} />
                            All Applications
                        </button>
                        <button
                            onClick={() => setActiveTab('exams')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'exams' ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <BookOpen className={`w-5 h-5 ${activeTab === 'exams' ? 'text-primary-600' : 'text-gray-400'}`} />
                            Manage Exams
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-primary-600' : 'text-gray-400'}`} />
                            Profile Settings
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-dark-900 text-white flex items-center justify-center font-bold">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {activeTab === 'applications' && (
                    <AdminApplications />
                )}

                {activeTab === 'exams' && (
                    <ManageExams />
                )}

                {activeTab === 'settings' && (
                    <ManageProfileConfig />
                )}
            </main>

        </div>
    );
};

export default AdminDashboard;

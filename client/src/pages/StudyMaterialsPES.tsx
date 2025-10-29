import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Download, 
  Clock, 
  ChevronRight,
  FileText
} from 'lucide-react';
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton';
import { apiService, Subject } from '../services/api';

const StudyMaterialsPES: React.FC = () => {
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading subjects...');
      
      const subjectsData = await apiService.getSubjects();
      console.log('✅ Subjects loaded:', subjectsData);
      
      setSubjects(subjectsData);
    } catch (err) {
      console.error('❌ Error loading subjects:', err);
      setError('Failed to load study materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadSubjects}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
              <p className="text-gray-600">Access course materials and resources</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div key={subject.domain} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-3">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">{subject.domain}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{subject.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{subject.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{subject.pdfCount}</div>
                    <div className="text-xs text-gray-500">Materials</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{subject.totalPages}</div>
                    <div className="text-xs text-gray-500">Pages</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {subject.totalDownloads.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(subject.lastUpdated)}
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/subject/${subject.domain}`)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  View Materials
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FloatingWorkspaceButton />
    </div>
  );
};

export default StudyMaterialsPES;
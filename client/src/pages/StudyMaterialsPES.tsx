import React, { useState, useEffect } from 'react';
import {
  Download,
  Search,
  Plus,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton';

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  class: string;
  year: string;
  pages: number;
  downloadUrl: string;
  thumbnail: string;
  author?: string;
  description?: string;
  uploadDate: Date;
  downloadCount: number;
  fileSize: string;
  category: 'lecture-notes' | 'assignments' | 'past-papers' | 'reference';
}

const StudyMaterialsPES: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'title' | 'subject'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Sample data for demonstration
  const sampleMaterials: StudyMaterial[] = [
    {
      id: '1',
      title: 'Operating Systems Fundamentals',
      subject: 'IT',
      class: '3rd Year',
      year: 'CS',
      pages: 42,
      downloadUrl: '#',
      thumbnail: '/api/placeholder/300/400',
      author: 'Prof. Smith',
      description: 'Comprehensive guide to operating system concepts',
      uploadDate: new Date('2024-09-15'),
      downloadCount: 1250,
      fileSize: '2.5 MB',
      category: 'lecture-notes'
    },
    {
      id: '2',
      title: 'Database Design Principles',
      subject: 'IT',
      class: '2nd Year',
      year: 'DBMS',
      pages: 38,
      downloadUrl: '#',
      thumbnail: '/api/placeholder/300/400',
      author: 'Dr. Johnson',
      description: 'Database design principles',
      uploadDate: new Date('2024-09-10'),
      downloadCount: 890,
      fileSize: '1.8 MB',
      category: 'lecture-notes'
    }
  ];

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setMaterials(sampleMaterials);
        setFilteredMaterials(sampleMaterials);
        setSubjects(['IT', 'CS', 'EC', 'ME']);
        setClasses(['1st Year', '2nd Year', '3rd Year', '4th Year']);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load study materials:', error);
        setError('Failed to load study materials');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter materials
  useEffect(() => {
    let filtered = materials.filter(material => {
      const matchesClass = selectedClass === 'all' || material.class === selectedClass;
      const matchesYear = selectedYear === 'all' || material.year === selectedYear;
      const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
      const matchesSearch = searchQuery === '' || 
        material.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesClass && matchesYear && matchesSubject && matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'popular':
          return b.downloadCount - a.downloadCount;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredMaterials(filtered);
    setCurrentPage(1);
  }, [materials, selectedClass, selectedYear, selectedSubject, searchQuery, sortBy]);

  const handleDownload = async (material: StudyMaterial) => {
    console.log('Downloading:', material.title);
    setMaterials(prev => prev.map(m =>
      m.id === material.id ? { ...m, downloadCount: m.downloadCount + 1 } : m
    ));
  };

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMaterials = filteredMaterials.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading study materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
              <p className="text-gray-600">Access lecture notes, assignments, and resources</p>
            </div>
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Upload Material</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{material.subject}</div>
                    <div className="text-sm">{material.pages} pages</div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{material.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {material.author}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {material.uploadDate.toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{material.subject} • {material.class}</span>
                  <span>{material.fileSize}</span>
                </div>
                
                <button
                  onClick={() => handleDownload(material)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ({material.downloadCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <FloatingWorkspaceButton />
    </div>
  );
};

export default StudyMaterialsPES;
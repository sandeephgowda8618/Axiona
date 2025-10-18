import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  FolderOpen, 
  Users, 
  BarChart3, 
  Upload,
  FileText,
  Youtube,
  Tag,
  Eye,
  EyeOff,
  Paperclip
} from 'lucide-react';

// Admin Console Layout Component
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarItems = [
    { 
      section: 'Content Management',
      items: [
        { path: '/admin/add-content', label: 'Add Content', icon: Plus },
        { path: '/admin/manage-content', label: 'Manage Content', icon: FolderOpen }
      ]
    },
    { 
      section: 'User Management',
      items: [
        { path: '/admin/users', label: 'Users', icon: Users }
      ]
    },
    { 
      section: 'Analytics',
      items: [
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
      ]
    }
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-logo">
            <div className="admin-logo-icon">S</div>
            <span className="admin-logo-text">Study-AI Mini Admin Console</span>
          </Link>
        </div>
        
        <nav className="admin-nav">
          {sidebarItems.map((section) => (
            <div key={section.section} className="admin-nav-section">
              <div className="admin-nav-title">{section.section}</div>
              <ul className="admin-nav-list">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <li key={item.path} className="admin-nav-item">
                      <Link
                        to={item.path}
                        className={`admin-nav-link ${isActive ? 'active' : ''}`}
                      >
                        <span className="admin-nav-icon">
                          <Icon size={20} />
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`admin-main ${sidebarOpen ? '' : 'expanded'}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <div className="admin-breadcrumb">
              <Link to="/admin">Admin</Link>
              <span>/</span>
              <span>Dashboard</span>
            </div>
          </div>
          
          <div className="admin-header-right">
            <div className="admin-search">
              <span className="admin-search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search..."
              />
            </div>
            
            <div className="admin-notifications">
              <span className="notification-icon">🔔</span>
              <span className="notification-badge"></span>
            </div>
            
            <div className="admin-user-menu">
              <div className="admin-avatar">A</div>
              <div className="admin-user-info">
                <div className="admin-user-name">Admin</div>
                <div className="admin-user-role">Administrator</div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Add Content Component
const AddContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'pdf'>('youtube');
  const [formData, setFormData] = useState({
    // YouTube form data
    youtubeUrl: '',
    description: '',
    topic: '',
    level: '',
    language: '',
    tags: ['programming', 'tutorial'],
    visibility: 'public',
    
    // PDF form data
    title: '',
    authors: '',
    pdfDescription: '',
    academicClass: '',
    year: '',
    subject: '',
    sourceType: '',
    sourceUrl: '',
    pdfTags: ['programming', 'tutorial'],
    pdfTopic: '',
    pdfLevel: '',
    pdfVisibility: 'public'
  });

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      handleFileUpload(files[0]);
    }
  };

  const removeTag = (tagToRemove: string, type: 'tags' | 'pdfTags') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(tag => tag !== tagToRemove)
    }));
  };

  const addTag = (newTag: string, type: 'tags' | 'pdfTags') => {
    if (newTag.trim() && !formData[type].includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], newTag.trim()]
      }));
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Content</h2>
          <p className="text-gray-600">Upload educational content to the platform</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'youtube'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            YouTube Playlist
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pdf'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Add PDF
          </button>
        </div>

        {/* YouTube Playlist Tab */}
        {activeTab === 'youtube' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  placeholder="Enter YouTube playlist URL"
                  value={formData.youtubeUrl}
                  onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">URL will be validated for 11-character playlist ID</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Enter playlist description..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Topic and Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select topic</option>
                    <option value="programming">Programming</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="engineering">Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select language</option>
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag, 'tags')}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type and press enter to add tags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value, 'tags');
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={(e) => handleInputChange('visibility', e.target.value)}
                      className="mr-2"
                    />
                    <Eye className="w-4 h-4 mr-1" />
                    Public
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="unlisted"
                      checked={formData.visibility === 'unlisted'}
                      onChange={(e) => handleInputChange('visibility', e.target.value)}
                      className="mr-2"
                    />
                    <EyeOff className="w-4 h-4 mr-1" />
                    Unlisted
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <div className="text-gray-500 mb-2">Thumbnail Preview</div>
                  <div className="text-sm text-gray-400">Playlist details will appear here after URL validation</div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Auto-fetched Playlist Title</h4>
                  <p className="text-sm text-gray-600">Playlist details will appear here after URL validation</p>
                </div>
              </div>

              <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Playlist</span>
              </button>
            </div>
          </div>
        )}

        {/* PDF Tab */}
        {activeTab === 'pdf' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">Drop PDF file here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  Choose File
                </button>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-700">Selected: {selectedFile.name}</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter document title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Academic Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Details (StudyPES only)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={formData.academicClass}
                    onChange={(e) => handleInputChange('academicClass', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Class</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                  </select>
                  <select
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Year</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                  </select>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Subject</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                  </select>
                </div>
              </div>

              {/* Authors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Authors</label>
                <input
                  type="text"
                  placeholder="Author 1, Author 2, Author 3"
                  value={formData.authors}
                  onChange={(e) => handleInputChange('authors', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Source Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sourceType}
                  onChange={(e) => handleInputChange('sourceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select source</option>
                  <option value="textbook">Textbook</option>
                  <option value="research-paper">Research Paper</option>
                  <option value="lecture-notes">Lecture Notes</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Enter document description"
                  value={formData.pdfDescription}
                  onChange={(e) => handleInputChange('pdfDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/document"
                  value={formData.sourceUrl}
                  onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.pdfTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag, 'pdfTags')}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type and press enter to add tags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value, 'pdfTags');
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Topic and Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pdfTopic}
                    onChange={(e) => handleInputChange('pdfTopic', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select topic</option>
                    <option value="programming">Programming</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="engineering">Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pdfLevel}
                    onChange={(e) => handleInputChange('pdfLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pdfVisibility"
                      value="public"
                      checked={formData.pdfVisibility === 'public'}
                      onChange={(e) => handleInputChange('pdfVisibility', e.target.value)}
                      className="mr-2"
                    />
                    <Eye className="w-4 h-4 mr-1" />
                    Public
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pdfVisibility"
                      value="unlisted"
                      checked={formData.pdfVisibility === 'unlisted'}
                      onChange={(e) => handleInputChange('pdfVisibility', e.target.value)}
                      className="mr-2"
                    />
                    <EyeOff className="w-4 h-4 mr-1" />
                    Unlisted
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Document Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Information</h3>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Page Count</span>
                    <span className="text-sm text-gray-600">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">File Size</span>
                    <span className="text-sm text-gray-600">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">SHA-256 Hash</span>
                    <span className="text-sm text-gray-600">--</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Thumbnail</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Auto-extracted or upload custom</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                    Upload custom thumbnail
                  </button>
                </div>
              </div>

              <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// Analytics Dashboard Component
const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('today');

  const stats = [
    {
      title: 'Total Users',
      value: '12,543',
      change: '+12% from last week',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Total Docs',
      value: '8,921',
      change: '+8% from last week',
      changeType: 'positive' as const,
      icon: FileText
    },
    {
      title: 'Total Notes',
      value: '45,672',
      change: '+35% from last week',
      changeType: 'positive' as const,
      icon: FileText
    },
    {
      title: 'Conference Minutes',
      value: '2,134',
      change: '-3% from last week',
      changeType: 'negative' as const,
      icon: BarChart3
    },
    {
      title: 'Avg Daily Active',
      value: '3,421',
      change: '+5% from last week',
      changeType: 'positive' as const,
      icon: BarChart3
    }
  ];

  const topUsers = [
    { name: 'Sarah Johnson', avatar: '👩‍💼', notes: 1247, lastActive: '2 hours ago', status: 'Active' },
    { name: 'Michael Chen', avatar: '👨‍💻', notes: 1156, lastActive: '1 day ago', status: 'Active' },
    { name: 'Emily Rodriguez', avatar: '👩‍🎓', notes: 1089, lastActive: '3 hours ago', status: 'Active' }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 border-b">
          {['Overview', 'Users', 'Content', 'Performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Date Range</span>
          {['Today', '7D', '30D', 'Custom'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range.toLowerCase())}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                dateRange === range.toLowerCase()
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{stat.title}</span>
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Uploads Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Weekly Uploads</h3>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Upload className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-2">Line Chart - Weekly Upload Trends</div>
              <div className="text-sm text-gray-400">Chart visualization would go here</div>
            </div>
          </div>

          {/* Top Topics Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Topics</h3>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Upload className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-2">Bar Chart - Most Popular Topics</div>
              <div className="text-sm text-gray-400">Chart visualization would go here</div>
            </div>
          </div>

          {/* Content Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Content Distribution</h3>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Upload className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-2">Pie Chart - Docs vs Playlists</div>
              <div className="text-sm text-gray-400">Chart visualization would go here</div>
            </div>
          </div>

          {/* Most Saved Documents */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Most Saved Documents</h3>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Upload className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-2">Horizontal Bar Chart - Top Saved Docs</div>
              <div className="text-sm text-gray-400">Chart visualization would go here</div>
            </div>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Top 10 Users by Notes Created</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">{user.avatar}</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.notes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActive}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Manage Content Component
const ManageContent: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentType, setContentType] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const contentItems = [
    {
      id: 1,
      title: 'Introduction to Calculus',
      type: 'video',
      topic: 'Mathematics',
      level: 'Intermediate',
      visibility: 'Public',
      uploadDate: 'Jan 15, 2025',
      uploader: 'Dr. Smith',
      duration: '45 min',
      actions: '⋮'
    },
    {
      id: 2,
      title: 'Physics Study Guide',
      type: 'pdf',
      topic: 'Science',
      level: 'Beginner',
      visibility: 'Unlisted',
      uploadDate: 'Jan 12, 2025',
      uploader: 'Prof. Johnson',
      duration: '24 pages',
      actions: '⋮'
    },
    {
      id: 3,
      title: 'World War II Documentary',
      type: 'video',
      topic: 'History',
      level: 'Advanced',
      visibility: 'Archived',
      uploadDate: 'Jan 08, 2025',
      uploader: 'Ms. Davis',
      duration: '2h 15min',
      actions: '⋮'
    }
  ];

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === contentItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(contentItems.map(item => item.id));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Manage Content</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-80"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Type Tabs */}
        <div className="flex space-x-6 border-b">
          {['All', 'Playlist', 'PDF'].map((tab) => (
            <button
              key={tab}
              onClick={() => setContentType(tab.toLowerCase())}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                contentType === tab.toLowerCase()
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">All Topics</option>
            <option value="mathematics">Mathematics</option>
            <option value="science">Science</option>
            <option value="history">History</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.length === contentItems.length}
                onChange={toggleSelectAll}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">{selectedItems.length} items selected</span>
            </label>

            {selectedItems.length > 0 && (
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Unlist
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Archive
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === contentItems.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic/Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration/Pages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.type === 'video' ? (
                        <div className="w-5 h-5 text-blue-500 mr-3">▶</div>
                      ) : (
                        <div className="w-5 h-5 text-red-500 mr-3">📄</div>
                      )}
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{item.topic}</div>
                    <div className="text-xs text-gray-400">{item.level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.visibility === 'Public' ? 'bg-green-100 text-green-800' :
                      item.visibility === 'Unlisted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.uploadDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6">
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">👤</span>
                        </div>
                      </div>
                      <div className="ml-2 text-sm text-gray-900">{item.uploader}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="hover:text-gray-700">{item.actions}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing 1 to 3 of 47 results
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 text-sm bg-gray-900 text-white rounded">1</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">2</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">3</button>
            <span className="px-2 py-1 text-sm text-gray-500">...</span>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">16</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Users Management Component
const UsersManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      role: 'Admin',
      status: true,
      registered: 'Jan 15, 2025',
      lastSeen: '2 hours ago',
      notes: 3,
      avatar: '👨‍💼'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      role: 'User',
      status: true,
      registered: 'Jan 12, 2025',
      lastSeen: '1 day ago',
      notes: 7,
      avatar: '👩‍💻'
    }
  ];

  const toggleUserSelection = (id: number) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(user => user !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* User Tabs */}
        <div className="flex space-x-6 border-b">
          {['All Users', 'Active', 'Banned', 'Recent'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '_'))}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.toLowerCase().replace(' ', '_')
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-64"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              placeholder="dd/mm/yyyy"
            />

            <span className="text-gray-500">to</span>

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              placeholder="dd/mm/yyyy"
            />

            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
              Clear Filters
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length}
                onChange={toggleSelectAll}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Select all</span>
            </label>

            {selectedUsers.length > 0 && (
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Ban Selected
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Delete Selected
                </button>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  Export CSV
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            1,247 users total
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">{user.avatar}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user.status ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-900">{user.status ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.registered}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastSeen}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.notes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="hover:text-gray-700">⋮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing 1 to 20 of 1,247 results
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 text-sm bg-gray-900 text-white rounded">1</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">2</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">3</button>
            <span className="px-2 py-1 text-sm text-gray-500">...</span>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">63</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Main Admin Console Component with routing
const AdminConsole: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AddContent />} />
      <Route path="/add-content" element={<AddContent />} />
      <Route path="/manage-content" element={<ManageContent />} />
      <Route path="/users" element={<UsersManagement />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
};

export default AdminConsole;

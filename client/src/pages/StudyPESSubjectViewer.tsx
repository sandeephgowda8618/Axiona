import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { apiService, StudyPESMaterial } from '../services/api';
import { 
  BookOpen, 
  Download, 
  Share2, 
  Bookmark,
  Highlighter,
  MessageSquare,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Grid,
  Eye,
  Save,
  Trash2,
  Palette,
  Menu,
  X,
  FileText,
  Settings,
  Maximize,
  Minimize,
  SkipBack,
  Home,
  Square,
  Circle,
  Underline,
  Type,
  Minus,
  Plus,
  Monitor,
  Columns,
  File,
  SplitSquareHorizontal,
  Info,
  ExternalLink,
  Briefcase,
  CheckCircle,
  Play,
  StickyNote
} from 'lucide-react';

// PDF Viewer imports
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton';

interface HighlightArea {
  id: string;
  pageIndex: number;
  rects: Array<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  content: string;
  color: string;
  note?: string;
  createdAt: Date;
}

const StudyPESSubjectViewer: React.FC = () => {
  const { subjectName } = useParams<{ subjectName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackMaterialActivity, currentWeek } = useProgress();
  
  // State management
  const [materials, setMaterials] = useState<StudyPESMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<StudyPESMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyPESMaterial | null>(null);
  const [highlights, setHighlights] = useState<HighlightArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(new Set());
  const [savedMaterials, setSavedMaterials] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  
  // Notes modal state
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [modalSize, setModalSize] = useState({ width: 380, height: 280 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Color palette for highlights
  const highlightColors = [
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Red', value: '#F44336' },
    { name: 'Purple', value: '#9C27B0' },
    { name: 'Orange', value: '#FF9800' }
  ];

  // Create default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Function to get file extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Function to determine if file can be displayed in viewer
  const canDisplayInViewer = (material: StudyPESMaterial) => {
    if (!material.gridFSFileId) {
      console.log('❌ No GridFS ID for material:', material.title);
      return false;
    }
    const extension = getFileExtension(material.fileName || '');
    console.log('🔍 File check for:', material.title, 'fileName:', material.fileName, 'extension:', extension, 'gridFSId:', material.gridFSFileId);
    return ['pdf'].includes(extension); // Only PDF can be displayed directly
  };

  // Function to handle file viewing/downloading for non-PDF files
  const handleFileOpen = (material: StudyPESMaterial) => {
    if (!material.gridFSFileId) {
      alert('File not available');
      return;
    }

    const extension = getFileExtension(material.fileName || '');
    const fileUrl = `http://localhost:5050/api/pipeline/files/${material.gridFSFileId}`;

    if (extension === 'pdf') {
      // For PDFs, they're already displayed in the viewer
      return;
    } else {
      // For other file types, open in new tab or download
      window.open(fileUrl, '_blank');
    }
  };

  // Function to track material access for progress
  const trackMaterialAccess = (material: StudyPESMaterial) => {
    const materialType = getFileExtension(material.fileName || '') === 'pdf' ? 'pdf' : 'reference'
    
    const activity = {
      type: materialType as 'pdf' | 'reference' | 'video' | 'slide',
      id: material.gridFSFileId || `${material.title}_${Date.now()}`,
      title: material.title,
      timestamp: Date.now()
    }

    console.log(`📚 Tracking material access: ${material.title} for Week ${currentWeek}`)
    trackMaterialActivity(activity, currentWeek)
  }

  // Function to download file
  const handleFileDownload = (material: StudyPESMaterial) => {
    if (!material.gridFSFileId) {
      alert('File not available for download');
      return;
    }

    const link = document.createElement('a');
    link.href = `http://localhost:5050/api/pipeline/files/${material.gridFSFileId}`;
    link.download = material.fileName || material.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to get file type display name
  const getFileTypeDisplay = (filename: string) => {
    const extension = getFileExtension(filename);
    switch (extension) {
      case 'pdf': return 'PDF Document';
      case 'pptx': return 'PowerPoint Presentation';
      case 'pps': return 'PowerPoint Show';
      case 'docx': return 'Word Document';
      case 'doc': return 'Word Document';
      default: return 'Document';
    }
  };

  // Load materials for the subject
  useEffect(() => {
    const loadMaterials = async () => {
      if (!subjectName) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Loading StudyPES materials for subject:', subjectName);
        
        // Get all StudyPES subjects and materials
        const response = await apiService.getStudyPESSubjects();
        const subjectData = response.subjects[subjectName];
        
        if (subjectData) {
          // Flatten all materials from all units
          const allMaterials: StudyPESMaterial[] = [];
          Object.values(subjectData.units).forEach(unitMaterials => {
            if (Array.isArray(unitMaterials)) {
              allMaterials.push(...unitMaterials as StudyPESMaterial[]);
            }
          });
          
          setMaterials(allMaterials);
          setFilteredMaterials(allMaterials); // Initialize filtered materials
          console.log('✅ Loaded', allMaterials.length, 'materials for', subjectName);
          
          // Auto-select first material if available
          if (allMaterials.length > 0) {
            setSelectedMaterial(allMaterials[0]);
          }

          // Extract unique units for filtering
          const units = new Set<string>();
          allMaterials.forEach(material => {
            if (material.unit) {
              units.add(material.unit);
            }
          });
          setAvailableUnits(Array.from(units));
          
        } else {
          setError(`Subject "${subjectName}" not found`);
        }
        
      } catch (err) {
        console.error('❌ Error loading materials:', err);
        setError('Failed to load materials');
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, [subjectName]);

  // Handle PDF document load
  const handleDocumentLoad = (e: any) => {
    setTotalPages(e.doc.numPages);
    console.log('📄 PDF loaded with', e.doc.numPages, 'pages');
  };

  // Handle page changes
  const handlePageChange = (e: { currentPage: number }) => {
    const newPage = e.currentPage + 1; // PDF.js uses 0-based indexing
    setCurrentPage(newPage);
  };

  // Toggle material completion
  const toggleMaterialCompletion = (materialId: string) => {
    setCompletedMaterials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materialId)) {
        newSet.delete(materialId);
      } else {
        newSet.add(materialId);
      }
      return newSet;
    });
  };

  // Open notes modal
  const handleNotesClick = () => {
    if (!selectedMaterial) return;
    setNoteTitle(`Notes - ${selectedMaterial.title} (Page ${currentPage})`);
    setNoteText('');
    setModalPosition({
      x: (window.innerWidth - modalSize.width) / 2,
      y: (window.innerHeight - modalSize.height) / 2
    });
    setIsNotesModalOpen(true);
  };

  // Save note
  const handleSaveNote = async () => {
    if (!noteText.trim() || !user || !selectedMaterial) return;
    
    try {
      const noteData = {
        title: noteTitle || `Notes - ${selectedMaterial.title} (Page ${currentPage})`,
        content: noteText,
        pdfId: selectedMaterial.id, // Use materialId as pdfId for compatibility
        userId: user.id,
        pageNumber: currentPage,
        tags: [selectedMaterial.subject || 'StudyPES'],
        isPublic: false,
        context: 'pes_material' as const
      };

      // Use the notes context to create note
      const savedNote = await apiService.createNote(noteData);
      
      if (savedNote) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
        setIsNotesModalOpen(false);
        setNoteText('');
        setNoteTitle('');
        console.log('✅ Note saved successfully');
      }
    } catch (err) {
      console.error('❌ Error saving note:', err);
      alert('Failed to save note. Please try again.');
    }
  };

  // Drag handlers for modal
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Filter materials by unit
  useEffect(() => {
    if (selectedUnit === 'all') {
      setFilteredMaterials(materials);
    } else {
      setFilteredMaterials(materials.filter(material => material.unit === selectedUnit));
    }
  }, [selectedUnit, materials]);

  // Auto-select first material when filtered materials change
  useEffect(() => {
    if (filteredMaterials.length > 0) {
      // Only auto-select if current material is not in filtered list
      const currentMaterialInFiltered = filteredMaterials.find(material => material.id === selectedMaterial?.id);
      if (!currentMaterialInFiltered) {
        setSelectedMaterial(filteredMaterials[0]);
      }
    } else {
      setSelectedMaterial(null);
    }
  }, [filteredMaterials]);

  // Save/Unsave material functionality
  const handleSaveMaterial = async (material: StudyPESMaterial) => {
    if (!user) {
      alert('Please sign in to save materials');
      return;
    }

    try {
      const isSaved = savedMaterials.has(material.id);
      
      if (isSaved) {
        // Unsave material
        await apiService.unsaveMaterial(material.id, user.id);
        setSavedMaterials(prev => {
          const newSet = new Set(prev);
          newSet.delete(material.id);
          return newSet;
        });
        alert('Material removed from saved files');
      } else {
        // Save material
        const savedFileData = {
          userId: user.id,
          materialId: material.id,
          materialType: 'pes_material',
          title: material.title,
          subject: material.subject,
          unit: material.unit,
          fileName: material.fileName,
          gridFSFileId: material.gridFSFileId,
          description: material.description,
          author: material.author,
          pages: material.pages
        };
        
        await apiService.saveMaterial(savedFileData);
        setSavedMaterials(prev => new Set(prev).add(material.id));
        alert('Material saved to My Rack!');
      }
    } catch (error) {
      console.error('❌ Error saving/unsaving material:', error);
      alert('Failed to save material. Please try again.');
    }
  };

  // Load saved materials on component mount
  useEffect(() => {
    const loadSavedMaterials = async () => {
      if (!user) return;
      
      try {
        const savedFiles = await apiService.getSavedMaterials(user.id);
        const savedIds = new Set(savedFiles.map((file: any) => file.materialId) as string[]);
        setSavedMaterials(savedIds);
      } catch (error) {
        console.error('❌ Error loading saved materials:', error);
      }
    };
    
    loadSavedMaterials();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading study materials...</span>
      </div>
    );
  }

  if (error || materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          {error || 'No materials found'}
        </h2>
        <button
          onClick={() => navigate('/study-materials')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Study Materials
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Materials List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => navigate('/study-materials')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-3 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Subjects
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {subjectName}
          </h2>
          <p className="text-sm text-gray-600">
            {filteredMaterials.length} {selectedUnit === 'all' ? 'materials' : `materials in ${selectedUnit}`} • Choose a material to view
          </p>
        </div>

        {/* Filter by Unit - Button Style */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Filter by Unit
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedUnit('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedUnit === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Units
            </button>
            {availableUnits.map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedUnit === unit
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Materials List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {filteredMaterials.map((material, index) => (
            <div
              key={material.id}
              className={`group p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                selectedMaterial?.id === material.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm'
                  : 'hover:bg-gray-50 hover:shadow-sm'
              }`}
              onClick={() => {
                setSelectedMaterial(material)
                trackMaterialAccess(material)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Completion Status */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMaterialCompletion(material.id);
                    }}
                    className="mt-1 transition-all hover:scale-110"
                  >
                    {completedMaterials.has(material.id) ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 group-hover:text-gray-500" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <span className="text-xs font-bold text-white bg-indigo-500 px-2 py-1 rounded-md">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="ml-2 bg-blue-100 rounded-md p-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                      {material.title}
                    </h3>
                    {material.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                        {material.description}
                      </p>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 text-gray-500">
                        <span className="flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {material.pages} pages
                        </span>
                        {material.author && (
                          <span className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            {material.author}
                          </span>
                        )}
                      </div>
                      {selectedMaterial?.id === material.id && (
                        <div className="flex items-center text-blue-600">
                          <Play className="w-4 h-4 fill-current animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Study Progress</span>
            <span className="font-semibold text-gray-800">
              {Array.from(completedMaterials).filter(id => filteredMaterials.some(m => m.id === id)).length} / {filteredMaterials.length} completed
            </span>
          </div>
          <div className="relative">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${filteredMaterials.length > 0 ? 
                    (Array.from(completedMaterials).filter(id => filteredMaterials.some(m => m.id === id)).length / filteredMaterials.length) * 100 : 0}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium text-green-600">
                {filteredMaterials.length > 0 ? 
                  Math.round((Array.from(completedMaterials).filter(id => filteredMaterials.some(m => m.id === id)).length / filteredMaterials.length) * 100) : 0}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedMaterial ? (
          <>
            {/* Document Viewer Header with Toolbar */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
              {/* Main Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold text-gray-800 mb-1">{selectedMaterial.title}</h1>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      {selectedMaterial.author && (
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {selectedMaterial.author}
                        </span>
                      )}
                      <span className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {selectedMaterial.pages} pages
                      </span>
                      {selectedMaterial.semester && (
                        <span className="flex items-center">
                          <Info className="w-4 h-4 mr-1" />
                          Semester {selectedMaterial.semester}
                        </span>
                      )}
                      {selectedMaterial.unit && (
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {selectedMaterial.unit}
                        </span>
                      )}
                      <span className="flex items-center">
                        <File className="w-4 h-4 mr-1" />
                        {getFileExtension(selectedMaterial.fileName || '').toUpperCase() || 'Document'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {/* Left Side - Primary Actions */}
                  <div className="flex items-center gap-3">
                    {/* Annotate Button */}
                    <button
                      onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors shadow-sm ${
                        isAnnotationMode
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      <Highlighter className="w-4 h-4 mr-2" />
                      Annotate
                    </button>

                    {/* Notes Button */}
                    <button
                      onClick={handleNotesClick}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <StickyNote className="w-4 h-4 mr-2" />
                      Notes
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => {
                        if (selectedMaterial.gridFSFileId) {
                          window.open(`http://localhost:5050/api/pipeline/files/${selectedMaterial.gridFSFileId}`, '_blank');
                        } else {
                          alert('File not available for download');
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>

                  {/* Right Side - Secondary Actions */}
                  <div className="flex items-center gap-3">
                    {/* Share Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      }}
                      className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={() => handleSaveMaterial(selectedMaterial)}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        savedMaterials.has(selectedMaterial.id)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savedMaterials.has(selectedMaterial.id) ? 'Saved' : 'Save'}
                    </button>

                    {/* Settings/More Options */}
                    <button
                      className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      More
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 bg-gray-100 relative overflow-hidden">
              {selectedMaterial.gridFSFileId ? (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <div style={{ height: '100%', width: '100%' }} className="relative">
                    <Viewer
                      fileUrl={`http://localhost:5050/api/pipeline/files/${selectedMaterial.gridFSFileId}`}
                      plugins={[defaultLayoutPluginInstance]}
                      onDocumentLoad={handleDocumentLoad}
                      onPageChange={handlePageChange}
                      renderLoader={(percentages: number) => (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading document... {Math.round(percentages)}%</p>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </Worker>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      File not available
                    </h3>
                    <p className="text-gray-500">
                      This material doesn't have a file available
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Material Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Select a material to view
              </h3>
              <p className="text-gray-500">
                Choose any material from the sidebar to start studying
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {isNotesModalOpen && (
        <div 
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 z-[9999] select-none flex flex-col"
          style={{
            left: modalPosition.x,
            top: modalPosition.y,
            width: modalSize.width,
            height: modalSize.height,
            cursor: isDragging ? 'grabbing' : 'default',
            minWidth: '300px',
            minHeight: '250px'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Modal Header */}
          <div className="modal-header bg-blue-600 px-3 py-2 cursor-grab border-b border-gray-200 flex items-center justify-between text-white rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h3 className="text-sm font-medium">Add Note</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white/90">
                Page {currentPage}
              </span>
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
            {/* Title Input */}
            <div className="flex-shrink-0 mb-2">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Note Textarea */}
            <div className="flex-1 mb-2 min-h-0">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full h-full p-3 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {selectedMaterial?.title && `${selectedMaterial.title.substring(0, 30)}...`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsNotesModalOpen(false)}
                    className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteText.trim()}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-[10000] flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Note saved successfully!
        </div>
      )}

      {/* Floating Workspace Button */}
      {selectedMaterial && (
        <FloatingWorkspaceButton
          content={{
            id: selectedMaterial.id,
            title: selectedMaterial.title,
            type: 'material' as const,
            url: selectedMaterial.gridFSFileId ? `http://localhost:5050/api/pipeline/files/${selectedMaterial.gridFSFileId}` : undefined,
            pdfData: selectedMaterial.gridFSFileId ? {
              fileUrl: `http://localhost:5050/api/pipeline/files/${selectedMaterial.gridFSFileId}`,
              fileName: selectedMaterial.fileName,
              pages: selectedMaterial.pages
            } : undefined,
            currentPage: currentPage,
            progress: Math.round((Array.from(completedMaterials).filter(id => filteredMaterials.some(m => m.id === id)).length / filteredMaterials.length) * 100) || 0
          }}
        />
      )}
    </div>
  );
};

export default StudyPESSubjectViewer;

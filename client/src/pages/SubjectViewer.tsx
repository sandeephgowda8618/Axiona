import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FileText,
  Play,
  CheckCircle,
  Circle,
  StickyNote,
  X
} from 'lucide-react';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer, RenderPageProps } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, MessageIcon, RenderHighlightContentProps } from '@react-pdf-viewer/highlight';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import { apiService, PDFMaterial, Highlight } from '../services/api';
import { useAuth, mockUser } from '../contexts/AuthContext';
import { useNotesContext } from '../contexts/NotesContext';

interface SubjectViewerProps {
  domain: string;
}

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

const SubjectViewer: React.FC = () => {
  const { domain } = useParams<{ domain: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { triggerRefresh } = useNotesContext();
  
  // Use real Firebase user now that backend supports Firebase UIDs
  const currentUser = isAuthenticated ? user : mockUser;
  
  // State management
  const [pdfs, setPdfs] = useState<PDFMaterial[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<PDFMaterial | null>(null);
  const [highlights, setHighlights] = useState<HighlightArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [showNotes, setShowNotes] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [tempHighlight, setTempHighlight] = useState<any>(null);
  const [completedPdfs, setCompletedPdfs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Ref to track current page for highlights
  const pageRef = useRef<number>(1);
  
  // Floating Notes Modal State
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [existingNote, setExistingNote] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [modalSize, setModalSize] = useState({ width: 380, height: 280 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
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

  // Initialize PDF viewer plugins
  const bookmarkPluginInstance = bookmarkPlugin();
  const searchPluginInstance = searchPlugin();
  const zoomPluginInstance = zoomPlugin();
  
  // Page navigation plugin with page change tracking
  const pageNavigationPluginInstance = pageNavigationPlugin({
    enableShortcuts: true,
  });
  
  // Track page changes for proper highlight page assignment
  const { jumpToPage } = pageNavigationPluginInstance;

  // Highlight plugin with custom render
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget: (props: RenderHighlightContentProps) => (
      <div
        style={{
          background: '#eee',
          border: '1px solid #000',
          borderRadius: '2px',
          padding: '8px',
          position: 'absolute',
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          zIndex: 1,
        }}
      >
        <div className="flex gap-2 mb-2">
          {highlightColors.map((color) => (
            <button
              key={color.value}
              className={`w-6 h-6 rounded border-2 ${
                selectedColor === color.value ? 'border-gray-800' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => setSelectedColor(color.value)}
              title={color.name}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            onClick={() => addHighlight(props, selectedColor)}
          >
            <Highlighter className="w-4 h-4 inline mr-1" />
            Highlight
          </button>
          <button
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            onClick={() => {
              setTempHighlight(props);
              setShowNotes(true);
            }}
          >
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Note
          </button>
        </div>
      </div>
    ),
    renderHighlightContent: (props: RenderHighlightContentProps) => (
      <div
        style={{
          background: selectedColor,
          opacity: 0.4,
        }}
      />
    ),
  });

  // Default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      ...defaultTabs,
      {
        content: <HighlightsList highlights={highlights} onDeleteHighlight={deleteHighlight} />,
        icon: <Highlighter />,
        title: 'Highlights & Notes',
      },
    ],
  });

  // Load PDFs for the subject
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const loadPDFs = async () => {
      if (!domain) return;
      
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        console.log('🔄 Loading PDFs for subject:', domain);
        
        const response = await apiService.getPDFsBySubject(domain);
        
        if (isMounted) {
          setPdfs(response.data);
          console.log('✅ Loaded', response.data.length, 'PDFs');
          
          // Auto-select first PDF only if no PDF is currently selected
          if (response.data.length > 0 && !selectedPdf) {
            setSelectedPdf(response.data[0]);
          }
        }
        
      } catch (err) {
        console.error('❌ Error loading PDFs:', err);
        if (isMounted) {
          setError('Failed to load PDFs');
          setPdfs([]); // Clear PDFs on error
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPDFs();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [domain]);

  // Load highlights when PDF changes
  useEffect(() => {
    let isMounted = true;
    
    const loadHighlights = async () => {
      if (!selectedPdf) {
        setHighlights([]);
        return;
      }
      
      try {
        console.log('🔄 Loading highlights for PDF:', selectedPdf._id);
        const highlightsData = await apiService.getHighlights(selectedPdf._id);
        
        if (isMounted) {
          const transformedHighlights = highlightsData.map(transformHighlight);
          setHighlights(transformedHighlights);
          console.log('✅ Loaded highlights:', transformedHighlights.length);
        }
      } catch (err) {
        console.error('❌ Error loading highlights:', err);
        if (isMounted) {
          setHighlights([]); // Clear highlights on error
        }
      }
    };

    loadHighlights();
    
    return () => {
      isMounted = false;
    };
  }, [selectedPdf?._id]); // Only re-run when selected PDF ID changes

  // Handle page changes in PDF viewer
  const handlePageChange = (e: { currentPage: number; doc: any }) => {
    const newPage = e.currentPage + 1; // PDF.js uses 0-based indexing
    console.log('📄 Page changed from', currentPage, 'to', newPage);
    setCurrentPage(newPage);
    pageRef.current = newPage;
    console.log('📄 Current page state updated to:', newPage);
  };

  // Transform API highlight to component format
  const transformHighlight = (highlight: Highlight): HighlightArea => ({
    id: highlight._id,
    pageIndex: highlight.position.pageNumber - 1,
    rects: highlight.position.rects?.map((rect: any) => ({
      left: rect.x1,
      top: rect.y1,
      width: rect.width,
      height: rect.height,
    })) || [],
    content: highlight.content.text,
    color: highlight.style.color,
    note: highlight.note,
    createdAt: new Date(highlight.createdAt),
  });

  // Add highlight with proper page detection
  const addHighlight = async (props: RenderHighlightContentProps, color: string, note?: string) => {
    if (!selectedPdf || !currentUser) {
      console.error('Cannot add highlight: Missing PDF or user data');
      return;
    }

    const highlightData = {
      pdfId: selectedPdf._id,
      userId: currentUser.id,
      content: {
        text: props.selectedText,
      },
      position: {
        pageNumber: currentPage, // Use actual current page
        boundingRect: {
          x1: props.selectionRegion.left,
          y1: props.selectionRegion.top,
          x2: props.selectionRegion.left + props.selectionRegion.width,
          y2: props.selectionRegion.top + props.selectionRegion.height,
          width: props.selectionRegion.width,
          height: props.selectionRegion.height,
        },
        rects: [{
          x1: props.selectionRegion.left,
          y1: props.selectionRegion.top,
          x2: props.selectionRegion.left + props.selectionRegion.width,
          y2: props.selectionRegion.top + props.selectionRegion.height,
          width: props.selectionRegion.width,
          height: props.selectionRegion.height,
        }],
        viewportDimensions: {
          width: window.innerWidth,
          height: window.innerHeight,
        }
      },
      style: {
        color,
        opacity: 0.4,
      },
      note: note || undefined,
      tags: [],
      isPublic: false,
    };

    try {
      console.log('Creating highlight:', highlightData);
      const newHighlight = await apiService.createHighlight(highlightData);
      const transformedHighlight = transformHighlight(newHighlight);
      setHighlights(prev => [...prev, transformedHighlight]);
      props.cancel();
      
      // Show success message
      console.log('Highlight saved successfully to database');
    } catch (err) {
      console.error('Error creating highlight:', err);
      alert('Failed to save highlight. Please try again.');
    }
  };

  // Add note with highlight
  const addNoteWithHighlight = async () => {
    if (!tempHighlight || !currentNote.trim()) return;

    await addHighlight(tempHighlight, selectedColor, currentNote);
    
    setShowNotes(false);
    setCurrentNote('');
    setTempHighlight(null);
  };

  // Delete highlight with confirmation
  const deleteHighlight = async (highlightId: string) => {
    if (!confirm('Are you sure you want to delete this highlight?')) {
      return;
    }
    
    try {
      await apiService.deleteHighlight(highlightId);
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
      console.log('Highlight deleted successfully');
    } catch (err) {
      console.error('Error deleting highlight:', err);
      alert('Failed to delete highlight. Please try again.');
    }
  };

  // ================= NOTES FUNCTIONS =================
  
  // Open notes modal
  const handleNotesClick = () => {
    if (!selectedPdf) return;
    setExistingNote(null); // Start with new note
    setNoteTitle(`Notes - ${selectedPdf.topic} (Page ${currentPage})`);
    setNoteText('');
    // Center the modal
    setModalPosition({
      x: (window.innerWidth - modalSize.width) / 2,
      y: (window.innerHeight - modalSize.height) / 2
    });
    setIsNotesModalOpen(true);
  };

  // Close notes modal
  const handleNotesModalClose = () => {
    setIsNotesModalOpen(false);
    setExistingNote(null);
    setNoteText('');
    setNoteTitle('');
  };

  // Save note to database
  const handleSaveNote = async () => {
    if (!noteText.trim() || !currentUser || !selectedPdf) return;
    
    try {
      console.log('🔧 Saving note with data:', {
        title: noteTitle || `Notes - ${selectedPdf.topic} (Page ${currentPage})`,
        content: noteText,
        pdfId: selectedPdf._id,
        userId: currentUser.id,
        pageNumber: currentPage,
        tags: [selectedPdf.domain || 'Study'],
        isPublic: false
      });

      const noteData = {
        title: noteTitle || `Notes - ${selectedPdf.topic} (Page ${currentPage})`,
        content: noteText,
        pdfId: selectedPdf._id,
        userId: currentUser.id,
        pageNumber: currentPage,
        tags: [selectedPdf.domain || 'Study'],
        isPublic: false
      };

      const savedNote = await apiService.createNote(noteData);
      
      if (savedNote) {
        // Show success message and close modal
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
        handleNotesModalClose();
        
        // Trigger refresh in other components (like MyRack)
        console.log('📝 SubjectViewer: Note saved successfully, triggering refresh...');
        triggerRefresh();
        
        console.log('✅ Note saved successfully:', savedNote);
      }
    } catch (err) {
      console.error('❌ Error saving note:', err);
      alert('Failed to save note. Please try again.');
    }
  };

  // Floating modal drag handlers
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
    setIsResizing(false);
  };

  // Add event listeners for drag
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

  // Mark PDF as completed
  const togglePdfCompletion = (pdfId: string) => {
    setCompletedPdfs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pdfId)) {
        newSet.delete(pdfId);
      } else {
        newSet.add(pdfId);
      }
      return newSet;
    });
  };

  // Get subject title
  const getSubjectTitle = (domain: string) => {
    const titles: { [key: string]: string } = {
      'DSA': 'Data Structures & Algorithms',
      'AFLL': 'Automata & Formal Language Theory',
      'Math': 'Mathematics'
    };
    return titles[domain] || domain;
  };

  // Update note title when page changes (if modal is open and no custom title set)
  useEffect(() => {
    if (isNotesModalOpen && selectedPdf && !existingNote && noteTitle.includes('Page')) {
      setNoteTitle(`Notes - ${selectedPdf.topic} (Page ${currentPage})`);
    }
  }, [currentPage, isNotesModalOpen, selectedPdf, existingNote, noteTitle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading course materials...</span>
      </div>
    );
  }

  if (error || pdfs.length === 0) {
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
      {/* Left Sidebar - PDF List */}
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
            {getSubjectTitle(domain || '')}
          </h2>
          <p className="text-sm text-gray-600">
            {pdfs.length} materials • Choose a topic to view
          </p>
        </div>

        {/* PDF List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {pdfs.map((pdf, index) => (
            <div
              key={pdf._id}
              className={`group p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                selectedPdf?._id === pdf._id
                  ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm'
                  : 'hover:bg-gray-50 hover:shadow-sm'
              }`}
              onClick={() => setSelectedPdf(pdf)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Completion Status */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePdfCompletion(pdf._id);
                    }}
                    className="mt-1 transition-all hover:scale-110"
                  >
                    {completedPdfs.has(pdf._id) ? (
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
                      {pdf.topic}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                      {pdf.description}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 text-gray-500">
                        <span className="flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {pdf.pages} pages
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {pdf.downloadCount} views
                        </span>
                      </div>
                      {selectedPdf?._id === pdf._id && (
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
              {completedPdfs.size} / {pdfs.length} completed
            </span>
          </div>
          <div className="relative">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(completedPdfs.size / pdfs.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium text-green-600">
                {Math.round((completedPdfs.size / pdfs.length) * 100)}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedPdf ? (
          <>
            {/* PDF Viewer Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-gray-800 mb-1">{selectedPdf.topic}</h1>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {selectedPdf.author}
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {selectedPdf.pages} pages
                    </span>
                    <span className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      {selectedPdf.formattedFileSize}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {selectedPdf.downloadCount} views
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tools Section */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                    {/* Annotation Mode Toggle */}
                    <button
                      onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        isAnnotationMode
                          ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                      title="Toggle Annotation Mode"
                    >
                      <Highlighter className="w-4 h-4 mr-2" />
                      Annotate
                    </button>

                    {/* Notes Button */}
                    <button
                      onClick={handleNotesClick}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                      title="Create/Edit Notes"
                    >
                      <StickyNote className="w-4 h-4 mr-2" />
                      Notes
                    </button>

                    {/* Color Palette */}
                    {isAnnotationMode && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200">
                        <span className="text-xs text-gray-500 mr-1">Color:</span>
                        {highlightColors.map((color) => (
                          <button
                            key={color.value}
                            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                              selectedColor === color.value 
                                ? 'border-gray-800 shadow-md' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => setSelectedColor(color.value)}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        window.open(`http://localhost:5050/api/pdfs/file/${selectedPdf.gridFSFileId}`, '_blank');
                        apiService.trackPDFDownload(selectedPdf._id);
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>

                    <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-100 relative overflow-hidden">
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}>
                <div style={{ height: '100%', width: '100%' }} className="relative">
                  <Viewer
                    fileUrl={`http://localhost:5050/api/pdfs/file/${selectedPdf.gridFSFileId}`}
                    plugins={[
                      defaultLayoutPluginInstance,
                      highlightPluginInstance,
                      bookmarkPluginInstance,
                      searchPluginInstance,
                      zoomPluginInstance,
                      pageNavigationPluginInstance,
                    ]}
                    theme="light"
                    defaultScale={1.2}
                    onDocumentLoad={(e) => {
                      console.log('PDF loaded with', e.doc.numPages, 'pages');
                    }}
                    onPageChange={handlePageChange}
                    renderLoader={(percentages: number) => (
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Loading PDF... {Math.round(percentages)}%</p>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </Worker>
            </div>
          </>
        ) : (
          /* No PDF Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Select a material to view
              </h3>
              <p className="text-gray-500">
                Choose any topic from the sidebar to start studying
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Enter your note..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowNotes(false);
                  setCurrentNote('');
                  setTempHighlight(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addNoteWithHighlight}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Note & Highlight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Improved Floating Notes Modal */}
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
          {/* Compact Modal Header - Draggable */}
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
                onClick={handleNotesModalClose}
                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Modal Content - Flexible Layout */}
          <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
            {/* Title Input - Fixed Height */}
            <div className="flex-shrink-0 mb-2">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Note Textarea - Flexible Height */}
            <div className="flex-1 mb-2 min-h-0">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full h-full p-3 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>

            {/* Footer - Fixed Height */}
            <div className="flex-shrink-0 pt-2 border-t border-gray-200">
              {/* PDF Info */}
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="truncate">{selectedPdf?.topic}</span>
                <span>•</span>
                <span>Page {currentPage}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleNotesModalClose}
                  className="flex-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = modalSize.width;
              const startHeight = modalSize.height;

              const handleResize = (e: MouseEvent) => {
                setModalSize({
                  width: Math.max(300, startWidth + (e.clientX - startX)),
                  height: Math.max(250, startHeight + (e.clientY - startY))
                });
              };

              const handleResizeEnd = () => {
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', handleResizeEnd);
                setIsResizing(false);
              };

              document.addEventListener('mousemove', handleResize);
              document.addEventListener('mouseup', handleResizeEnd);
            }}
          >
            <div className="absolute bottom-0 right-0 w-0 h-0 border-l-4 border-l-transparent border-b-4 border-b-gray-400"></div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-[10000] flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          <span className="font-medium">Note saved successfully!</span>
        </div>
      )}
    </div>
  );
};

// Highlights list component
const HighlightsList: React.FC<{
  highlights: HighlightArea[];
  onDeleteHighlight: (id: string) => void;
}> = ({ highlights, onDeleteHighlight }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Highlights & Notes</h3>
      {highlights.length === 0 ? (
        <p className="text-gray-500 text-sm">No highlights yet</p>
      ) : (
        <div className="space-y-3">
          {highlights.map((highlight) => (
            <div key={highlight.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div
                    className="w-4 h-4 rounded mb-2"
                    style={{ backgroundColor: highlight.color }}
                  />
                  <p className="text-sm text-gray-800 mb-2">"{highlight.content}"</p>
                  {highlight.note && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {highlight.note}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Page {highlight.pageIndex + 1} • {highlight.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteHighlight(highlight.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectViewer;

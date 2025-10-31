import React, { useState, useEffect } from 'react';
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
  SplitSquareHorizontal
} from 'lucide-react';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';

// Only import core styles, avoid plugin styles that include toolbars
import '@react-pdf-viewer/core/lib/styles/index.css';
import '../styles/pdf-viewer.css';
import { apiService } from '../services/api';
import { PDFMaterial, Highlight } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../hooks/useNotes';

// Configure PDF.js worker with local files instead of CDN
const pdfWorkerUrl = '/pdf.worker.min.js';

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

const PDFViewer: React.FC = () => {
  const { pdfId } = useParams<{ pdfId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createNote, loading: notesLoading } = useNotes(user?.id);
  
  // State management
  const [pdf, setPdf] = useState<PDFMaterial | null>(null);
  const [highlights, setHighlights] = useState<HighlightArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [showNotes, setShowNotes] = useState(false);
  const [tempHighlight, setTempHighlight] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'highlights' | 'thumbnails' | 'search'>('highlights');
  const [searchText, setSearchText] = useState('');
  
  // Floating notes modal state
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [modalSize, setModalSize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // New PDF viewer controls
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'single' | 'continuous' | 'facing'>('continuous');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pageHistory, setPageHistory] = useState<number[]>([1]);
  const [annotationTool, setAnnotationTool] = useState<'highlight' | 'underline' | 'shape' | 'text'>('highlight');
  const [showAnnotationToolbar, setShowAnnotationToolbar] = useState(false);

  // Color palette for highlights
  const highlightColors = [
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Red', value: '#F44336' },
    { name: 'Purple', value: '#9C27B0' },
    { name: 'Orange', value: '#FF9800' }
  ];

  // Initialize only essential plugins without default layout to avoid toolbar
  // We'll use the core viewer without any plugins to avoid default UI
  const handleDocumentLoad = (e: any) => {
    setTotalPages(e.doc.numPages);
    setLoading(false);
  };

  // Zoom control functions
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 25, 300);
    setZoomLevel(newZoom);
    // We'll implement custom zoom by scaling the viewer
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 25, 25);
    setZoomLevel(newZoom);
    // We'll implement custom zoom by scaling the viewer
  };

  const handleZoomChange = (value: number) => {
    setZoomLevel(value);
    // We'll implement custom zoom by scaling the viewer
  };

  // Page navigation functions (custom implementation)
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
      setPageHistory(prev => [...prev, newPage]);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
      setPageHistory(prev => [...prev, newPage]);
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setPageInput(pageNum.toString());
      setPageHistory(prev => [...prev, pageNum]);
    }
  };

  const goBackInHistory = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      setCurrentPage(previousPage);
      setPageInput(previousPage.toString());
    }
  };

  // Full screen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Handle page input change
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum)) {
      goToPage(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // Custom highlight functionality (without plugin)
  const addHighlight = (text: string, color: string, pageIndex: number) => {
    const newHighlight: HighlightArea = {
      id: Date.now().toString(),
      pageIndex,
      rects: [], // We'll implement custom rect calculation
      content: text,
      color,
      createdAt: new Date()
    };
    setHighlights(prev => [...prev, newHighlight]);
  };

  // Load PDF data and setup page tracking
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfId) return;
      
      try {
        setLoading(true);
        const pdfData = await apiService.getPDFDetails(pdfId);
        setPdf(pdfData);
        setTotalPages(pdfData.pages || 0);
        
        // Load existing highlights
        const userId = user?.id || 'guest';
        const highlightsData = await apiService.getHighlights(pdfId, userId);
        setHighlights(highlightsData.map(transformHighlight));
        
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfId]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Forcefully hide any toolbar elements that plugins might create
  useEffect(() => {
    // Inject additional CSS to override any plugin styles
    const additionalStyles = `
      .pdf-viewer-container .rpv-core__toolbar,
      .pdf-viewer-container .rpv-toolbar,
      .pdf-viewer-container .rpv-zoom__popover,
      .pdf-viewer-container .rpv-page-navigation__current-page-input,
      .pdf-viewer-container [role="toolbar"],
      .pdf-viewer-container .rpv-core__button,
      .pdf-viewer-container .rpv-core__popover {
        display: none !important;
        visibility: hidden !important;
        height: 0px !important;
        width: 0px !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        z-index: -9999 !important;
      }
      
      .pdf-viewer-container .rpv-core__inner-container {
        padding-top: 0 !important;
        margin-top: 0 !important;
      }
      
      .pdf-viewer-container .rpv-core__viewer {
        padding-top: 0 !important;
      }
    `;

    const styleId = 'pdf-viewer-override-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = additionalStyles;
      document.head.appendChild(styleElement);
    }

    const hideToolbars = () => {
      // NUCLEAR APPROACH: Hide any element that could possibly be a toolbar
      const toolbarSelectors = [
        '.rpv-core__toolbar',
        '.rpv-toolbar', 
        '.rpv-default-layout__toolbar',
        '.rpv-default-layout__main-toolbar',
        '.rpv-zoom__popover',
        '.rpv-page-navigation__popover',
        '.rpv-page-navigation__current-page-input',
        '.rpv-search__popover',
        '.rpv-highlight__popover',
        '[role="toolbar"]',
        '[data-testid*="toolbar"]',
        '[data-testid="core__toolbar"]',
        '.rpv-core__button',
        '.rpv-core__popover',
        '.rpv-core__tooltip',
        // Target the first child of inner container which is usually the toolbar
        '.rpv-core__inner-container > div:first-child:not(.rpv-core__inner-pages)',
        '.rpv-core__inner-container > div:first-of-type:not(.rpv-core__inner-pages)'
      ];

      toolbarSelectors.forEach(selector => {
        const elements = document.querySelectorAll(`.pdf-viewer-container ${selector}`);
        elements.forEach(el => {
          const element = el as HTMLElement;
          element.style.setProperty('display', 'none', 'important');
          element.style.setProperty('visibility', 'hidden', 'important');
          element.style.setProperty('height', '0px', 'important');
          element.style.setProperty('max-height', '0px', 'important');
          element.style.setProperty('min-height', '0px', 'important');
          element.style.setProperty('width', '0px', 'important');
          element.style.setProperty('max-width', '0px', 'important');
          element.style.setProperty('min-width', '0px', 'important');
          element.style.setProperty('opacity', '0', 'important');
          element.style.setProperty('position', 'absolute', 'important');
          element.style.setProperty('left', '-9999px', 'important');
          element.style.setProperty('z-index', '-9999', 'important');
          element.style.setProperty('overflow', 'hidden', 'important');
          element.style.setProperty('margin', '0', 'important');
          element.style.setProperty('padding', '0', 'important');
          
          // Remove from DOM entirely if it's definitely a toolbar
          if (element.classList.contains('rpv-core__toolbar') || 
              element.getAttribute('role') === 'toolbar' ||
              element.classList.contains('rpv-toolbar')) {
            element.remove();
          }
        });
      });
      
      // Also check for any divs in the inner container that might be toolbars
      const innerContainer = document.querySelector('.pdf-viewer-container .rpv-core__inner-container');
      if (innerContainer) {
        const children = innerContainer.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement;
          // If it's not the pages container, it's probably a toolbar
          if (!child.classList.contains('rpv-core__inner-pages') && 
              !child.classList.contains('custom-pdf-toolbar')) {
            child.style.setProperty('display', 'none', 'important');
          }
        }
      }
    };

    // Run immediately and on mutations
    hideToolbars();
    
    // Create a mutation observer to hide toolbars as they're added
    const observer = new MutationObserver(hideToolbars);
    const targetNode = document.querySelector('.pdf-viewer-container');
    
    if (targetNode) {
      observer.observe(targetNode, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    return () => {
      observer.disconnect();
      // Remove the injected styles when component unmounts
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [pdf]);

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

  // Add note with highlight and save to database as .txt format
  const handleSaveNote = async (noteContent: string, noteTitle?: string) => {
    if (!noteContent.trim() || !user || !pdf) return;
    
    try {
      // Generate .txt file content with metadata
      const txtContent = `=== ${noteTitle || `Notes - ${pdf.topic} (Page ${currentPage})`} ===

📄 PDF: ${pdf.topic}
👤 Author: ${pdf.author || 'Unknown'}
📑 Page: ${currentPage}
📅 Date: ${new Date().toLocaleDateString()}
🏷️ Tags: ${pdf.domain || 'Study'}

=== CONTENT ===

${noteContent}

=== END OF NOTE ===`;

      const noteData = {
        title: noteTitle || `Notes - ${pdf.topic} (Page ${currentPage})`,
        content: txtContent, // Save the formatted .txt content
        pdfId: pdf._id,
        userId: user.id,
        tags: [pdf.domain || 'Study', 'PDF Notes', `Page ${currentPage}`],
        isPublic: false
      };

      const savedNote = await createNote(noteData);
      
      if (savedNote) {
        // Also create a highlight if we have a selection
        const newHighlight: HighlightArea = {
          id: Date.now().toString(),
          pageIndex: currentPage - 1,
          rects: [],
          content: noteContent.substring(0, 100) + (noteContent.length > 100 ? '...' : ''),
          color: selectedColor,
          note: noteContent,
          createdAt: new Date()
        };
        
        setHighlights(prev => [...prev, newHighlight]);
        
        // Show success message and close modal
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
        setShowNotes(false);
        setNoteText('');
        setNoteTitle('');
        
        console.log('Note saved successfully as .txt format:', savedNote);
        
        // Generate and download .txt file for user
        downloadNoteAsTxt(txtContent, noteTitle || `Notes - ${pdf.topic} (Page ${currentPage})`);
      }
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  // Download note as .txt file
  const downloadNoteAsTxt = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Delete highlight
  const deleteHighlight = async (highlightId: string) => {
    try {
      await apiService.deleteHighlight(highlightId);
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
    } catch (err) {
      console.error('Error deleting highlight:', err);
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    if (!pdf) return;
    
    try {
      await apiService.trackPDFDownload(pdf._id);
      // Open PDF in new tab for download
      window.open(`http://localhost:5050/api/pdfs/file/${pdf.gridFSFileId}`, '_blank');
    } catch (err) {
      console.error('Error downloading PDF:', err);
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

  // Initialize modal position when opening
  useEffect(() => {
    if (showNotes) {
      setNoteTitle(`Notes - ${pdf?.topic || 'PDF'} (Page ${currentPage})`);
      // Center the modal
      setModalPosition({
        x: (window.innerWidth - modalSize.width) / 2,
        y: (window.innerHeight - modalSize.height) / 2
      });
    }
  }, [showNotes, pdf, currentPage, modalSize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading PDF...</span>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          {error || 'PDF not found'}
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
    <div className="h-screen flex bg-gray-50">
      {/* Custom Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">PDF Tools</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* Tab Navigation */}
            <div className="flex mt-3 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSidebarTab('highlights')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  sidebarTab === 'highlights'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Highlighter className="w-4 h-4 inline mr-1" />
                Highlights
              </button>
              <button
                onClick={() => setSidebarTab('search')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  sidebarTab === 'search'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'highlights' && (
              <HighlightsList highlights={highlights} onDeleteHighlight={deleteHighlight} />
            )}
            {sidebarTab === 'search' && (
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search in PDF..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Enter text to search within the PDF document
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header with File Info */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/study-materials')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">{pdf.topic}</h1>
                <p className="text-xs text-gray-600">
                  {pdf.author} • {pdf.pages} pages • {pdf.formattedFileSize}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadPDF}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>

              <button className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-colors">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Compact PDF Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left: Page Navigation */}
            <div className="flex items-center gap-2">
              {/* Previous Page */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                  currentPage <= 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Page
              </button>

              {/* Page Number Field */}
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded border">
                <input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputSubmit}
                  onKeyPress={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                  className="w-8 text-sm text-center bg-transparent border-none outline-none"
                />
                <span className="text-sm text-gray-600">/ {totalPages}</span>
              </div>

              {/* Next Page */}
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                  currentPage >= totalPages 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Next Page"
              >
                Next Page
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>

              {/* History Back */}
              <button
                onClick={goBackInHistory}
                disabled={pageHistory.length <= 1}
                className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                  pageHistory.length <= 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Back to Previous View"
              >
                <Home className="w-4 h-4 mr-1" />
                Back to Page {pageHistory.length > 1 ? pageHistory[pageHistory.length - 2] : 1}
              </button>
            </div>

            {/* Center: View and Zoom Controls */}
            <div className="flex items-center gap-3">
              {/* View Options */}
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-gray-500 mr-1" />
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'single' | 'continuous' | 'facing')}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="single">Single Page</option>
                  <option value="continuous">Continuous Scroll</option>
                  <option value="facing">2 Pages Side by Side</option>
                </select>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 px-2 py-1 border border-gray-300 rounded bg-white">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 25}
                  className={`p-1 rounded transition-colors ${
                    zoomLevel <= 25 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoomLevel}%
                </span>
                
                <input
                  type="range"
                  min="25"
                  max="300"
                  step="25"
                  value={zoomLevel}
                  onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                  className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 300}
                  className={`p-1 rounded transition-colors ${
                    zoomLevel >= 300 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-2">
              {/* Highlight/Markup Toggle */}
              <button
                onClick={() => setShowAnnotationToolbar(!showAnnotationToolbar)}
                className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                  showAnnotationToolbar
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Highlight/Markup Tools"
              >
                <Highlighter className="w-4 h-4 mr-1" />
                Markup
              </button>

              {/* Sidebar Toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                  showSidebar
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Tools Sidebar"
              >
                <Menu className="w-4 h-4 mr-1" />
                Tools
              </button>

              {/* Full Screen */}
              <button
                onClick={toggleFullScreen}
                className="flex items-center px-2 py-1 text-gray-700 hover:bg-gray-100 rounded text-sm transition-colors"
                title="Full Screen"
              >
                <Maximize className="w-4 h-4 mr-1" />
                Full Screen
              </button>
            </div>
          </div>

          {/* Expandable Annotation Toolbar */}
          {showAnnotationToolbar && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {/* Annotation Tools */}
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600 mr-2">Tools:</span>
                  <button
                    onClick={() => setAnnotationTool('highlight')}
                    className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                      annotationTool === 'highlight' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Highlighter className="w-4 h-4 mr-1" />
                    Highlight
                  </button>
                  <button
                    onClick={() => setAnnotationTool('underline')}
                    className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                      annotationTool === 'underline' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Underline className="w-4 h-4 mr-1" />
                    Underline
                  </button>
                  <button
                    onClick={() => setAnnotationTool('shape')}
                    className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                      annotationTool === 'shape' ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Shapes
                  </button>
                  <button
                    onClick={() => {
                      setAnnotationTool('text');
                      setShowNotes(true);
                    }}
                    className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                      annotationTool === 'text' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Notes
                  </button>
                </div>

                {/* Color Palette */}
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600 mr-1">Color:</span>
                  {highlightColors.map((color) => (
                    <button
                      key={color.value}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        selectedColor === color.value ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-100 relative">
          <Worker workerUrl={pdfWorkerUrl}>
            <div style={{ height: '100%' }} className="pdf-viewer-container">
              <Viewer
                fileUrl={`http://localhost:5050/api/pdfs/file/${pdf.gridFSFileId}`}
                theme="light"
                onDocumentLoad={handleDocumentLoad}
                defaultScale={zoomLevel / 100}
              />
            </div>
          </Worker>
        </div>
      </div>

      {/* Floating Notes Modal */}
      {showNotes && (
        <div 
          className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-[9999] select-none"
          style={{
            left: modalPosition.x,
            top: modalPosition.y,
            width: modalSize.width,
            height: modalSize.height,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Modal Header - Draggable */}
          <div className="modal-header bg-gray-100 p-3 rounded-t-lg cursor-grab border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Add Note
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">Page {currentPage}</div>
              <button
                onClick={() => setShowNotes(false)}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-3 flex flex-col h-full">
            {/* Title Input */}
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Note Textarea */}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here... This modal can be dragged by the header and you can still interact with the PDF behind it."
              className="flex-1 w-full p-2 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '150px' }}
              autoFocus
            />

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                {pdf?.topic && `${pdf.topic} - Page ${currentPage}`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowNotes(false);
                    setNoteText('');
                    setNoteTitle('');
                  }}
                  className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveNote(noteText, noteTitle)}
                  disabled={!noteText.trim()}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
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
                  height: Math.max(200, startHeight + (e.clientY - startY))
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
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-400 rounded-full opacity-50"></div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[10000] flex items-center gap-2">
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          Note saved successfully!
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
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Highlights</h3>
      {highlights.length === 0 ? (
        <div className="text-center py-8">
          <Highlighter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No highlights yet</p>
          <p className="text-gray-400 text-xs mt-1">Select text to create highlights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {highlights.map((highlight) => (
            <div key={highlight.id} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <span className="text-xs text-gray-500">Page {highlight.pageIndex + 1}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-2 leading-relaxed">"{highlight.content}"</p>
                  {highlight.note && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-3 border-l-blue-400">
                      {highlight.note}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {highlight.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteHighlight(highlight.id)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete highlight"
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

export default PDFViewer;

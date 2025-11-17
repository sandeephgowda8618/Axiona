import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotesContext } from '../contexts/NotesContext';
import { apiService } from '../services/api';
import { 
  BookOpen, 
  Download, 
  ArrowLeft,
  StickyNote,
  Save,
  ExternalLink,
  X
} from 'lucide-react';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '../styles/pdf-viewer.css';
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton';
import Layout from '../components/Layout';

import { LibraryBook } from '../types/library';

// Configure PDF.js worker
const pdfWorkerUrl = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

// Highlight colors matching SubjectViewer
const highlightColors = [
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Orange', value: '#FF9800' }
];

const BookReader: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { triggerRefresh } = useNotesContext();
  
  // Get book data from navigation state
  const book = location.state?.book as LibraryBook;
  const pdfUrl = location.state?.pdfUrl as string;
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isBookSaved, setIsBookSaved] = useState(false);
  
  // Annotation and notes state
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  
  // Floating Notes Modal State (matching SubjectViewer)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [existingNote, setExistingNote] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Modal position and dragging (matching SubjectViewer)
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [modalSize, setModalSize] = useState({ width: 380, height: 280 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Plugin setup - matching SubjectViewer for full functionality
  const bookmarkPluginInstance = bookmarkPlugin();
  const searchPluginInstance = searchPlugin();
  const zoomPluginInstance = zoomPlugin();
  
  // Page navigation plugin with page change tracking
  const pageNavigationPluginInstance = pageNavigationPlugin({
    enableShortcuts: true,
  });

  const highlightPluginInstance = highlightPlugin();

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnail tab
      defaultTabs[1], // Bookmark tab
      defaultTabs[2], // Attachment tab
    ],
  });

  useEffect(() => {
    if (!book || !pdfUrl) {
      setError('Book data not found. Please go back to the library.');
      setLoading(false);
      return;
    }
    
    setLoading(false);
  }, [book, pdfUrl]);

  const handleDocumentLoad = (e: any) => {
    setTotalPages(e.doc.numPages);
    setLoading(false);
    console.log('📄 Document loaded with', e.doc.numPages, 'pages');
  };

  const handlePageChange = (e: any) => {
    setCurrentPage(e.currentPage + 1);
    console.log('📄 Page changed to:', e.currentPage + 1);
  };

  // ================= MODAL DRAGGING AND RESIZING FUNCTIONS =================
  
  // Floating modal drag handlers - matching SubjectViewer
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

  // ================= NOTES FUNCTIONS (matching SubjectViewer) =================
  
  // Open notes modal
  const handleNotesClick = () => {
    setExistingNote(null);
    setNoteText('');
    setNoteTitle(`Notes - ${book?.title} (Page ${currentPage})`);
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
    if (!noteText.trim() || !currentUser || !book) return;
    
    try {
      console.log('🔧 Saving note with data:', {
        title: noteTitle || `Notes - ${book.title} (Page ${currentPage})`,
        content: noteText,
        pdfId: book._id,
        userId: currentUser.id,
        pageNumber: currentPage,
        tags: [book.subject || 'Library'],
        isPublic: false
      });

      const noteData = {
        userId: currentUser.id,
        title: noteTitle || `Notes - ${book.title} (Page ${currentPage})`,
        content: noteText,
        context: 'general' as const,
        referenceId: book._id,
        referenceType: 'reference_book',
        referenceTitle: book.title,
        pageNumber: currentPage,
        tags: [book.subject || 'Library']
      };

      const savedNote = await apiService.createNote(noteData);
      
      if (savedNote) {
        // Show success message and close modal
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
        handleNotesModalClose();
        
        // Trigger refresh in other components (like MyRack)
        console.log('📝 BookReader: Note saved successfully, triggering refresh...');
        triggerRefresh();
        
        console.log('✅ Note saved successfully:', savedNote);
      }
    } catch (err) {
      console.error('❌ Error saving note:', err);
      alert('Failed to save note. Please try again.');
    }
  };

  // Check if book is saved and handle save/unsave
  useEffect(() => {
    const checkIfBookSaved = async () => {
      if (!currentUser || !book) return;
      
      try {
        const savedBooks = await apiService.getSavedMaterials(currentUser.id);
        const isAlreadySaved = savedBooks.some((savedBook: any) => savedBook.materialId === book._id);
        setIsBookSaved(isAlreadySaved);
      } catch (error) {
        console.error('❌ Error checking if book is saved:', error);
      }
    };

    checkIfBookSaved();
  }, [currentUser, book]);

  // Save/Unsave book functionality
  const handleSaveBook = async () => {
    if (!currentUser || !book) {
      alert('Please sign in to save books');
      return;
    }

    try {
      if (isBookSaved) {
        // Unsave book
        await apiService.unsaveMaterial(book._id, currentUser.id);
        setIsBookSaved(false);
        alert('Book removed from saved files');
      } else {
        // Save book
        const savedBookData = {
          userId: currentUser.id,
          materialId: book._id,
          materialType: 'reference_book',
          title: book.title,
          subject: book.subject,
          fileName: book.fileName,
          gridFSFileId: book.gridFSFileId,
          description: book.description,
          author: book.author,
          pages: book.pages
        };
        
        await apiService.saveMaterial(savedBookData);
        setIsBookSaved(true);
        alert('Book saved to My Rack!');
      }
    } catch (error) {
      console.error('❌ Error saving/unsaving book:', error);
      alert('Failed to save book. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Book Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested book could not be loaded.'}</p>
          <button 
            onClick={() => navigate('/library')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout showNavigation={true}>
      <div className="h-screen bg-gray-50 flex flex-col"
        style={{ 
          height: 'calc(100vh - 64px)', // Account for navigation bar height
          marginTop: '-16px' // Offset Layout's pt-4
        }}
      >
      <FloatingWorkspaceButton
        content={{
          id: book._id,
          title: book.title,
          type: 'book' as const,
          url: pdfUrl,
          currentPage: currentPage,
          progress: Math.round((currentPage / (totalPages || 1)) * 100)
        }}
      />

      {/* Header - matching SubjectViewer */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/library')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Library"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-96">{book.title}</h1>
            <p className="text-sm text-gray-600">by {book.author} • Page {currentPage} of {totalPages}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Control Panel - matching SubjectViewer */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
            {/* Save Book Button */}
            <button
              onClick={handleSaveBook}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isBookSaved
                  ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              title={isBookSaved ? "Remove from saved files" : "Save to My Rack"}
            >
              <Save className="w-4 h-4 mr-2" />
              {isBookSaved ? 'Saved' : 'Save'}
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
                window.open(pdfUrl, '_blank');
              }}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-all"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </button>

            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = book.fileName;
                link.click();
              }}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-all"
              title="Download PDF"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>

            {/* Save/Unsave Book Button */}
            <button
              onClick={handleSaveBook}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isBookSaved
                  ? 'bg-red-600 text-white border border-red-600 hover:bg-red-700'
                  : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
              }`}
              title={isBookSaved ? 'Remove from Saved' : 'Save to My Rack'}
            >
              <Save className="w-4 h-4 mr-2" />
              {isBookSaved ? 'Saved' : 'Save Book'}
            </button>
          </div>
        </div>
      </header>

      {/* PDF Viewer - Full functionality like SubjectViewer */}
      <div className="flex-1 bg-gray-100 relative overflow-hidden">
        <Worker workerUrl={pdfWorkerUrl}>
          <div style={{ height: '100%', width: '100%' }} className="relative">
            <Viewer
              fileUrl={pdfUrl}
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
              onDocumentLoad={handleDocumentLoad}
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

      {/* Floating Notes Modal - exactly matching SubjectViewer */}
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
              {/* Book Info */}
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="truncate">{book?.title}</span>
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
    </Layout>
  );
};

export default BookReader;

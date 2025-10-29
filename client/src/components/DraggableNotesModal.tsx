import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { X, Save, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import 'react-resizable/css/styles.css';

interface DraggableNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string, title?: string) => Promise<void>;
  initialNote?: string;
  initialTitle?: string;
  pdfTitle?: string;
  pageNumber?: number;
}

const DraggableNotesModal: React.FC<DraggableNotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote = '',
  initialTitle = '',
  pdfTitle = '',
  pageNumber = 1
}) => {
  const [note, setNote] = useState(initialNote);
  const [title, setTitle] = useState(initialTitle || `Notes - ${pdfTitle} (Page ${pageNumber})`);
  const [isMaximized, setIsMaximized] = useState(false);
  const [lastSize, setLastSize] = useState({ width: 400, height: 500 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const nodeRef = useRef(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize position to center of screen when opening
  useEffect(() => {
    if (isOpen && !isMaximized) {
      const centerX = (window.innerWidth - 400) / 2;
      const centerY = (window.innerHeight - 500) / 2;
      setLastPosition({ x: centerX, y: centerY });
    }
  }, [isOpen]);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!note.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(note, title);
      setNote('');
      setTitle(`Notes - ${pdfTitle} (Page ${pageNumber})`);
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNote(initialNote);
    setTitle(initialTitle || `Notes - ${pdfTitle} (Page ${pageNumber})`);
    onClose();
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleDrag = (e: any, data: any) => {
    if (!isMaximized) {
      setLastPosition({ x: data.x, y: data.y });
    }
  };

  const handleResize = (e: any, { size }: any) => {
    if (!isMaximized) {
      setLastSize({ width: size.width, height: size.height });
    }
  };

  if (!isOpen) return null;

  // Create a portal to render the modal outside the PDF viewer container
  const modalContent = (
    <div className="notes-modal-container">
      <div className="bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-move">
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 truncate">Add Note</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMaximize}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Note Textarea */}
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your note here... 

💡 This modal can be:
• Dragged around by clicking the header
• Resized by dragging the corners/edges  
• Maximized/minimized using the buttons
• Used while still interacting with the PDF behind it

Your notes are automatically saved to your MyRack section!"
            className="flex-1 w-full p-3 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minHeight: isMaximized ? 'calc(100vh - 200px)' : '200px' }}
          />

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {pdfTitle && `${pdfTitle} - Page ${pageNumber}`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!note.trim() || isSaving}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                {isSaving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMaximized) {
    return createPortal(
      <div 
        className="fixed inset-4 notes-modal-overlay" 
        style={{ zIndex: 99999 }}
      >
        {modalContent}
      </div>,
      document.body
    );
  }

  return createPortal(
    <Draggable
      nodeRef={nodeRef}
      handle=".cursor-move"
      position={lastPosition}
      onDrag={handleDrag}
      bounds="parent"
    >
      <div 
        ref={nodeRef} 
        className="fixed notes-modal-overlay" 
        style={{ left: 0, top: 0, zIndex: 99999 }}
      >
        <ResizableBox
          width={lastSize.width}
          height={lastSize.height}
          minConstraints={[300, 400]}
          maxConstraints={[800, 800]}
          onResize={handleResize}
          resizeHandles={['se', 'e', 's', 'w', 'n', 'ne', 'nw', 'sw']}
          className="relative"
        >
          {modalContent}
        </ResizableBox>
      </div>
    </Draggable>,
    document.body
  );
};

export default DraggableNotesModal;

import { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FloatingWindow Component
 * 
 * Reusable floating window container with:
 * - Draggable header
 * - Minimize/maximize/close controls
 * - Position persistence (localStorage)
 * - Z-index management (always on top)
 * - Responsive (full-screen on mobile)
 * 
 * Agent: CLAUDE-4.5
 * Created: 2026-01-09
 */

export const FloatingWindow = ({
  type,
  title,
  onClose,
  children,
  defaultSize = { width: 800, height: 600 }
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(defaultSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const windowRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartWindowPos = useRef({ x: 0, y: 0 });

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load position from localStorage on mount
  useEffect(() => {
    const storageKey = `floatingWindow_${type}_pos`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const { x, y, width, height } = JSON.parse(saved);
        setPosition({ x, y });
        setSize({ width, height });
      } catch (err) {
        console.warn('Failed to parse saved window position:', err);
        centerWindow();
      }
    } else {
      centerWindow();
    }
  }, [type]);

  // Center window on screen
  const centerWindow = () => {
    const x = (window.innerWidth - defaultSize.width) / 2;
    const y = (window.innerHeight - defaultSize.height) / 2;
    setPosition({ x: Math.max(0, x), y: Math.max(0, y) });
  };

  // Save position to localStorage
  const savePosition = (pos, sz) => {
    const storageKey = `floatingWindow_${type}_pos`;
    localStorage.setItem(storageKey, JSON.stringify({
      x: pos.x,
      y: pos.y,
      width: sz.width,
      height: sz.height
    }));
  };

  // Handle drag start
  const handleDragStart = (e) => {
    if (isMaximized || isMinimized) return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartWindowPos.current = { ...position };
    
    e.preventDefault();
  };

  // Handle drag move
  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      const newX = dragStartWindowPos.current.x + deltaX;
      const newY = dragStartWindowPos.current.y + deltaY;
      
      // Keep window within viewport bounds
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: boundedX, y: boundedY });
    };

    const handleDragEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position, size);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, position, size]);

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle maximize
  const handleMaximize = () => {
    if (isMaximized) {
      // Restore to previous position
      setIsMaximized(false);
    } else {
      // Maximize with margins
      setIsMaximized(true);
    }
  };

  // Handle close
  const handleClose = () => {
    savePosition(position, size);
    onClose();
  };

  // Mobile: render as full-screen modal
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col"
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </motion.div>
    );
  }

  // Minimized state: show as tab in bottom-right
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-[9999]"
      >
        <button
          onClick={handleMinimize}
          className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl hover:border-cyan-500/50 transition group"
        >
          <Square className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">{title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="p-1 text-slate-400 hover:text-white transition rounded opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </button>
      </motion.div>
    );
  }

  // Calculate window styles
  const windowStyle = isMaximized
    ? {
        left: '16px',
        top: '16px',
        right: '16px',
        bottom: '16px',
        width: 'auto',
        height: 'auto'
      }
    : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      };

  return (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={windowStyle}
      className="fixed z-[9999] bg-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header - Draggable */}
      <div
        onMouseDown={handleDragStart}
        className={`flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/50 ${
          !isMaximized && !isMinimized ? 'cursor-move' : ''
        } select-none`}
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        
        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleMaximize}
            className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-red-400 transition rounded-lg hover:bg-slate-800"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

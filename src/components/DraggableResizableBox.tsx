
import React, { useState, useRef, useEffect } from 'react';
import { Move, Maximize } from 'lucide-react';
import { useObsConfig } from '@/contexts/ObsConfigContext';

interface DraggableResizableBoxProps {
  children: React.ReactNode;
  className?: string;
}

const DraggableResizableBox: React.FC<DraggableResizableBoxProps> = ({ 
  children,
  className = ""
}) => {
  const { obsConfig, setObsConfig } = useObsConfig();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && obsConfig.isDraggable) {
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        
        setObsConfig(prev => ({
          ...prev,
          position: {
            x: prev.position.x + deltaX,
            y: prev.position.y + deltaY
          }
        }));
        
        setDragStartPos({ x: e.clientX, y: e.clientY });
      } else if (isResizing && obsConfig.isDraggable) {
        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;
        
        setObsConfig(prev => ({
          ...prev,
          size: {
            width: Math.max(200, resizeStartSize.width + deltaX),
            height: resizeStartSize.height !== 'auto' ? 
              Math.max(100, resizeStartSize.height + deltaY) : 
              'auto'
          }
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStartPos, resizeStartPos, resizeStartSize, obsConfig.isDraggable, setObsConfig]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!obsConfig.isDraggable) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!obsConfig.isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    
    if (boxRef.current) {
      setResizeStartSize({ 
        width: boxRef.current.offsetWidth,
        height: boxRef.current.offsetHeight !== 'auto' ? boxRef.current.offsetHeight : 'auto'
      });
    }
  };

  return (
    <div
      ref={boxRef}
      className={`${className} relative ${obsConfig.showBorder ? 'border-2 border-blue-500' : ''}`}
      style={{
        position: 'absolute',
        left: `${obsConfig.position.x}px`,
        top: `${obsConfig.position.y}px`,
        width: typeof obsConfig.size.width === 'number' ? `${obsConfig.size.width}px` : obsConfig.size.width,
        height: typeof obsConfig.size.height === 'number' ? `${obsConfig.size.height}px` : obsConfig.size.height,
        cursor: obsConfig.isDraggable ? 'move' : 'default',
        transition: 'border 0.3s ease'
      }}
      onMouseDown={handleDragStart}
    >
      {children}
      
      {obsConfig.isDraggable && (
        <>
          <div 
            className="absolute top-0 right-0 bg-blue-500 text-white p-1 rounded-bl-md cursor-pointer"
            onClick={handleResizeStart}
          >
            <Maximize size={16} />
          </div>
          
          <div 
            className="absolute right-0 bottom-0 w-6 h-6 cursor-se-resize"
            onMouseDown={handleResizeStart}
            style={{
              background: 'transparent',
              zIndex: 20
            }}
          />
        </>
      )}
    </div>
  );
};

export default DraggableResizableBox;


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

  // Log config when component mounts and when it changes
  useEffect(() => {
    console.log("DraggableBox mounted/updated with config:", obsConfig);
    
    // Force a re-render to ensure the position is applied correctly
    // This helps with OBS browser source rendering
    const timer = setTimeout(() => {
      if (boxRef.current) {
        console.log("Applying position:", obsConfig.position);
        boxRef.current.style.left = `${obsConfig.position.x}px`;
        boxRef.current.style.top = `${obsConfig.position.y}px`;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [obsConfig]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && obsConfig.isDraggable) {
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        
        // Update position in context
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
            height: prev.size.height === 'auto' ? 
              'auto' : 
              Math.max(100, (resizeStartSize.height as number) + deltaY)
          }
        }));
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        // Save the final position to localStorage immediately
        localStorage.setItem('ankitObsConfig', JSON.stringify(obsConfig));
        console.log("Position saved after drag/resize:", obsConfig.position);
      }
      
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
    console.log("Starting drag from position:", obsConfig.position);
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
        height: obsConfig.size.height === 'auto' ? 0 : boxRef.current.offsetHeight
      });
    }
  };

  // This will add a very visible outline when edit mode is on, even if not actively dragging
  const borderStyle = obsConfig.showBorder 
    ? 'border-4 border-blue-500 shadow-lg shadow-blue-500/50' 
    : '';

  return (
    <div
      ref={boxRef}
      className={`${className} relative ${borderStyle}`}
      style={{
        position: 'absolute',
        left: `${obsConfig.position.x}px`,
        top: `${obsConfig.position.y}px`,
        width: typeof obsConfig.size.width === 'number' ? `${obsConfig.size.width}px` : obsConfig.size.width,
        height: typeof obsConfig.size.height === 'number' ? `${obsConfig.size.height}px` : obsConfig.size.height,
        cursor: obsConfig.isDraggable ? 'move' : 'default',
        transition: 'border 0.3s ease',
        padding: obsConfig.showBorder ? '8px' : '0',
        zIndex: 1000
      }}
      onMouseDown={handleDragStart}
    >
      {children}
      
      {obsConfig.isDraggable && (
        <>
          <div 
            className="absolute top-0 left-0 bg-blue-600 text-white p-2 rounded-br-md font-bold z-20"
          >
            <span className="flex items-center gap-2">
              <Move size={16} />
              EDIT MODE ON
            </span>
          </div>
          
          <div 
            className="absolute top-0 right-0 bg-blue-600 text-white p-2 rounded-bl-md cursor-pointer z-20"
            onClick={handleResizeStart}
          >
            <Maximize size={16} />
          </div>
          
          <div 
            className="absolute right-0 bottom-0 w-8 h-8 cursor-se-resize bg-blue-600 rounded-tl-md flex items-center justify-center"
            onMouseDown={handleResizeStart}
            style={{
              zIndex: 20
            }}
          >
            <Maximize size={16} className="text-white" />
          </div>
        </>
      )}
    </div>
  );
};

export default DraggableResizableBox;


import React, { useState, useEffect, useRef } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Move, Resize, Square } from "lucide-react";

interface Position {
  x: number;
  y: number;
}

interface DraggableResizableBoxProps {
  children: React.ReactNode;
  showBorder: boolean;
  isDraggable: boolean;
  isResizable: boolean;
}

const DraggableResizableBox: React.FC<DraggableResizableBoxProps> = ({
  children,
  showBorder,
  isDraggable,
  isResizable,
}) => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const savedX = localStorage.getItem("obsBoxPositionX");
    const savedY = localStorage.getItem("obsBoxPositionY");
    
    if (savedX && savedY) {
      setPosition({
        x: parseInt(savedX),
        y: parseInt(savedY),
      });
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("obsBoxPositionX", position.x.toString());
    localStorage.setItem("obsBoxPositionY", position.y.toString());
  }, [position]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    
    setIsDragging(true);
    
    // Calculate the offset between mouse position and element position
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isDraggable) return;
    
    // Set new position based on mouse position minus the offset
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.userSelect = "";
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDraggable) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isDraggable, dragOffset]);

  // Define the container style
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    cursor: isDraggable ? "move" : "default",
    border: showBorder ? "2px solid rgba(255, 255, 255, 0.5)" : "none",
    borderRadius: "8px",
    zIndex: 1000,
  };

  if (isResizable) {
    return (
      <div 
        ref={boxRef}
        style={containerStyle}
        onMouseDown={handleMouseDown}
      >
        <ResizablePanelGroup direction="horizontal" className="min-w-[200px]">
          <ResizablePanel>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={100}>
                {children}
              </ResizablePanel>
              {showBorder && (
                <div className="absolute bottom-0 right-0 flex items-center gap-2 p-1 bg-black/20 rounded-tl-lg">
                  {isDraggable && <Move size={14} className="text-white/70" />}
                  {isResizable && <Resize size={14} className="text-white/70" />}
                </div>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  return (
    <div 
      ref={boxRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
    >
      {children}
      {showBorder && (
        <div className="absolute bottom-0 right-0 flex items-center gap-2 p-1 bg-black/20 rounded-tl-lg">
          {isDraggable && <Move size={14} className="text-white/70" />}
        </div>
      )}
    </div>
  );
};

export default DraggableResizableBox;

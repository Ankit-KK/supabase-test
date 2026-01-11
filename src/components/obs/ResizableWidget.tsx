import React, { useState, useEffect, useRef, useCallback } from "react";

export interface WidgetState {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizableWidgetProps {
  id: string;
  storagePrefix: string;
  children: React.ReactNode;
  defaultState?: WidgetState;
}

export const ResizableWidget: React.FC<ResizableWidgetProps> = ({
  id,
  storagePrefix,
  children,
  defaultState = { x: 50, y: 50, width: 400, height: 120 },
}) => {
  const [state, setState] = useState<WidgetState>(() => {
    const saved = localStorage.getItem(`${storagePrefix}-widget-${id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startState: WidgetState } | null>(null);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}-widget-${id}`, JSON.stringify(state));
  }, [id, storagePrefix, state]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startState: { ...state },
    };
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeCorner(corner);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startState: { ...state },
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      if (isDragging) {
        setState((prev) => ({
          ...prev,
          x: dragRef.current!.startState.x + deltaX,
          y: dragRef.current!.startState.y + deltaY,
        }));
      } else if (isResizing && resizeCorner) {
        const { startState } = dragRef.current;
        let newState = { ...startState };

        if (resizeCorner.includes("e")) {
          newState.width = Math.max(200, startState.width + deltaX);
        }
        if (resizeCorner.includes("w")) {
          const newWidth = Math.max(200, startState.width - deltaX);
          newState.width = newWidth;
          newState.x = startState.x + (startState.width - newWidth);
        }
        if (resizeCorner.includes("s")) {
          newState.height = Math.max(80, startState.height + deltaY);
        }
        if (resizeCorner.includes("n")) {
          const newHeight = Math.max(80, startState.height - deltaY);
          newState.height = newHeight;
          newState.y = startState.y + (startState.height - newHeight);
        }

        setState(newState);
      }
    },
    [isDragging, isResizing, resizeCorner],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeCorner(null);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      style={{
        position: "absolute",
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        userSelect: "none",
        zIndex: isDragging || isResizing ? 1000 : 1,
      }}
    >
      {/* Main draggable area */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {children}
      </div>

      {/* Edge resize handles */}
      <div
        style={{ position: "absolute", top: 0, left: 16, right: 16, height: 8, cursor: "ns-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "n")}
      />
      <div
        style={{ position: "absolute", bottom: 0, left: 16, right: 16, height: 8, cursor: "ns-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "s")}
      />
      <div
        style={{ position: "absolute", left: 0, top: 16, bottom: 16, width: 8, cursor: "ew-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "w")}
      />
      <div
        style={{ position: "absolute", right: 0, top: 16, bottom: 16, width: 8, cursor: "ew-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "e")}
      />

      {/* Corner resize handles */}
      <div
        style={{ position: "absolute", top: 0, left: 0, width: 16, height: 16, cursor: "nw-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "nw")}
      />
      <div
        style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, cursor: "ne-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "ne")}
      />
      <div
        style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16, cursor: "sw-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "sw")}
      />
      <div
        style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, cursor: "se-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "se")}
      />
    </div>
  );
};

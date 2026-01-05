import React, { useState, useEffect, useRef } from 'react';

interface DraggableCardProps {
  children: React.ReactNode;
  initialX: number;
  initialY: number;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ children, initialX, initialY }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
        // Calculate offset from the top-left of the card
        const rect = cardRef.current.getBoundingClientRect();
        setOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - offset.x,
          y: e.clientY - offset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset]);

  return (
    <div 
      ref={cardRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 50 : 20,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none' // Prevent scrolling while dragging on touch
      }}
      className="active:scale-[1.02] transition-transform duration-75"
    >
      {children}
    </div>
  );
};

export default DraggableCard;
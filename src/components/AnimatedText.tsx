
import React, { useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const textArray = text.split("");

  return (
    <h1 
      className={`text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`word relative inline-flex transition-all duration-500 ${isHovered ? "scale-105" : ""}`}
      >
        {textArray.map((char, index) => (
          <div 
            key={index} 
            className="hover relative flex-1 h-[calc(100vh-10em)]"
            style={{ height: 'auto' }}
          >
            <div className="absolute inset-0 z-10"></div>
            <div className="absolute inset-0 z-10"></div>
            <span
              className="char absolute left-0 right-0 top-1/2 -mt-8 inline-block transition-all duration-500 bg-clip-text text-transparent bg-hero-gradient"
              style={{ 
                transitionDelay: `${index * 50}ms`,
                transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          </div>
        ))}
      </div>
    </h1>
  );
};

export default AnimatedText;

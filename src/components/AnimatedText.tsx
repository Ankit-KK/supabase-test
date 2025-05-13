
import React, { useEffect, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationIndex, setAnimationIndex] = useState(1);

  // Cycle through animation concepts every few seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAnimationIndex((prev) => (prev % 6) + 1);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  const textArray = text.split("");

  return (
    <h1 
      className={`text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className={`word relative inline-block transition-all duration-500 ${isHovered ? "scale-110" : ""}`}
      >
        {textArray.map((char, index) => (
          <span
            key={index}
            className={`char inline-block transition-all duration-500 bg-clip-text text-transparent bg-hero-gradient ${
              animationIndex === 1
                ? "hover:scale-150"
                : animationIndex === 2
                ? `${index % 2 === 0 ? "group-hover:translate-y-[-10px]" : "group-hover:translate-y-[10px]"}`
                : animationIndex === 3
                ? `hover:rotate-${(index % 3) * 5 - 5}`
                : animationIndex === 4
                ? "hover:tracking-wider"
                : animationIndex === 5
                ? "relative before:content-[attr(data-char)] before:absolute before:opacity-0 hover:before:opacity-80 before:top-0 hover:before:animate-fall"
                : ""
            }`}
            data-char={char}
            style={{ 
              transitionDelay: `${index * 50}ms`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    </h1>
  );
};

export default AnimatedText;

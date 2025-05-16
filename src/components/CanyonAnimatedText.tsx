
import React from "react";

interface CanyonAnimatedTextProps {
  text: string;
  className?: string;
}

const CanyonAnimatedText: React.FC<CanyonAnimatedTextProps> = ({ text, className = "" }) => {
  const letters = text.split("");

  return (
    <div className={`concept-three ${className}`}>
      <div className="word">
        {letters.map((letter, index) => (
          <div className="hover" key={index}>
            <div></div>
            <div></div>
            <h1>{letter === " " ? "\u00A0" : letter}</h1>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanyonAnimatedText;

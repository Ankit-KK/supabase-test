
import React from "react";

interface CanyonAnimatedTextProps {
  text: string;
  className?: string;
}

const CanyonAnimatedText: React.FC<CanyonAnimatedTextProps> = ({ text, className = "" }) => {
  const words = text.split(" ");

  return (
    <div className={`concept-three ${className}`}>
      <div className="word-container">
        {words.map((word, wordIndex) => (
          <div className="word" key={wordIndex}>
            {word.split("").map((letter, letterIndex) => (
              <div className="hover" key={`${wordIndex}-${letterIndex}`}>
                <div></div>
                <div></div>
                <h1>{letter}</h1>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanyonAnimatedText;

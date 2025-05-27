"use client";

import { useEffect, useRef, useState } from "react";

export function ImageCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Change slide every 3 seconds
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [images.length]);

  return (
    <div className="relative w-full h-auto">
      {/* Slideshow container */}
      <div className="w-full relative overflow-hidden rounded-lg">
        {images.map((image, index) => (
          <div
            key={index}
            className={`w-full transition-opacity duration-1000 ${
              index === currentIndex
                ? "opacity-100 z-10 relative"
                : "opacity-0 z-0 absolute top-0 left-0"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full max-w-full h-auto object-contain rounded-lg shadow-lg mx-auto"
            />
          </div>
        ))}
      </div>

      {/* Optional indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? "bg-white" : "bg-white/50"
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}


import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const images = [
  {
    src: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80",
    alt: "A woman sitting on a bed using a laptop"
  },
  {
    src: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
    alt: "Turned on gray laptop computer"
  },
  {
    src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    alt: "Woman in white long sleeve shirt using black laptop computer"
  },
  {
    src: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    alt: "Matrix movie still"
  },
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    alt: "Body of water surrounded by trees"
  },
];

const ChiaaGaming = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 mb-6">
          Chiaa Gaming Moments
        </h1>
        <p className="max-w-2xl mx-auto text-center text-lg text-muted-foreground mb-10">
          Explore some highlights from the Chiaa Gaming community! Whether streaming epic gameplay or connecting with fans, Chiaa Gaming brings the best in creator energy.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {images.map((img, i) => (
            <div
              key={i}
              className="rounded-lg shadow-md bg-white/80 border overflow-hidden flex flex-col hover:scale-105 hover:shadow-xl transition-all"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
              <div className="p-3 text-sm text-center text-muted-foreground">{img.alt}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href="https://www.youtube.com/@chiaagaming"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#fa1d78] hover:bg-[#c60c5d] text-white font-semibold shadow-lg transition"
          >
            Visit Chiaa Gaming on YouTube
            <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
              <path d="M2 12.42v-.84c0-2.27 0-3.4.44-4.28a4 4 0 0 1 1.88-1.88C5.2 5 6.33 5 8.6 5h6.8c2.27 0 3.4 0 4.28.44a4 4 0 0 1 1.88 1.88C22 8.18 22 9.3 22 11.58v.84c0 2.27 0 3.4-.44 4.28a4 4 0 0 1-1.88 1.88C20.8 19 19.67 19 17.4 19H10.6c-2.27 0-3.4 0-4.28-.44A4 4 0 0 1 4.44 16.7C4 15.82 4 14.69 4 12.42Z"/>
              <path d="m10 9.5 5 2.5-5 2.5v-5Z"/>
            </svg>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChiaaGaming;

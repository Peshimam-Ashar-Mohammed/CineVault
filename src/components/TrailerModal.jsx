import { useEffect, useCallback } from "react";

export default function TrailerModal({ videoKey, title, onClose }) {
  const handleEscape = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [handleEscape]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 animate-[pageIn_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-5xl aspect-video"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
          title={title || "Trailer"}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="w-full h-full rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-gray-400 hover:text-white transition-colors p-2"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

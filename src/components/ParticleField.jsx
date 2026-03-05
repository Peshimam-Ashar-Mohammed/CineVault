import { useMemo } from "react";

/**
 * Floating particle field rendered once behind content.
 * Pure CSS animations — zero JS runtime cost.
 */
export default function ParticleField({ count = 10 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 15,
        opacity: Math.random() * 0.5 + 0.1,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
      {/* Ambient blobs — smaller for performance */}
      <div
        className="ambient-blob"
        style={{ width: 300, height: 300, top: "10%", left: "-10%", background: "#e50914" }}
      />
      <div
        className="ambient-blob"
        style={{ width: 250, height: 250, bottom: "5%", right: "-5%", background: "#1d4ed8", animationDelay: "5s" }}
      />
    </div>
  );
}

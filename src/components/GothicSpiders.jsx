import React from 'react';

const SpiderSVG = ({ size = 36 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="spider-svg"
  >
    {/* Abdomen */}
    <ellipse cx="50" cy="65" rx="18" ry="24" />
    {/* Cephalothorax */}
    <circle cx="50" cy="38" r="12" />
    {/* Head/Chelicerae */}
    <circle cx="46" cy="24" r="3" />
    <circle cx="54" cy="24" r="3" />

    {/* Spider Legs - Left */}
    <path d="M 42 34 Q 20 15 10 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M 40 38 Q 15 28 8 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M 40 42 Q 18 55 12 72" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M 42 46 Q 24 75 20 90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />

    {/* Spider Legs - Right */}
    <path d="M 58 34 Q 80 15 90 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M 60 38 Q 85 28 92 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M 60 42 Q 82 55 88 72" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M 58 46 Q 76 75 80 90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const GothicSpiders = () => {
  return (
    <div className="gothic-spiders-container" aria-hidden="true">
      {/* All Spiders use Glowing Silver/White Styling */}

      {/* Spider 1 — Extra Large (Left 3%) */}
      <div className="spider-thread thread-1">
        <div className="silk-line" />
        <div className="spider-body spider-glow-silver">
          <SpiderSVG size={64} />
        </div>
      </div>

      {/* Spider 2 — Medium (Left 12%) */}
      <div className="spider-thread thread-2">
        <div className="silk-line" />
        <div className="spider-body spider-glow-silver">
          <SpiderSVG size={44} />
        </div>
      </div>

      {/* Spider 3 — Large (Right 4%) */}
      <div className="spider-thread thread-3">
        <div className="silk-line" />
        <div className="spider-body spider-glow-silver">
          <SpiderSVG size={52} />
        </div>
      </div>

      {/* Spider 4 — Medium (Right 15%) */}
      <div className="spider-thread thread-4">
        <div className="silk-line" />
        <div className="spider-body spider-glow-silver">
          <SpiderSVG size={36} />
        </div>
      </div>

      {/* Spider 5 — Small (Center-Left 24%) */}
      <div className="spider-thread thread-5">
        <div className="silk-line" />
        <div className="spider-body spider-glow-silver">
          <SpiderSVG size={28} />
        </div>
      </div>
    </div>
  );
};

export default GothicSpiders;

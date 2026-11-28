import React, { useEffect, useState, useRef } from 'react';

const SnakeCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [clicks, setClicks] = useState([]);

  // Trailing snake segments count
  const NUM_SEGMENTS = 10;
  
  // Ref to hold position of each snake segment
  const segmentsRef = useRef(
    Array.from({ length: NUM_SEGMENTS }, () => ({ x: -100, y: -100 }))
  );
  const targetPosRef = useRef({ x: -100, y: -100 });
  const animFrameIdRef = useRef(null);

  // Canvas ref for drawing the organic fluid snake body trail
  const canvasRef = useRef(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive element
      const target = e.target;
      if (target) {
        const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer');
        setIsPointer(!!isInteractive);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleClick = (e) => {
      const newClick = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };
      setClicks((prev) => [...prev.slice(-4), newClick]);

      // Remove after animation completes
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      }, 700);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Smooth animation loop using physics lerp
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const segments = segmentsRef.current;
      const target = targetPosRef.current;

      // Head follows cursor smoothly
      segments[0].x += (target.x - segments[0].x) * 0.42;
      segments[0].y += (target.y - segments[0].y) * 0.42;

      // Body segments follow each other like a fluid snake
      for (let i = 1; i < NUM_SEGMENTS; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];
        
        // Elastic spring interpolation
        const speed = 0.38 - (i * 0.015);
        curr.x += (prev.x - curr.x) * speed;
        curr.y += (prev.y - curr.y) * speed;
      }

      // Draw glowing connective snake line if visible
      if (isVisible && segments[0].x > 0) {
        // Draw fluid tapered spline line
        ctx.beginPath();
        ctx.moveTo(segments[0].x, segments[0].y);
        for (let i = 1; i < NUM_SEGMENTS - 1; i++) {
          const xc = (segments[i].x + segments[i + 1].x) / 2;
          const yc = (segments[i].y + segments[i + 1].y) / 2;
          ctx.quadraticCurveTo(segments[i].x, segments[i].y, xc, yc);
        }
        ctx.lineTo(segments[NUM_SEGMENTS - 1].x, segments[NUM_SEGMENTS - 1].y);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.lineWidth = isPointer ? 4 : 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Draw individual snake vertebrae with radiant glowing discs
        for (let i = NUM_SEGMENTS - 1; i >= 0; i--) {
          const seg = segments[i];
          const progress = 1 - i / NUM_SEGMENTS; // 1 at head, 0 at tail
          const radius = (isPointer ? 4.5 : 3.5) * progress + 1.2;
          const alpha = 0.85 * progress + 0.15;

          ctx.beginPath();
          ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
          
          if (i === 0) {
            // Radiant Head
            ctx.fillStyle = isPointer ? '#34d399' : '#10b981';
            ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
            ctx.shadowBlur = isPointer ? 16 : 10;
          } else if (i < 4) {
            // Upper Torso (Teal glow)
            ctx.fillStyle = `rgba(45, 212, 191, ${alpha})`;
            ctx.shadowColor = 'rgba(45, 212, 191, 0.4)';
            ctx.shadowBlur = 6;
          } else {
            // Tail (Cyan fade)
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.7})`;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isVisible, isPointer]);

  return (
    <>
      {/* Snake Canvas Canvas (Pointer-events none, 0 performance impact on clicks) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      />

      {/* Ripple Click Explosion Shockwaves */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {clicks.map((click) => (
          <React.Fragment key={click.id}>
            {/* Primary expanding emerald shockwave */}
            <span
              className="absolute rounded-full border-2 border-emerald-400 pointer-events-none animate-ping"
              style={{
                left: click.x,
                top: click.y,
                width: 32,
                height: 32,
                transform: 'translate(-50%, -50%)',
                animationDuration: '600ms',
              }}
            />
            {/* Secondary radiant glow halo */}
            <span
              className="absolute rounded-full bg-gradient-to-r from-emerald-500/40 via-teal-400/30 to-cyan-500/20 blur-sm pointer-events-none"
              style={{
                left: click.x,
                top: click.y,
                width: 48,
                height: 48,
                transform: 'translate(-50%, -50%) scale(1.6)',
                transition: 'all 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: 0,
              }}
            />
            {/* Micro-sparkle particle bursts (4 cardinal directions) */}
            {[0, 90, 180, 270].map((deg) => (
              <span
                key={deg}
                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300 pointer-events-none"
                style={{
                  left: click.x,
                  top: click.y,
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translateX(24px)`,
                  transition: 'all 450ms cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: 0,
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default SnakeCursor;

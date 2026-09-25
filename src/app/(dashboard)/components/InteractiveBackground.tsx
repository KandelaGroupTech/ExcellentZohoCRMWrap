'use client';
import { useEffect, useRef } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number;
    let height: number;
    let dots: { x: number, y: number, baseSize: number }[] = [];
    
    // Config matches the original script
    const spacing = 40;
    const dotRadius = 1.5;
    const baseColor = 'rgba(0, 0, 0, 0.05)';
    const interactionRadius = 150;
    
    let mouse = { x: -1000, y: -1000 };
    
    function init() {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        
        dots = [];
        for (let x = 0; x < width; x += spacing) {
            for (let y = 0; y < height; y += spacing) {
                dots.push({ x, y, baseSize: dotRadius });
            }
        }
    }
    
    function handleResize() {
        init();
    }
    
    function handleMouseMove(e: MouseEvent) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }
    
    function handleMouseLeave() {
        mouse.x = -1000;
        mouse.y = -1000;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    let animationFrameId: number;

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        
        dots.forEach(dot => {
            const dx = mouse.x - dot.x;
            const dy = mouse.y - dot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            ctx.beginPath();
            
            if (dist < interactionRadius) {
                const intensity = 1 - (dist / interactionRadius);
                ctx.arc(dot.x, dot.y, dot.baseSize + (intensity * 2), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(211, 47, 47, ${0.1 + (intensity * 0.5)})`;
                
                if (dist < interactionRadius * 0.5) {
                    ctx.moveTo(dot.x, dot.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(211, 47, 47, ${intensity * 0.2})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    ctx.beginPath(); 
                }
            } else {
                ctx.arc(dot.x, dot.y, dot.baseSize, 0, Math.PI * 2);
                ctx.fillStyle = baseColor;
            }
            
            ctx.fill();
        });
        
        animationFrameId = requestAnimationFrame(draw);
    }
    
    init();
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[-1] bg-white w-full h-full" />;
}

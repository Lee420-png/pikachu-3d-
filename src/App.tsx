import React, { useState, useEffect, useRef, useCallback } from 'react';
import LightningShader from './components/LightningShader';
import ThreeBackground from './components/ThreeBackground';
import { playThunderSound } from './utils/audio';

function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    let intervalId: number;
    let currentIndex = 0;

    setDisplayed('');
    setDone(false);

    timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setDisplayed(text.slice(0, currentIndex + 1));
        currentIndex++;
        if (currentIndex === text.length) {
          clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

export default function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showPills, setShowPills] = useState(false);
  const [lastStrikeTime, setLastStrikeTime] = useState(-1.0);
  const [showStats, setShowStats] = useState(false);
  
  const typewriterText = "Pika-pi! Welcome to the world of Pokémon! Ready for an adventure?";
  const { displayed, done } = useTypewriter(typewriterText);

  const videoRef = useRef<HTMLVideoElement>(null);
  const prevX = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isSeeking = false;
    let pendingSeek = false;
    let target = video.currentTime || 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (video.duration) {
        // Map absolute mouse position across the screen to the video duration
        // This ensures Pikachu always looks exactly at the mouse pointer
        const percentage = e.clientX / window.innerWidth;
        
        // Use 1 - percentage because time=0 is looking right, and time=duration is looking left
        target = (1 - percentage) * video.duration;
        
        if (!isSeeking) {
          isSeeking = true;
          video.currentTime = target;
        } else {
          pendingSeek = true;
        }
      }
    };

    const handleSeeked = () => {
      if (pendingSeek) {
        pendingSeek = false;
        if (video) video.currentTime = target;
      } else {
        isSeeking = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowPills(true);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-yellow-400/30 overflow-x-hidden">
      <style>{`
        @keyframes electric-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
      
      {/* WebGL Thunder Effect */}
      <LightningShader lastStrikeTime={lastStrikeTime} />

      {/* Background Video */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        {/* Ambient Electric Glow */}
        <div 
          className="absolute inset-0 z-0 mix-blend-screen" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 75% 50%, rgba(250, 204, 21, 0.3) 0%, transparent 60%)',
            animation: 'electric-pulse 3s ease-in-out infinite' 
          }}
        />
        
        <video
          ref={videoRef}
          src="/pikachu.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center translate-x-[15%] lg:translate-x-[30%] mix-blend-lighten"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 100%)'
          }}
        />
        {/* Text Readability Gradient */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/50 to-transparent w-[90%] md:w-[70%]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 px-5 sm:px-8 py-4 sm:py-5 flex flex-row justify-between items-center">
        {/* Logo */}
        <div className="flex flex-row gap-3 items-center">
          <span 
            className="text-[21px] sm:text-[26px] tracking-tight text-white font-bold" 
          >
            PikaDex®
          </span>
          <span className="text-[25px] sm:text-[30px] text-yellow-400 select-none tracking-[-0.02em]">
            ⚡
          </span>
        </div>

        {/* Desktop Links - Removed */}
        <div className="hidden md:flex flex-row text-[23px] text-white">
        </div>

        {/* Desktop CTA */}
        <a 
          href="#" 
          className="hidden md:block text-[23px] text-yellow-400 underline underline-offset-2 hover:opacity-60 transition-opacity"
        >
          Catch 'em all
        </a>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden flex flex-col gap-[5px] z-50 p-2 -mr-2"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle navigation menu"
        >
          <div className={`w-6 h-[2px] bg-white transition-all duration-300 ${mobileNavOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <div className={`w-6 h-[2px] bg-white transition-opacity duration-300 ${mobileNavOpen ? 'opacity-0' : 'opacity-100'}`} />
          <div className={`w-6 h-[2px] bg-white transition-all duration-300 ${mobileNavOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </nav>

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/90 backdrop-blur-md z-40 flex flex-col justify-center px-8 gap-8 transition-opacity duration-300 md:hidden ${mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <a href="#" className="text-[32px] font-medium text-white hover:text-yellow-400 transition-colors">Pokédex</a>
        <a href="#" className="text-[32px] font-medium text-white hover:text-yellow-400 transition-colors">Gyms</a>
        <a href="#" className="text-[32px] font-medium text-white hover:text-yellow-400 transition-colors">Shop</a>
        <a href="#" className="text-[32px] font-medium text-yellow-400 underline underline-offset-2 hover:opacity-60 transition-colors">Catch 'em all</a>
      </div>

      {/* Hero Section */}
      <main className="relative z-20 h-screen w-full flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 pointer-events-none">
        <div className="max-w-xl relative z-30 pointer-events-auto">
          
          {/* Typewriter Text */}
          <p 
            className="text-white mb-5 sm:mb-6"
            style={{ 
              fontSize: 'clamp(18px, 4vw, 26px)', 
              lineHeight: 1.35, 
              fontWeight: 400,
              minHeight: '54px'
            }}
          >
            {displayed}
            {!done && (
              <span 
                className="inline-block w-[2px] h-[1.1em] bg-white align-middle ml-[2px]"
                style={{ animation: 'blink 1s step-end infinite' }}
              />
            )}
          </p>

          {/* Action Pills */}
          <div 
            className="flex flex-wrap gap-y-1 mb-12"
            style={{ 
              opacity: showPills ? 1 : 0, 
              transform: showPills ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease'
            }}
          >
            {["Use Thunderbolt", "Check Stats"].map((label, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  if (label === "Use Thunderbolt") {
                    setLastStrikeTime(Date.now());
                    playThunderSound();
                  } else if (label === "Check Stats") {
                    setShowStats(true);
                  }
                }}
                className={`inline-flex items-center justify-center rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap font-medium transition-all duration-200 active:scale-95 ${
                  label === "Use Thunderbolt" 
                    ? "bg-yellow-400 text-black border border-yellow-500 hover:bg-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
                    : "bg-transparent text-yellow-400 border border-yellow-400/50 hover:bg-yellow-400/10 backdrop-blur-md"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

        </div>
      </main>

      {/* Content Section 1: The Electric Core */}
      <section className="relative z-10 w-full min-h-screen bg-zinc-950 flex items-center justify-center border-t border-yellow-400/10 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-xs font-mono text-yellow-400 uppercase tracking-widest">Pokedex Data // 025</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              The Anatomy of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Thunder.</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
              Pikachu stores electricity in the electric sacs on its cheeks. When it releases pent-up energy in a burst, the electric power is equal to a lightning bolt. Its tail acts as a ground to safely discharge electricity.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
               <div>
                  <h4 className="text-sm text-gray-500 uppercase tracking-widest font-mono mb-2">Category</h4>
                  <p className="text-xl font-medium text-gray-200">Mouse Pokémon</p>
               </div>
               <div>
                  <h4 className="text-sm text-gray-500 uppercase tracking-widest font-mono mb-2">Abilities</h4>
                  <p className="text-xl font-medium text-gray-200">Static / Lightning Rod</p>
               </div>
            </div>
          </div>
          
          {/* 3D Canvas Container */}
          <div className="order-1 lg:order-2">
            <ThreeBackground />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 w-full bg-black py-8 border-t border-yellow-400/20 text-center">
        <p className="text-sm text-gray-600 font-mono tracking-widest uppercase">
          © 2026 PikaDex. Gotta catch 'em all.
        </p>
      </footer>

      {/* Pikachu Stats Card Modal */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          showStats ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowStats(false)}
      >
        <div 
          className={`bg-gray-900/90 border border-yellow-400/30 rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl transition-transform duration-500 ease-out ${
            showStats ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Pikachu</h2>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-bold uppercase tracking-wider">Electric</span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">Healthy</span>
              </div>
            </div>
            <span className="text-sm font-mono bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded-md border border-yellow-400/20">Lv. 25</span>
          </div>
          
          <div className="space-y-5">
            {/* HP Bar */}
            <div>
               <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
                 <span>HP</span>
                 <span>85/85</span>
               </div>
               <div className="w-full bg-gray-800 rounded-full h-2.5 shadow-inner">
                 <div className="bg-green-400 h-2.5 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]" style={{width: '100%'}}></div>
               </div>
            </div>

            {/* Evolution */}
            <div>
              <div className="text-xs text-gray-400 mb-2 font-mono uppercase tracking-wider">Evolution</div>
              <div className="flex items-center justify-between bg-gray-800/30 border border-gray-700/30 p-3 rounded-xl">
                 <div className="text-sm font-medium text-white flex items-center gap-2">
                   <span className="text-gray-500">→</span> Raichu
                 </div>
                 <div className="text-[10px] font-mono text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20 uppercase tracking-wider">Thunder Stone</div>
              </div>
            </div>

            {/* Attacks */}
            <div>
              <div className="text-xs text-gray-400 mb-2 font-mono uppercase tracking-wider">Moveset</div>
              <div className="grid grid-cols-2 gap-2.5">
                 <div className="bg-gray-800/50 border border-gray-700/50 p-2.5 rounded-xl text-center text-sm font-medium hover:border-yellow-400 hover:bg-yellow-400/10 transition-all cursor-pointer">Thunderbolt</div>
                 <div className="bg-gray-800/50 border border-gray-700/50 p-2.5 rounded-xl text-center text-sm font-medium hover:border-gray-400 hover:bg-gray-700/50 transition-all cursor-pointer">Quick Attack</div>
                 <div className="bg-gray-800/50 border border-gray-700/50 p-2.5 rounded-xl text-center text-sm font-medium hover:border-gray-400 hover:bg-gray-700/50 transition-all cursor-pointer">Iron Tail</div>
                 <div className="bg-gray-800/50 border border-gray-700/50 p-2.5 rounded-xl text-center text-sm font-medium hover:border-yellow-400 hover:bg-yellow-400/10 transition-all cursor-pointer">Electro Ball</div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowStats(false)} 
            className="mt-6 w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

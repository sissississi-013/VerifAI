import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Library, X, Radio } from 'lucide-react';
import { GeminiLiveSession, analyzeClaim } from './services/geminiService';
import { FactCardData } from './types';
import FactCard from './components/FactCard';
import DraggableCard from './components/DraggableCard';

const App: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  
  const [activeCards, setActiveCards] = useState<FactCardData[]>([]);
  const [libraryCards, setLibraryCards] = useState<FactCardData[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);
  
  // Store recent claims with timestamps for deduplication
  const recentClaimsRef = useRef<{ text: string; time: number }[]>([]);

  // Initialize Camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(videoStream);
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle Claims
  const handleClaimDetected = useCallback((claim: string) => {
    const now = Date.now();
    const normalizedClaim = claim.trim().toLowerCase();
    
    // Clean up old claims from history (> 10 seconds). 
    recentClaimsRef.current = recentClaimsRef.current.filter(c => now - c.time < 10000);

    // Similarity Check
    const isDuplicate = recentClaimsRef.current.some(existing => {
        // 1. Direct match
        if (existing.text === normalizedClaim) return true;
        
        // 2. Jaccard Similarity (Word Overlap)
        const words1 = new Set(normalizedClaim.split(/\s+/));
        const words2 = new Set(existing.text.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        const score = intersection.size / union.size;
        
        // Increased threshold to 0.7 to allow more similar (but different) claims
        return score > 0.7; 
    });

    if (isDuplicate) {
      console.log("Duplicate claim ignored:", claim);
      return;
    }
    
    // Add to history
    recentClaimsRef.current.push({ text: normalizedClaim, time: now });

    const id = crypto.randomUUID();
    
    // Create initial loading card
    const loadingCard: FactCardData = {
        id,
        timestamp: Date.now(),
        originalClaim: claim,
        status: 'loading'
    };

    setActiveCards(prev => [loadingCard, ...prev]);
    setLibraryCards(prev => [loadingCard, ...prev]);

    // Analyze
    analyzeClaim(claim, id).then((completedCard) => {
        setActiveCards(prev => prev.map(c => c.id === id ? completedCard : c));
        setLibraryCards(prev => prev.map(c => c.id === id ? completedCard : c));
    });

  }, []);

  const toggleLive = async () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
      setIsLive(false);
      return;
    } 
    
    setIsLive(true);
    const session = new GeminiLiveSession(handleClaimDetected);
    liveSessionRef.current = session;
    await session.start();
  };

  const removeActiveCard = (id: string) => {
    setActiveCards(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden flex">
      
      {/* Main Content Area */}
      <div className={`relative h-full transition-all duration-300 w-full`}>
        
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover" 
        />
        
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Header */}
        <div className="absolute top-6 left-8 flex items-center gap-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg ring-1 ring-black/5">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-white font-semibold text-sm tracking-wide drop-shadow-sm">
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Active Cards */}
        {activeCards.map((card, index) => {
             // Calculate staggered position
             const initialX = window.innerWidth / 2 - 175 + (index * 20); 
             const initialY = window.innerHeight - 350 - (index * 40);
             
             return (
                 <DraggableCard key={card.id} initialX={initialX} initialY={initialY}>
                     <FactCard card={card} onClose={removeActiveCard} />
                 </DraggableCard>
             );
        })}

        {/* Empty State */}
        {activeCards.length === 0 && isLive && (
             <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none">
               <p className="text-white/80 text-sm bg-black/20 backdrop-blur-lg px-6 py-2 rounded-full inline-block border border-white/10 font-medium">
                 Listening for claims...
               </p>
             </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 right-8 flex gap-3 z-30">
          <button 
            onClick={() => setShowLibrary(!showLibrary)}
            className="p-4 bg-white/20 backdrop-blur-xl rounded-full hover:bg-white/40 text-white transition-all border border-white/30 group shadow-lg ring-1 ring-black/5"
          >
            <Library className={`w-6 h-6 ${showLibrary ? 'text-blue-200' : ''}`} />
            {libraryCards.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full shadow-sm">
                    {libraryCards.length}
                </span>
            )}
          </button>
          
          <button 
            onClick={toggleLive}
            className={`p-4 rounded-full transition-all shadow-xl flex items-center justify-center border ring-1 ring-black/5 ${
              isLive 
              ? 'bg-red-500/90 hover:bg-red-600 border-red-400 text-white backdrop-blur-md' 
              : 'bg-white/90 text-slate-800 border-white hover:bg-white backdrop-blur-md'
            }`}
          >
            {isLive ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Library Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-40 w-full md:w-[450px]
        bg-slate-50/90 backdrop-blur-2xl border-l border-white/50 shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${showLibrary ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200/50 flex items-center justify-between bg-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800 tracking-wide">Library</h2>
            </div>
            <button 
              onClick={() => setShowLibrary(false)}
              className="p-2 hover:bg-black/5 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
             {libraryCards.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                 <Radio className="w-12 h-12 mb-4 opacity-30 text-slate-900" />
                 <p className="text-sm font-medium text-slate-500">No verified facts yet.</p>
                 <p className="text-xs text-slate-400 mt-2">Speak to generate real-time checks.</p>
               </div>
             ) : (
               libraryCards.map((card) => (
                 <div key={card.id} className="transition-all hover:scale-[1.01]">
                    <FactCard card={card} style={{width: '100%', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'}} />
                 </div>
               ))
             )}
          </div>
          
          <div className="p-4 bg-white/40 border-t border-slate-200/50 text-center text-[10px] text-slate-400 uppercase tracking-widest">
            Powered by Gemini 2.5 Live & 3.0 Flash
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;
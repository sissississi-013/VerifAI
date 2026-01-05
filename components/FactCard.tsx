import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Activity, Loader2, X } from 'lucide-react';
import { FactCardData, VerdictType } from '../types';
import Visualization from './Visualization';

interface FactCardProps {
  card: FactCardData;
  onClose?: (id: string) => void;
  style?: React.CSSProperties;
}

const FactCard: React.FC<FactCardProps> = ({ card, onClose, style }) => {
  if (card.status === 'loading') {
    return (
      <div 
        style={style}
        className="w-[320px] bg-white/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-4 animate-in fade-in zoom-in-95 duration-300 ring-1 ring-black/5"
      >
        <div className="flex items-start gap-3">
          <div className="bg-white/50 p-2 rounded-full shadow-sm">
             <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
             <h3 className="text-xs font-bold text-blue-700 uppercase mb-1 tracking-wider opacity-80">Verifying</h3>
             <p className="text-sm font-medium text-slate-900 leading-snug break-words drop-shadow-sm">"{card.originalClaim}"</p>
          </div>
        </div>
      </div>
    );
  }

  if (card.status === 'error') {
    return (
      <div 
        style={style}
        className="w-[320px] bg-red-500/10 backdrop-blur-xl rounded-xl shadow-2xl border border-red-500/20 p-4 ring-1 ring-black/5"
      >
        <div className="flex items-center gap-2 text-red-700 mb-2">
            <XCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Verification Failed</span>
            {onClose && (
              <button onClick={() => onClose(card.id)} className="ml-auto text-red-700 hover:text-red-900 bg-red-500/10 p-1 rounded-full">
                <X className="w-4 h-4" />
              </button>
            )}
        </div>
        <p className="text-xs text-red-900 font-medium">Could not verify: "{card.originalClaim}"</p>
      </div>
    );
  }

  const getVerdictConfig = (verdict: VerdictType | undefined) => {
    switch (verdict) {
      case VerdictType.VERIFIED:
        return { 
            color: 'text-green-800', 
            bg: 'bg-green-400/20', 
            border: 'border-green-400/30', 
            icon: <CheckCircle className="w-5 h-5 text-green-600" />, 
            label: 'Verified' 
        };
      case VerdictType.DEBUNKED:
        return { 
            color: 'text-red-800', 
            bg: 'bg-red-400/20', 
            border: 'border-red-400/30', 
            icon: <XCircle className="w-5 h-5 text-red-600" />, 
            label: 'Debunked' 
        };
      case VerdictType.NUANCED:
        return { 
            color: 'text-amber-800', 
            bg: 'bg-amber-400/20', 
            border: 'border-amber-400/30', 
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, 
            label: 'Nuanced' 
        };
      default:
        return { 
            color: 'text-slate-800', 
            bg: 'bg-slate-400/20', 
            border: 'border-slate-400/30', 
            icon: <Activity className="w-5 h-5 text-slate-600" />, 
            label: 'Uncertain' 
        };
    }
  };

  const config = getVerdictConfig(card.verdict);

  return (
    <div 
      style={style}
      className={`
      w-[350px] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300
      backdrop-blur-xl border ring-1 ring-black/5
      ${config.bg} ${config.border}
    `}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${config.border} bg-white/10`}>
        <div className="flex items-center gap-2">
          <div className="bg-white/40 p-1 rounded-full">{config.icon}</div>
          <span className={`font-black uppercase tracking-wide text-xs ${config.color} drop-shadow-sm`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 font-bold font-mono opacity-60">
                {new Date(card.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {onClose && (
                <button 
                  onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                  onClick={() => onClose(card.id)} 
                  className="p-1.5 hover:bg-black/10 rounded-full text-slate-600 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white/30">
        <div className="mb-3">
          <p className="font-serif text-base text-slate-900 leading-snug italic font-medium drop-shadow-sm">"{card.originalClaim}"</p>
        </div>
        
        <div className="mb-3">
           <p className="text-sm text-slate-800 leading-relaxed font-semibold opacity-90">{card.explanation}</p>
        </div>

        {card.visualization && (
          <div className="mb-3 border border-white/40 rounded-xl p-2 bg-white/20 shadow-sm">
             <Visualization vizData={card.visualization} />
          </div>
        )}

        {/* Sources */}
        {card.sources && card.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-900/10">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Sources</span>
             <div className="flex flex-col gap-1.5">
               {card.sources.map((source, idx) => (
                 <a 
                   key={idx} 
                   href={source.uri} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onMouseDown={(e) => e.stopPropagation()} // Prevent drag
                   className="flex items-center gap-2 px-3 py-1.5 bg-white/60 hover:bg-white/90 text-blue-700 text-xs rounded-lg transition-colors border border-white/50 shadow-sm font-medium group"
                 >
                   <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-blue-500 group-hover:text-blue-700" />
                   <span className="truncate">{source.title}</span>
                 </a>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactCard;
import { useState } from 'react';

export default function Flashcard({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group perspective w-full max-w-sm h-80 cursor-pointer mx-auto"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full duration-700 preserve-3d shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Lado Frontal: Coreano */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-3xl p-8">
          <div className="absolute top-6 right-6 opacity-20 text-blue-600 font-bold tracking-widest text-xs uppercase">
            Vocabulario
          </div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 drop-shadow-sm">
            {card.hangul}
          </h1>
          <div className="w-12 h-1 bg-blue-500 rounded-full opacity-30 mb-4"></div>
          <p className="text-blue-400 text-xs font-medium uppercase tracking-[0.2em] animate-pulse">
            Click para revelar
          </p>
        </div>

        {/* Lado Trasero: Significado */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 text-white rounded-3xl p-8 shadow-inner">
          <span className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
            {card.romanizacion}
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-center">
            {card.significado}
          </h2>
          <div className="absolute bottom-6 flex gap-1">
             <div className="w-2 h-2 rounded-full bg-white opacity-20"></div>
             <div className="w-2 h-2 rounded-full bg-white opacity-40"></div>
             <div className="w-2 h-2 rounded-full bg-white opacity-20"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
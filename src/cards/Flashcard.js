import { useState } from 'react';

export default function Flashcard({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group perspective w-full max-w-sm h-64 cursor-pointer mx-auto"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Lado Frontal (Coreano) */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center bg-white border-2 border-blue-500 rounded-2xl shadow-xl">
          <span className="text-sm text-blue-400 font-semibold mb-2 uppercase tracking-widest">Coreano</span>
          <h1 className="text-5xl font-bold text-gray-800 tracking-tighter">{card.hangul}</h1>
          <p className="mt-4 text-gray-400 text-sm italic">Haz clic para ver significado</p>
        </div>

        {/* Lado Trasero (Significado) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-blue-600 text-white rounded-2xl shadow-xl">
          <p className="text-blue-200 text-sm mb-1">{card.romanizacion}</p>
          <h2 className="text-4xl font-medium">{card.significado}</h2>
        </div>

      </div>
    </div>
  );
}
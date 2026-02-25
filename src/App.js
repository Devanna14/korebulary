import { useState } from 'react';
import { vocabularioCoreano } from './data/data';
import Flashcard from './cards/Flashcard';

function App() {
  const [index, setIndex] = useState(0);

  const siguiente = () => {
    setIndex((prev) => (prev + 1) % vocabularioCoreano.length);
  };

  const anterior = () => {
    setIndex((prev) => (prev - 1 + vocabularioCoreano.length) % vocabularioCoreano.length);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <header className="relative z-10 mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
          Kore<span className="text-blue-600">bulary</span>
        </h1>
        <p className="inline-block px-4 py-1 bg-white shadow-sm border border-slate-100 rounded-full text-slate-500 text-sm font-medium">
          Tarjeta {index + 1} de {vocabularioCoreano.length}
        </p>
      </header>

      <main className="relative z-10 w-full max-w-md">
        <Flashcard key={vocabularioCoreano[index].id} card={vocabularioCoreano[index]} />

        <div className="flex justify-center gap-6 mt-12 w-full">
          <button
            onClick={anterior}
            className="group flex items-center justify-center w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all active:scale-95"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
          </button>

          <button
            onClick={siguiente}
            className="group flex items-center justify-center px-10 h-14 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 font-bold tracking-wide"
          >
            Siguiente <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
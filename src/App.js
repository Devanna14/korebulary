import { useState } from 'react';
import { vocabularioCoreano } from './data/data';
import Flashcard from './cards/Flashcard';

function App() {
  const [vocabulario, setVocabulario] = useState(vocabularioCoreano);
  const [index, setIndex] = useState(0);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevaPalabra, setNuevaPalabra] = useState({ hangul: '', significado: '', romanizacion: '' });

  const siguiente = () => {
    setIndex((prev) => (prev + 1) % vocabulario.length);
  };

  const anterior = () => {
    setIndex((prev) => (prev - 1 + vocabulario.length) % vocabulario.length);
  };

  const agregarPalabra = (e) => {
    e.preventDefault();
    if (!nuevaPalabra.hangul || !nuevaPalabra.significado) return;

    const item = { ...nuevaPalabra, id: Date.now() };
    setVocabulario([...vocabulario, item]);
    setNuevaPalabra({ hangul: '', significado: '', romanizacion: '' });
    setMostrarForm(false);
    alert("¡Palabra agregada a la sesión!");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <header className="relative z-10 mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
          Kore<span className="text-blue-600">bulary</span>
        </h1>
        <p className="inline-block px-4 py-1 bg-white shadow-sm border border-slate-100 rounded-full text-slate-500 text-sm font-medium">
          Tarjeta {index + 1} de {vocabulario.length}
        </p>
      </header>

      <main className="relative z-10 w-full max-w-md">
        <Flashcard key={vocabulario[index].id} card={vocabulario[index]} />

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

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center text-2xl font-bold"
          >
            {mostrarForm ? '×' : '+'}
          </button>
        </div>

        {mostrarForm && (
          <div className="mt-8 p-6 bg-white rounded-3xl shadow-2xl border border-blue-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Nueva Tarjeta</h3>
            <form onSubmit={agregarPalabra} className="flex flex-col gap-3">
              <input
                type="text" placeholder="Hangul (ej: 친구)"
                className="p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={nuevaPalabra.hangul}
                onChange={(e) => setNuevaPalabra({ ...nuevaPalabra, hangul: e.target.value })}
              />
              <input
                type="text" placeholder="Romanización (ej: Chingu)"
                className="p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={nuevaPalabra.romanizacion}
                onChange={(e) => setNuevaPalabra({ ...nuevaPalabra, romanizacion: e.target.value })}
              />
              <input
                type="text" placeholder="Significado (ej: Amigo)"
                className="p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={nuevaPalabra.significado}
                onChange={(e) => setNuevaPalabra({ ...nuevaPalabra, significado: e.target.value })}
              />
              <button type="submit" className="mt-2 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                Guardar Palabra
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="mt-4 py-2 text-center relative z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-[1px] bg-slate-200 mb-4"></div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            © {new Date().getFullYear()} <span className="text-blue-600 font-bold">Korebulary</span>
          </p>
          <p className="text-slate-300 text-xs">
            Desarrollado con <span className="text-red-400">♥</span> by <a href="https://github.com/Devanna14" className="text-blue-500 hover:underline">Ceci Lara</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
import { useState } from 'react';
import { vocabularioCoreano } from './data';
import Flashcard from './Flashcard';

function App() {
  const [index, setIndex] = useState(0);

  const siguiente = () => {
    setIndex((prev) => (prev + 1) % vocabularioCoreano.length);
  };

  const anterior = () => {
    setIndex((prev) => (prev - 1 + vocabularioCoreano.length) % vocabularioCoreano.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Mi Vocabulario Coreano</h1>
        <p className="text-gray-600 text-lg">Tarjeta {index + 1} de {vocabularioCoreano.length}</p>
      </header>

      <main className="w-full max-w-md">
        <Flashcard key={vocabularioCoreano[index].id} card={vocabularioCoreano[index]} />
        
        <div className="flex justify-between mt-10 w-full px-4">
          <button 
            onClick={anterior}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Anterior
          </button>
          <button 
            onClick={siguiente}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
          >
            Siguiente
          </button>
        </div>
      </main>

      <footer className="mt-20 text-gray-400 text-sm">
        Presiona la tarjeta para revelar la respuesta
      </footer>
    </div>
  );
}

export default App;
import { useState, useEffect } from "react"; //Uso de useEffect para traer los datos de firebase
import { vocabularioCoreano } from "./data/data";
import Flashcard from "./cards/Flashcard";
import { db } from "./firebaseConfig"; // Importamos la db firebase
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";

function App() {
  // const [vocabulario, setVocabulario] = useState(vocabularioCoreano); // Inicializamos con datos locales para pruebas, luego se actualizará con Firebase
  const [vocabulario, setVocabulario] = useState([]); // Inicializamos vacío, luego se llenará con Firebase
  const [index, setIndex] = useState(0);
  const [nuevaPalabra, setNuevaPalabra] = useState({
    hangul: "",
    significado: "",
    romanizacion: "",
  });
  const [cargando, setCargando] = useState(true); // Estado para manejar la carga de datos
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false); 

  // 1. Datos de Firebase en tiempo real
  useEffect(() => {
    const q = query(collection(db, "vocabulario"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ ...doc.data(), id: doc.id });
      });
      setVocabulario(docs);
      setCargando(false); // Se detiene la carga cuando se reciben los datos de Firebase
    });
    return () => unsubscribe();
  }, []);

  const siguiente = () => {
    setIndex((prev) => (prev + 1) % vocabulario.length);
  };

  const anterior = () => {
    setIndex((prev) => (prev - 1 + vocabulario.length) % vocabulario.length);
  };

  // 2. Guardar en Firebase
  const agregarPalabra = async (e) => {
    e.preventDefault();

    if (!nuevaPalabra.hangul || !nuevaPalabra.significado) return;

    // Normalizamos el ID para evitar duplicados por mayúsculas, espacios, etc.
    const idDocumento = nuevaPalabra.hangul.trim().toLowerCase();

    try {
      // Referencia al documento usando el Hangul como ID
      const docRef = doc(db, "vocabulario", idDocumento);

      // Se obtiene el documento para ver si existe
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert(
          `La palabra "${nuevaPalabra.hangul}" ya fue registrada por alguien más.`,
        );
        return;
      }

      // Si no existe se guarda usando setDoc en lugar de addDoc que era mas para colecciones y genera un ID automático
      await setDoc(docRef, {
        ...nuevaPalabra,
        hangul: nuevaPalabra.hangul.trim(),
        createdAt: new Date(),
      });

      setNuevaPalabra({ hangul: "", significado: "", romanizacion: "" });
      setMostrarForm(false);
    } catch (error) {
      console.error("Error en la operación:", error);
      alert("Hubo un error al intentar guardar.");
    }
  };

  // Validación de que haya datos antes de renderizar la Flashcard
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <p className="text-xl font-medium text-slate-600 animate-pulse">
          Conectando con Korebulary...
        </p>
      </div>
    );
  }

  const FormularioRegistro = (
    <div className="p-6 bg-white rounded-3xl shadow-2xl border border-blue-50 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Nueva Tarjeta</h3>
        {vocabulario.length > 0 && (
          <button
            onClick={() => setMostrarForm(false)}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        )}
      </div>
      <form onSubmit={agregarPalabra} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Hangul (ej: 친구)"
          className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={nuevaPalabra.hangul}
          onChange={(e) =>
            setNuevaPalabra({ ...nuevaPalabra, hangul: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Romanización (ej: Chingu)"
          className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={nuevaPalabra.romanizacion}
          onChange={(e) =>
            setNuevaPalabra({ ...nuevaPalabra, romanizacion: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Significado (ej: Amigo)"
          className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={nuevaPalabra.significado}
          onChange={(e) =>
            setNuevaPalabra({ ...nuevaPalabra, significado: e.target.value })
          }
        />
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          Guardar Palabra
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Fondos Decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <header className="relative z-10 mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
          Kore<span className="text-blue-600">bulary</span>
        </h1>
        <p className="inline-block px-4 py-1 bg-white shadow-sm border border-slate-100 rounded-full text-slate-500 text-sm font-medium">
          {vocabulario.length === 0
            ? "¡Bienvenido! Registra tu primera palabra"
            : mostrarForm
              ? "Agregando palabra"
              : `Tarjeta ${index + 1} de ${vocabulario.length}`}
        </p>
      </header>

      <main className="relative z-10 w-full max-w-md">
        {/* Lógica Principal: Si no hay palabras O se activó el form, mostrar Formulario. Si hay palabras, mostrar Flashcard */}
        {vocabulario.length === 0 || mostrarForm ? (
          FormularioRegistro
        ) : (
          <>
            <Flashcard key={vocabulario[index].id} card={vocabulario[index]} />
            <div className="flex justify-center gap-6 mt-12 w-full">
              <button
                onClick={anterior}
                className="group flex items-center justify-center w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <span className="text-2xl">←</span>
              </button>
              <button
                onClick={siguiente}
                className="group flex items-center justify-center px-10 h-14 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 font-bold tracking-wide"
              >
                Siguiente →
              </button>
              <button
                onClick={() => setMostrarForm(true)}
                className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center text-2xl font-bold"
              >
                +
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="mt-8 py-2 text-center relative z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-[1px] bg-slate-200 mb-4"></div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            © {new Date().getFullYear()}{" "}
            <span className="text-blue-600 font-bold">Korebulary</span>
          </p>
          <p className="text-slate-300 text-xs">
            Desarrollado con <span className="text-red-400">♥</span> by{" "}
            <a
              href="https://github.com/Devanna14"
              className="text-blue-500 hover:underline"
            >
              Ceci Lara
            </a>
          </p>
        </div>
      </footer>
    </div>
  );

  // return (
  //   <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
  //     <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
  //     <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

  //     <header className="relative z-10 mb-10 text-center">
  //       <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
  //         Kore<span className="text-blue-600">bulary</span>
  //       </h1>
  //       <p className="inline-block px-4 py-1 bg-white shadow-sm border border-slate-100 rounded-full text-slate-500 text-sm font-medium">
  //         {mostrarForm
  //           ? "Agregando palabra"
  //           : `Tarjeta ${index + 1} de ${vocabulario.length}`}
  //       </p>
  //     </header>

  //     <main className="relative z-10 w-full max-w-md">
  //       {!mostrarForm ? (
  //         <>
  //           <Flashcard key={vocabulario[index].id} card={vocabulario[index]} />

  //           <div className="flex justify-center gap-6 mt-12 w-full">
  //             <button
  //               onClick={anterior}
  //               className="group flex items-center justify-center w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
  //             >
  //               <span className="text-2xl">←</span>
  //             </button>

  //             <button
  //               onClick={siguiente}
  //               className="group flex items-center justify-center px-10 h-14 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 font-bold tracking-wide"
  //             >
  //               Siguiente →
  //             </button>

  //             <button
  //               onClick={() => setMostrarForm(true)}
  //               className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center text-2xl font-bold"
  //             >
  //               +
  //             </button>
  //           </div>
  //         </>
  //       ) : (
  //         <div className="p-6 bg-white rounded-3xl shadow-2xl border border-blue-50 animate-in fade-in zoom-in duration-300">
  //           <div className="flex justify-between items-center mb-6">
  //             <h3 className="text-xl font-bold text-slate-800">
  //               Nueva Tarjeta
  //             </h3>
  //             <button
  //               onClick={() => setMostrarForm(false)}
  //               className="text-slate-400 hover:text-slate-600 text-2xl"
  //             >
  //               ×
  //             </button>
  //           </div>
  //           <form onSubmit={agregarPalabra} className="flex flex-col gap-4">
  //             <input
  //               type="text"
  //               placeholder="Hangul (ej: 친구)"
  //               className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
  //               value={nuevaPalabra.hangul}
  //               onChange={(e) =>
  //                 setNuevaPalabra({ ...nuevaPalabra, hangul: e.target.value })
  //               }
  //             />
  //             <input
  //               type="text"
  //               placeholder="Romanización (ej: Chingu)"
  //               className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
  //               value={nuevaPalabra.romanizacion}
  //               onChange={(e) =>
  //                 setNuevaPalabra({
  //                   ...nuevaPalabra,
  //                   romanizacion: e.target.value,
  //                 })
  //               }
  //             />
  //             <input
  //               type="text"
  //               placeholder="Significado (ej: Amigo)"
  //               className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
  //               value={nuevaPalabra.significado}
  //               onChange={(e) =>
  //                 setNuevaPalabra({
  //                   ...nuevaPalabra,
  //                   significado: e.target.value,
  //                 })
  //               }
  //             />
  //             <button
  //               type="submit"
  //               className="mt-4 bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
  //             >
  //               Guardar
  //             </button>
  //           </form>
  //         </div>
  //       )}
  //     </main>

  //     <footer className="mt-8 py-2 text-center relative z-10">
  //       <div className="flex flex-col items-center gap-2">
  //         <div className="w-24 h-[1px] bg-slate-200 mb-4"></div>
  //         <p className="text-slate-400 text-sm font-medium tracking-wide">
  //           © {new Date().getFullYear()}{" "}
  //           <span className="text-blue-600 font-bold">Korebulary</span>
  //         </p>
  //         <p className="text-slate-300 text-xs">
  //           Desarrollado con <span className="text-red-400">♥</span> by{" "}
  //           <a
  //             href="https://github.com/Devanna14"
  //             className="text-blue-500 hover:underline"
  //           >
  //             Ceci Lara
  //           </a>
  //         </p>
  //       </div>
  //     </footer>
  //   </div>
  // );
}

export default App;

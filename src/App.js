import { useState, useEffect } from "react"; //Uso de useEffect para traer los datos de firebase
// import { vocabularioCoreano } from "./data/data";
import Flashcard from "./cards/Flashcard";
import AdminPanel from "./Panel/AdminPanel";
import { db } from "./firebaseConfig"; // Importamos la db firebase
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  addDoc, // Importamos las funciones necesarias de Firestore para los reportes
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"; // Importamos funciones de autenticación para manejar usuario administrador

function App() {
  const [verReportes, setVerReportes] = useState(false);
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
  const [mostrarFormReporte, setMostrarFormReporte] = useState(false); // Nuevo estado para mostrar el formulario de reporte

  const [reporte, setReporte] = useState({
    hangul: "",
    comentario: "",
    fecha: null,
    estado: "pendiente", // Pendiente, en revisión, resuelto
  });

  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const [usuarioAdmin, setUsuarioAdmin] = useState(null);

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

    const hangulLimpio = limpiarTexto(nuevaPalabra.hangul);
    const significadoLimpio = limpiarTexto(nuevaPalabra.significado);
    const romanizacionLimpia = limpiarTexto(nuevaPalabra.romanizacion);

    if (!hangulLimpio || !significadoLimpio) return;

    // Normalizamos el ID para evitar duplicados por mayúsculas, espacios, etc.
    const idDocumento = hangulLimpio.toLowerCase();

    try {
      // Referencia al documento usando el Hangul como ID
      const docRef = doc(db, "vocabulario", idDocumento);

      // Se obtiene el documento para ver si existe
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert(
          `La palabra "${hangulLimpio.hangul}" ya fue registrada por alguien más.`,
        );
        return;
      }

      // Si no existe se guarda usando setDoc en lugar de addDoc que era mas para colecciones y genera un ID automático
      await setDoc(docRef, {
        ...nuevaPalabra,
        hangul: hangulLimpio,
        significado: significadoLimpio,
        romanizacion: romanizacionLimpia,
        createdAt: new Date(),
      });

      setNuevaPalabra({ hangul: "", significado: "", romanizacion: "" });
      setMostrarForm(false);
    } catch (error) {
      console.error("Error en la operación:", error);
      alert("Hubo un error al intentar guardar.");
    }
  };

  // Función para enviar el reporte a Firebase
  const enviarReporte = async (e) => {
    e.preventDefault();

    const hangulLimpio = limpiarTexto(reporte.hangul);
    const comentarioLimpio = limpiarTexto(reporte.comentario);
    const correoLimpio = reporte.correo.trim().toLowerCase();

    if (!hangulLimpio || !comentarioLimpio) return;
    const idReporte = hangulLimpio.toLowerCase();

    try {
      const reporteRef = doc(db, "reportes", idReporte);
      // Verificamos si el reporte ya existe en la base de datos
      const docSnap = await getDoc(reporteRef);
      if (docSnap.exists()) {
        alert(
          `La palabra "${hangulLimpio}" ya tiene un reporte activo y está siendo revisada. ¡Gracias por tu paciencia!`,
        );

        setReporte({
          hangul: "",
          comentario: "",
          fecha: null,
          estado: "pendiente",
          correo: "",
          userAgent: "",
        });
        setMostrarFormReporte(false);
        setMostrarMenu(false);
        return;
      }

      // Si no existe, se crearlo
      await setDoc(reporteRef, {
        ...reporte,
        fecha: new Date(),
        correo: correoLimpio,
        hangul: hangulLimpio,
        estado: "pendiente",
        userAgent: navigator.userAgent,
        comentario: comentarioLimpio,
      });

      alert(
        "Reporte enviado con éxito. Revisaré la palabra '" +
          hangulLimpio +
          "' pronto.",
      );

      setReporte({
        hangul: "",
        comentario: "",
        fecha: null,
        estado: "pendiente",
        correo: "",
        userAgent: "",
      });
      setMostrarFormReporte(false);
      setMostrarMenu(false);
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      alert("Hubo un problema al enviar el reporte. Inténtalo de nuevo.");
    }
  };

  // Sesion administrador con Google
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.REACT_APP_ADMIN_EMAIL) {
        setUsuarioAdmin(user);
      } else if (user) {
        // Si entra alguien más con Google, lo deslogueamos o limitamos
        console.log("Acceso denegado: No es administrador");
        signOut(auth);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Función para iniciar sesión con la ventana de Google
  const loginConGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      setMostrarMenu(false);
    } catch (error) {
      console.error("Error al autenticar con Google:", error);
    }
  };

  const manejarLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn(
        "La petición de cierre de sesión fue bloqueada o falló:",
        error,
      );
    } finally {
      setUsuarioAdmin(null);
      setVerReportes(false);
      setMostrarMenu(false);
    }
  };

  const limpiarTexto = (texto) => {
    return texto.trim().replace(/[<>]/g, "").slice(0, 100);
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
      {/* Botón de Engrane */}
      <button
        onClick={() => setMostrarMenu(true)}
        className="absolute top-6 right-6 z-50 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-slate-400 hover:text-blue-600 active:scale-90"
      >
        <span className="text-2xl">⚙️</span>
      </button>

      {/* MODAL DEL MENÚ / REPORTE */}
      {mostrarMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setMostrarMenu(false);
                setMostrarFormReporte(false);
              }}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 text-3xl"
            >
              ×
            </button>

            {!mostrarFormReporte ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  Opciones
                </h2>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setMostrarFormReporte(true)}
                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-2xl transition-colors font-medium text-left"
                  >
                    <span>🚩</span> Reportar palabra
                  </button>
                  <a
                    href="mailto:cecylar14@gmail.com"
                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl transition-colors font-medium"
                  >
                    <span>📧</span> Contacto
                  </a>
                  <button
                    onClick={() => setMostrarFormReporte(true)}
                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-yellow-50 text-slate-600 hover:text-yellow-600 rounded-2xl transition-colors font-medium text-left"
                  >
                    <span>💡</span> Sugerencias
                  </button>
                  <button
                    onClick={() => alert("¡Gracias!")}
                    className="flex items-center gap-4 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
                  >
                    <span>☕</span> Apoyar proyecto
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={enviarReporte}
                className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Reportar error
                </h2>
                <p className="text-sm text-slate-500 mb-2">
                  Dime qué palabra está mal y por qué.
                </p>
                <input
                  type="text"
                  placeholder="Hangul de la palabra"
                  className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none"
                  value={reporte.hangul}
                  onChange={(e) =>
                    setReporte({ ...reporte, hangul: e.target.value })
                  }
                  required
                />
                <textarea
                  placeholder="¿Cuál es el error? (ej: Significado incorrecto)"
                  rows="3"
                  className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none resize-none"
                  value={reporte.comentario}
                  onChange={(e) =>
                    setReporte({ ...reporte, comentario: e.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="tucorreo@ejemplo.com para seguimiento"
                  className="p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none"
                  value={reporte.correo}
                  onChange={(e) =>
                    setReporte({ ...reporte, correo: e.target.value })
                  }
                />
                <button
                  type="submit"
                  className="bg-red-500 text-white p-4 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  Enviar Reporte
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormReporte(false)}
                  className="text-slate-400 text-sm font-medium"
                >
                  Volver
                </button>
              </form>
            )}

            <div className="border-t border-slate-100 mt-4 pt-4">
              {!usuarioAdmin ? (
                <button
                  onClick={loginConGoogle}
                  className="flex items-center justify-center gap-3 w-full p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-sm font-medium text-slate-600"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Acceso Admin con Google
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  {usuarioAdmin && (
                    <button
                      onClick={() => {
                        setVerReportes(true);
                        setMostrarMenu(false);
                      }}
                      className="p-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    >
                      📊 Ver Reportes Pendientes
                    </button>
                  )}
                  <button
                    onClick={manejarLogout}
                    className="text-xs text-red-400 hover:text-red-600 font-medium text-center"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
      {verReportes && <AdminPanel alCerrar={() => setVerReportes(false)} />}
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

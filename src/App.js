import { useState, useEffect } from "react"; //Uso de useEffect para traer los datos de firebase
import { opcionesApoyo } from "./data/data"; // Importamos las opciones de apoyo para mostrar en el menú
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
  const [vocabulario, setVocabulario] = useState([]); // Inicializamos vacío, luego se llenará con Firebase
  const [vocabularioFiltrado, setVocabularioFiltrado] = useState([]); // Para manejar el recorte y mezcla
  const [cantidadEstudio, setCantidadEstudio] = useState(() => {
    const guardado = localStorage.getItem("korebulary_cantidad");
    return guardado ? Number(guardado) : 10;
  });

  const [index, setIndex] = useState(() => {
    const guardado = localStorage.getItem("korebulary_index");
    return guardado ? Number(guardado) : 0;
  });
  const [nuevaPalabra, setNuevaPalabra] = useState({
    hangul: "",
    significado: "",
    romanizacion: "",
  });
  const [cargando, setCargando] = useState(true); // Estado para manejar la carga de datos
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarFormReporte, setMostrarFormReporte] = useState(false); // Nuevo estado para mostrar el formulario de reporte

  const [mostrarApoyo, setMostrarApoyo] = useState(false);
  const [sugerencias, setMostrarSugerencias] = useState(false);

  const [reporte, setReporte] = useState({
    hangul: "",
    comentario: "",
    fecha: null,
    estado: "pendiente", // Pendiente, en revisión, resuelto
  });

  // Configuración de autenticación con Google
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const [usuarioAdmin, setUsuarioAdmin] = useState(null);

  // Estado para manejar el envío de sugerencias
  const [sugerenciaTexto, setSugerenciaTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Estado para manejar el modal después de enviar un reporte o sugerencia etc alerta general
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
    tipo: "exito",
  });

  const [minimoTiempoCumplido, setMinimoTiempoCumplido] = useState(false); // Nuevo estado para controlar el tiempo minimo del loader

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

  // Guardar el índice cada vez que cambie
  useEffect(() => {
    localStorage.setItem("korebulary_index", index.toString());
  }, [index]);

  // 1. Efecto cuando el vocabulario carga o cambia la cantidad
  useEffect(() => {
    if (vocabulario.length > 0) {
      const guardadas = localStorage.getItem("korebulary_lista_actual");
      let listaExistente = [];
      try {
        listaExistente = guardadas ? JSON.parse(guardadas) : [];
      } catch (e) {
        console.error(e);
      }
      // Sin pide cierta cantidad y no hay suficientes toma la cantidad máxima disponible para no generar un array vacío
      const objetivoReal = Math.min(cantidadEstudio, vocabulario.length);

      if (listaExistente.length > 0 && listaExistente.length === objetivoReal) {
        setVocabularioFiltrado(listaExistente);
      } else {
        const mezcladas = [...vocabulario]
          .sort(() => Math.random() - 0.5)
          .slice(0, cantidadEstudio);

        setVocabularioFiltrado(mezcladas);
        localStorage.setItem(
          "korebulary_lista_actual",
          JSON.stringify(mezcladas),
        );
        setIndex(0);
        localStorage.setItem("korebulary_index", "0");
      }
    }
  }, [vocabulario.length, cantidadEstudio]);

  // 2. Función de cambio de cantidad optimizada
  const cambiarCantidad = (num) => {
    setCantidadEstudio(num);
    localStorage.setItem("korebulary_cantidad", num.toString());
    localStorage.removeItem("korebulary_lista_actual");

    setIndex(0);
    localStorage.setItem("korebulary_index", "0");
    setMostrarMenu(false);
  };

  const siguiente = () => {
    setIndex((prev) => (prev + 1) % vocabularioFiltrado.length);
  };

  const anterior = () => {
    setIndex(
      (prev) =>
        (prev - 1 + vocabularioFiltrado.length) % vocabularioFiltrado.length,
    );
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

      setModalConfig({
        visible: true,
        titulo: "¡Recibido!",
        mensaje:
          "Reporte enviado con éxito. Revisaré la palabra '" +
          hangulLimpio +
          "' pronto. ¡Gracias por ayudarme a mejorar Korebulary! ❤️",
        tipo: "exito",
      });

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
      setModalConfig({
        visible: true,
        titulo: "¡Error!",
        mensaje: "Hubo un problema al enviar el reporte. Inténtalo de nuevo.",
        tipo: "error",
      });
    }
  };

  // Sesion administrador con Google
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.REACT_APP_ADMIN_EMAIL) {
        setUsuarioAdmin(user);
      } else if (user) {
        // Si entra alguien más con Google, lo deslogueamos o limitamos
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

  const enviarSugerencia = async () => {
    if (!sugerenciaTexto.trim()) return;

    setEnviando(true);
    try {
      await addDoc(collection(db, "sugerencias"), {
        texto: sugerenciaTexto,
        fecha: new Date().toISOString(),
        dispositivo: navigator.userAgent,
      });
      setModalConfig({
        visible: true,
        titulo: "¡Recibido!",
        mensaje:
          "Tu sugerencia ya está en mis pendientes. ¡Gracias por ayudarme a mejorar Korebulary! ❤️",
        tipo: "exito",
      });
      setSugerenciaTexto("");
      setMostrarSugerencias(false);
    } catch (error) {
      console.error("Error al enviar:", error);
      setModalConfig({
        visible: true,
        titulo: "¡Error!",
        mensaje: "Hubo un error al enviar tu sugerencia. Inténtalo de nuevo.",
        tipo: "error",
      });
    } finally {
      setEnviando(false);
    }
  };

  const limpiarTexto = (texto) => {
    return texto.trim().replace(/[<>]/g, "").slice(0, 100);
  };

  const hablarCoreano = (texto) => {
    if (!texto) return;

    // Cancelar audios previos
    window.speechSynthesis.cancel();

    const enunciado = new SpeechSynthesisUtterance(texto);

    // Intentar encontrar una voz coreana específica en el sistema
    const voces = window.speechSynthesis.getVoices();
    const vozCoreana = voces.find(
      (v) => v.lang === "ko-KR" || v.lang.includes("ko"),
    );

    if (vozCoreana) {
      enunciado.voice = vozCoreana;
    }

    enunciado.lang = "ko-KR";
    enunciado.rate = 0.8;
    enunciado.volume = 1; // Aseguramos volumen al máximo

    window.speechSynthesis.speak(enunciado);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimoTiempoCumplido(true);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  // Solo deja de cargar cuando Firebase terminó Y pasó el tiempo mínimo
  const mostrarLoader = cargando || !minimoTiempoCumplido;

  if (mostrarLoader) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#f8fafc] overflow-hidden relative">
        {/* Letras Coreanas Flotantes de Fondo */}
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <span className="absolute top-1/4 left-1/4 animate-bounce text-4xl text-dark-50 [animation-delay:0.2s]">
            안녕하세요
          </span>
          <span className="absolute top-1/2 right-10 animate-pulse text-6xl text-dark-50">
            ㄱ
          </span>
          <span className="absolute bottom-1/4 left-10 animate-bounce text-5xl text-dark-50 [animation-delay:0.5s]">
            ㅎ
          </span>
          <span className="absolute top-10 right-1/4 animate-pulse text-4xl text-dark-50">
            사랑
          </span>
          <span className="absolute bottom-10 right-1/3 animate-bounce text-5xl text-dark-50">
            한국
          </span>
        </div>

        {/* Contenedor del Logo con movimiento */}
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-700">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-100 rounded-[2.5rem] animate-ping opacity-15"></div>
            <div className="relative bg-white w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-6xl animate-bounce border-b-8 border-blue-50">
              <img
                src={`${process.env.PUBLIC_URL}/favicon.ico`}
                alt="Logo"
                className="w-28 h-28 rounded-[2.5rem]"
              />
            </div>
          </div>

          {/* Nombre de la App con animación escalonada */}
          <div className="flex gap-1 mb-3">
            {["K", "o", "r", "e", "b", "u", "l", "a", "r", "y"].map(
              (letra, i) => (
                <span
                  key={i}
                  className="text-3xl font-black text-slate-800 animate-bounce text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {letra}
                </span>
              ),
            )}
          </div>

          {/* Subtítulo */}
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-blue-600/60 uppercase tracking-[0.4em] animate-pulse">
              Preparando tarjetas
            </p>
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const FormularioRegistro = (
    <div className="p-6 bg-white rounded-3xl shadow-2xl border border-blue-50 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-4">
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
    <div className="h-[100dvh] bg-[#f8fafc] flex flex-col items-center justify-between p-4 relative overflow-hidden">
      {/* Botón de Engrane */}
      <button
        onClick={() => setMostrarMenu(true)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 sm:p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-slate-400 hover:text-blue-600 active:scale-90"
      >
        <span className="text-lg sm:text-2xl">⚙️</span>
      </button>

      {/* MODAL DEL MENÚ / REPORTE */}
      {mostrarMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative h-fit">
            <button
              onClick={() => {
                setMostrarMenu(false);
                setMostrarFormReporte(false);
                setMostrarApoyo(false);
                setMostrarSugerencias(false);
              }}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 text-3xl"
            >
              ×
            </button>

            {/* 1. PRIORIDAD: VISTA DE REPORTE */}
            {mostrarFormReporte ? (
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
            ) : /* 2. SEGUNDA PRIORIDAD: VISTA DE APOYO */
            mostrarApoyo ? (
              <div className="animate-in slide-in-from-right duration-300">
                <div className="text-center mb-4">
                  <img
                    src={`${process.env.PUBLIC_URL}/img-apoyo.png`}
                    alt="Apoya el proyecto"
                    className="w-32 h-32 mx-auto rounded-full mb-4 shadow-md object-cover"
                  />
                  <h2 className="text-2xl font-bold text-slate-800">
                    Apoyar Proyecto
                  </h2>
                  <p className="text-blue-600 font-medium text-sm">
                    Korebulary
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-4 text-center">
                  안녕하세요! Soy Ceci. Mi meta es mantener esta herramienta
                  <strong> gratuita y libre de anuncios</strong>. Tu
                  contribución me ayuda a pagar los servidores y seguir
                  mejorando la app para todos. ¡Cualquier apoyo significa mucho!
                </p>

                <div className="flex flex-col gap-3">
                  {opcionesApoyo.map((opcion) => (
                    <a
                      key={opcion.id}
                      href={opcion.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all border border-blue-100 group active:scale-95"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-900">
                          {opcion.titulo}
                        </span>
                        <span className="text-xs text-blue-400">
                          Pago seguro
                        </span>
                      </div>
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm group-hover:bg-blue-700 transition-colors">
                        {opcion.costo}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : /* 3. TERCERA PRIORIDAD: VISTA DE SUGERENCIAS */
            sugerencias ? (
              <div className="animate-in fade-in zoom-in duration-300 text-center">
                <div className="mb-4">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <img
                      src={`${process.env.PUBLIC_URL}/img-sugerencias.png`}
                      alt="Sugerencias del proyecto"
                      className="w-35 h-35 mx-auto rounded-full mb-2 shadow-md object-cover"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Sugerencias
                  </h2>
                  <p className="text-blue-600 font-medium text-xs">
                    Korebulary
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    ¿Tienes alguna idea para mejorar la app o encontraste algún
                    error? Me encantaría escucharte para seguir haciendo de{" "}
                    <strong>Korebulary </strong> la mejor herramienta para
                    aprender coreano.
                  </p>
                </div>

                <textarea
                  value={sugerenciaTexto}
                  onChange={(e) => setSugerenciaTexto(e.target.value)}
                  placeholder="Escribe tu sugerencia..."
                  rows="3"
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white text-slate-700"
                />

                <button
                  onClick={enviarSugerencia}
                  disabled={enviando || !sugerenciaTexto.trim()}
                  className={`block w-full py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                    enviando || !sugerenciaTexto.trim()
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  {enviando ? "Enviando..." : "Enviar Sugerencia"}
                </button>

                <button
                  onClick={() => setMostrarSugerencias(false)}
                  className="mt-4 text-slate-400 text-xs font-bold w-full text-center hover:text-slate-600 transition-colors uppercase tracking-wider"
                >
                  ← Volver al inicio
                </button>
              </div>
            ) : (
              /* 3. VISTA POR DEFECTO: MENÚ DE OPCIONES */
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                  Opciones
                </h2>

                {/* NUEVA SECCIÓN: CANTIDAD DE PALABRAS */}
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Meta de estudio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[10, 25, 50, 100].map((num) => (
                      <button
                        key={num}
                        onClick={() => cambiarCantidad(num)}
                        className={`py-2 rounded-xl text-sm font-bold transition-all ${
                          cantidadEstudio === num
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white text-slate-500 border border-slate-200"
                        }`}
                      >
                        {num} palabras
                      </button>
                    ))}
                  </div>
                </div>

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
                    onClick={() => setMostrarSugerencias(true)}
                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-yellow-50 text-slate-600 hover:text-yellow-600 rounded-2xl transition-colors font-medium text-left"
                  >
                    <span>💡</span> Sugerencias
                  </button>
                  <button
                    onClick={() => setMostrarApoyo(true)}
                    className="flex items-center gap-4 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
                  >
                    <span>☕</span> Apoyar proyecto
                  </button>
                </div>

                {/* Sección de Login al final */}
                <div className="border-t border-slate-100 mt-4 pt-4 text-center">
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
                      <button
                        onClick={() => {
                          setVerReportes(true);
                          setMostrarMenu(false);
                        }}
                        className="p-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
                      >
                        📊 Ver Reportes Pendientes
                      </button>
                      <button
                        onClick={manejarLogout}
                        className="text-xs text-red-400 hover:text-red-600 font-medium text-center p-2"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA GENERAL (éxito o error) */}
      {modalConfig.visible && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white rounded-[2rem] p-6 shadow-2xl text-center animate-in zoom-in duration-300">
            <div
              className={`w-30 h-30 rounded-full flex items-center justify-center mx-auto mb-4 ${
                modalConfig.tipo === "exito" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <span className="text-3xl">
                {modalConfig.tipo === "exito" ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/img-exito.png`}
                    alt="Ceci FEliz"
                    className="w-30 h-30 mx-auto rounded-full shadow-md object-cover"
                  />
                ) : (
                  <img
                    src={`${process.env.PUBLIC_URL}/img-error.png`}
                    alt="Ceci Triste"
                    className="w-30 h-30 mx-auto rounded-full mb-2 shadow-md object-cover"
                  />
                )}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {modalConfig.titulo}
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-tight">
              {modalConfig.mensaje}
            </p>

            <button
              onClick={() => setModalConfig({ ...modalConfig, visible: false })}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Fondos Decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <header className="relative z-10 mb-2 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
          Kore<span className="text-blue-600">bulary</span>
        </h1>
        <p className="inline-block px-4 py-1 bg-white shadow-sm border border-slate-100 rounded-full text-slate-500 text-sm font-medium">
          {vocabularioFiltrado.length === 0
            ? "¡Bienvenido! Registra tu primera palabra"
            : mostrarForm
              ? "Agregando palabra"
              : `Tarjeta ${index + 1} de ${vocabularioFiltrado.length}`}
        </p>
      </header>

      <main className="relative z-10 w-full max-w-sm">
        {/* Lógica Principal: Si no hay palabras O se activó el form, mostrar Formulario. Si hay palabras, mostrar Flashcard */}
        {vocabularioFiltrado.length === 0 || mostrarForm ? (
          FormularioRegistro
        ) : (
          <>
            <Flashcard
              key={vocabularioFiltrado[index].id}
              card={vocabularioFiltrado[index]}
              alEscuchar={() =>
                hablarCoreano(vocabularioFiltrado[index].hangul)
              }
            />
            <div className="flex justify-center gap-6 mt-10 w-full">
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

      <footer className="mt-4 py-1 text-center relative z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-[1px] bg-slate-200 mb-3"></div>
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
}

export default App;

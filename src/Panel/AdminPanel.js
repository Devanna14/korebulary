import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore";

const AdminPanel = ({ alCerrar }) => {
  const [reportes, setReportes] = useState([]);

  useEffect(() => {
    // Consulta a los reportes en fierebase en tiempo real
    const q = query(collection(db, "reportes"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ ...doc.data(), id: doc.id });
      });
      setReportes(docs);
    });
    return () => unsubscribe();
  }, []);

  const eliminarReporte = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este reporte?")) {
      await deleteDoc(doc(db, "reportes", id));
    }
  };

  const marcarResuelto = async (id) => {
    const reporteRef = doc(db, "reportes", id);
    await updateDoc(reporteRef, { estado: "resuelto" });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto p-6 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Panel de Reportes</h2>
          <button onClick={alCerrar} className="text-slate-400 hover:text-slate-600 text-3xl">&times;</button>
        </header>

        {reportes.length === 0 ? (
          <p className="text-center text-slate-500 py-20 italic">No hay reportes pendientes. ¡Buen trabajo! 🇰🇷</p>
        ) : (
          <div className="grid gap-4">
            {reportes.map((rep) => (
              <div key={rep.id} className={`p-6 rounded-3xl border ${rep.estado === 'resuelto' ? 'bg-slate-50 opacity-60' : 'bg-white shadow-md border-red-50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-50 px-3 py-1 rounded-full">
                      {rep.estado || 'pendiente'}
                    </span>
                    <h3 className="text-xl font-bold text-slate-800 mt-2">Palabra: {rep.hangul}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => marcarResuelto(rep.id)} className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors">✔</button>
                    <button onClick={() => eliminarReporte(rep.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors">🗑</button>
                  </div>
                </div>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-xl italic">"{rep.comentario}"</p>
                <footer className="mt-4 text-[10px] text-slate-400 flex justify-between">
                  <span>Reportado el: {rep.fecha?.toDate().toLocaleString()}</span>
                  <span className="truncate max-w-[200px]">{rep.userAgent}</span>
                </footer>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
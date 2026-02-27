// Este archivo contiene datos de ejemplo para el vocabulario coreano.
export const vocabularioCoreano = [
  { id: 1, hangul: "안녕하세요", romanizacion: "Añyong-haseyo", significado: "Hola" },
  { id: 2, hangul: "감사합니다", romanizacion: "Kamsahamnida", significado: "Gracias" },
  { id: 3, hangul: "물", romanizacion: "Mul", significado: "Agua" },
  { id: 4, hangul: "친구", romanizacion: "Chingu", significado: "Amigo/a" },
  { id: 5, hangul: "사랑해", romanizacion: "Sarangne", significado: "Te amo" },
  { id: 6, hangul: "바보", romanizacion: "Pavo", significado: "Tonto" },
];

// Opciones de apoyo para los usuarios que quieran contribuir al proyecto.
export const opcionesApoyo = [
  { id: 1, titulo: "☕ Invítame un café", costo: "$65", link: process.env.REACT_APP_APOYO_65 },
  { id: 2, titulo: "🍳 Un desayuno", costo: "$100", link: process.env.REACT_APP_APOYO_100 },
  { id: 3, titulo: "🚀 Sostener la App", costo: "$150", link: process.env.REACT_APP_APOYO_150 },
];

export const imagenApoyo = "img-apoyo.png";
export const imagenSugerencias = process.env.REACT_APP_SUGERENCIAS_IMG || "img-sugerencias.png";
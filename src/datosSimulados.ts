// URL Real del servidor en Render proporcionada por tu compañero
export const API_BASE_URL = 'https://exposcalif-backend-v2.onrender.com';

// --- ESTRUCTURAS DE DATOS (INTERFACES) ---
// Modeladas con base en las tablas de Supabase y rutas del backend de tu compañero

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'alumno' | 'docente' | 'admin';
  matricula?: string;
}

export interface Equipo {
  id: number;
  nombre_equipo: string;
  id_grupo: number;
  miembros: string[]; 
}

export interface Exposicion {
  id: number;
  titulo: string;
  fecha_exposicion: string;
  nombre_equipo: string;
  id_equipo: number;
}

// --- BASE DE DATOS LOCAL SIMULADA (MOCK DATA) ---

export const usuariosSimulados: Usuario[] = [
  { id: "u-1", email: "juan@gmail.com", nombre: "Juan Pablo", apellido: "Prog", rol: "alumno", matricula: "A23001" },
  { id: "u-2", email: "maria@gmail.com", nombre: "María", apellido: "López", rol: "alumno", matricula: "A23002" },
  { id: "u-3", email: "docente@gmail.com", nombre: "Carlos", apellido: "Ramírez", rol: "docente" }
];

export const equiposSimulados: Equipo[] = [
  { id: 1, nombre_equipo: "Los Analistas de Software", id_grupo: 1, miembros: ["María López"] },
  { id: 2, nombre_equipo: "Desarrolladores Alfa", id_grupo: 1, miembros: ["Pedro Pérez"] }
];

export const exposicionesSimuladas: Exposicion[] = [
  { id: 101, titulo: "Arquitectura REST y Node.js", fecha_exposicion: "2026-05-25", nombre_equipo: "Los Analistas de Software", id_equipo: 1 },
  { id: 102, titulo: "Modelado de Bases de Datos", fecha_exposicion: "2026-05-28", nombre_equipo: "Desarrolladores Alfa", id_equipo: 2 }
];
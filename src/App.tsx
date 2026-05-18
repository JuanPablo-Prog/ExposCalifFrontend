// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { equiposSimulados, exposicionesSimuladas } from './datosSimulados';
import type { Usuario, Equipo, Exposicion } from './datosSimulados';
import './App.css';

// URL en la nube real y directa en formato JSON sin restricciones de métodos (Bypass de CORS y 405)
const CENTRAL_DATABASE_URL = "https://api-exposcalif-default-rtdb.firebaseio.com/grupo_jp.json";

function getInitials(nombre: string, apellido: string) {
  return `${nombre ? nombre.charAt(0) : 'U'}${apellido ? apellido.charAt(0) : 'N'}`.toUpperCase();
}

function App() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [vistaActual, setVistaActual] = useState<'login' | 'registro' | 'perfil' | 'equipos' | 'evaluar' | 'resultados' | 'admin_panel'>('login');
  const [usuarioLogueado, setUsuarioLogueado] = useState<Usuario | null>(null);
  
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [listaEquipos, setListaEquipos] = useState<Equipo[]>([]);
  const [listaExposiciones, setListaExposiciones] = useState<Exposicion[]>([]);
  const [listaCalificaciones, setListaCalificaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const [criterios] = useState<any[]>([
    { id: 1, nombre_criterio: 'Dominio del tema', peso: 40 },
    { id: 2, nombre_criterio: 'Material didáctico y apoyo visual', peso: 30 },
    { id: 3, nombre_criterio: 'Estructura y fluidez', peso: 30 }
  ]);

  // --- FORMULARIOS ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [matricula, setMatricula] = useState('');
  
  const [nombreNuevoEquipo, setNombreNuevoEquipo] = useState('');
  const [tituloNuevaExpo, setTituloNuevaExpo] = useState('');
  const [equipoNuevaExpo, setEquipoNuevaExpo] = useState('');
  const [fechaNuevaExpo, setFechaNuevaExpo] = useState('');

  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editMatricula, setEditMatricula] = useState('');

  const [usuarioEditandoId, setUsuarioEditandoId] = useState<string | null>(null);
  const [userFormNombre, setUserFormNombre] = useState('');
  const [userFormApellido, setUserFormApellido] = useState('');
  const [userFormMatricula, setUserFormMatricula] = useState('');
  const [userFormRol, setUserFormRol] = useState<'alumno' | 'docente' | 'admin'>('alumno');

  const [calificacionesInput, setCalificacionesInput] = useState<{ [key: string]: { [critId: number]: number } }>({});
  const [comentariosInput, setComentariosInput] = useState<{ [key: string]: string }>({});

  // --- NUEVA SINCRONIZACIÓN AUTOMÁTICA EN LA NUBE ---
  const jalarDatosDeInternet = async () => {
    try {
      const res = await fetch(CENTRAL_DATABASE_URL);
      if (res.ok) {
        const servidorData = await res.json();
        if (servidorData) {
          setListaUsuarios(servidorData.usuarios || []);
          setListaEquipos(servidorData.equipos || []);
          setListaExposiciones(servidorData.exposiciones || []);
          setListaCalificaciones(servidorData.calificaciones || []);
          return servidorData;
        }
      }
    } catch (e) {
      console.log("Error de conexión con la red:", e);
    }
    return null;
  };

  const guardarDatosEnInternet = async (nuevosUsuarios, nuevosEquipos, nuevasExpos, nuevasCalifs) => {
    try {
      await fetch(CENTRAL_DATABASE_URL, {
        method: "PUT", // Firebase maneja PUT directo sobre el archivo JSON global
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarios: nuevosUsuarios,
          equipos: nuevosEquipos,
          exposiciones: nuevasExpos,
          calificaciones: nuevasCalifs
        })
      });
    } catch (e) {
      console.error("Error al escribir en la nube:", e);
    }
  };

  useEffect(() => {
    const arrancarSistemaCompartido = async () => {
      setCargando(true);
      const datosExistentes = await jalarDatosDeInternet();

      // Si el servidor en internet está completamente limpio, metemos los datos por primera vez
      if (!datosExistentes || !datosExistentes.usuarios || datosExistentes.usuarios.length === 0) {
        const adminInicial = [
          {
            id: 'admin-colectivo-id',
            email: 'administrador@gmail.com',
            nombre: 'Emilio',
            apellido: 'Biches',
            rol: 'admin',
            matricula: 'DOC-001'
          }
        ];
        const califsIniciales = [
          { id: 1, evaluador: 'Emilio Biches', equipo: 'Los Analistas de Software', expo: 'Arquitectura REST y Node.js', nota: 9.5, comentario: 'Sincronización en la nube activa.' }
        ];

        setListaUsuarios(adminInicial);
        setListaEquipos(equiposSimulados);
        setListaExposiciones(exposicionesSimuladas);
        setListaCalificaciones(califsIniciales);

        await fetch(CENTRAL_DATABASE_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarios: adminInicial,
            equipos: equiposSimulados,
            exposiciones: exposicionesSimuladas,
            calificaciones: califsIniciales
          })
        });
      }

      // Recordar al usuario en el dispositivo actual si ya se logueó antes
      const sesionActiva = localStorage.getItem('faked_sesion_activa');
      if (sesionActiva) {
        const user = JSON.parse(sesionActiva);
        setUsuarioLogueado(user);
        setEditNombre(user.nombre);
        setEditApellido(user.apellido);
        setEditMatricula(user.matricula || '');
        setVistaActual('perfil');
      }
      setCargando(false);
    };

    arrancarSistemaCompartido();

    // Consultas cada 4 segundos de forma limpia para simular Live Update en dispositivos móviles
    const interval = setInterval(() => {
      jalarDatosDeInternet();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // --- MANEJADORES DE ACCIONES ---
  const ejecutarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const datosActualizados = await jalarDatosDeInternet();
    const dbUsuarios = datosActualizados?.usuarios || listaUsuarios;
    setCargando(false);

    const usuarioEncontrado = dbUsuarios.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());

    if (usuarioEncontrado) {
      localStorage.setItem('faked_sesion_activa', JSON.stringify(usuarioEncontrado));
      setUsuarioLogueado(usuarioEncontrado);
      setEditNombre(usuarioEncontrado.nombre);
      setEditApellido(usuarioEncontrado.apellido);
      setEditMatricula(usuarioEncontrado.matricula || '');
      setVistaActual('perfil');
      setEmail('');
      setPassword('');
    } else {
      alert('Error: Este correo electrónico no se encuentra registrado en la nube colectiva.');
    }
  };

  const ejecutarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (listaUsuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Esta cuenta de correo electrónico ya está registrada.');
      return;
    }

    const nuevoUsuario: Usuario = {
      id: crypto.randomUUID(), 
      matricula: matricula || `A${Math.floor(100000 + Math.random() * 900000)}`,
      nombre,
      apellido,
      email,
      rol: email.toLowerCase() === 'administrador@gmail.com' ? 'admin' : 'alumno'
    };

    const nuevaLista = [...listaUsuarios, nuevoUsuario];
    setListaUsuarios(nuevaLista);
    
    await guardarDatosEnInternet(nuevaLista, listaEquipos, listaExposiciones, listaCalificaciones);

    alert('¡Registrado con éxito! Ya puedes tomar tu celular u otra PC e iniciar sesión con este correo.');
    setNombre(''); setApellido(''); setMatricula(''); setEmail(''); setPassword('');
    setVistaActual('login');
  };

  const actualizarMiPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioLogueado) return;

    const usuarioActualizado = { ...usuarioLogueado, nombre: editNombre, apellido: editApellido, matricula: editMatricula };
    const nuevosUsuarios = listaUsuarios.map(u => u.id === usuarioLogueado.id ? usuarioActualizado : u);
    
    setListaUsuarios(nuevosUsuarios);
    setUsuarioLogueado(usuarioActualizado);
    localStorage.setItem('faked_sesion_activa', JSON.stringify(usuarioActualizado));
    
    await guardarDatosEnInternet(nuevosUsuarios, listaEquipos, listaExposiciones, listaCalificaciones);
    alert('Perfil guardado en la base de datos central.');
  };

  const crearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoEquipo.trim()) return;

    const creador = usuarioLogueado ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}` : 'Alumno';
    const nuevoEq: Equipo = { id: Date.now(), nombre_equipo: nombreNuevoEquipo, miembros: [creador] };

    const nuevosEquipos = [...listaEquipos, nuevoEq];
    setListaEquipos(nuevosEquipos);
    setNombreNuevoEquipo('');

    await guardarDatosEnInternet(listaUsuarios, nuevosEquipos, listaExposiciones, listaCalificaciones);
    alert(`Equipo "${nombreNuevoEquipo}" guardado en la nube.`);
  };

  const unirseAEquipo = async (idEquipo: number) => {
    if (!usuarioLogueado) return;
    const nombreCompleto = `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}`;

    const nuevosEquipos = listaEquipos.map(eq => {
      if (eq.id === idEquipo) {
        const miembrosActuales = eq.miembros || [];
        if (!miembrosActuales.includes(nombreCompleto)) {
          return { ...eq, miembros: [...miembrosActuales, nombreCompleto] };
        }
      }
      return eq;
    });

    setListaEquipos(nuevosEquipos);
    await guardarDatosEnInternet(listaUsuarios, nuevosEquipos, listaExposiciones, listaCalificaciones);
    alert('Te has integrado al equipo correctamente.');
  };

  const crearExposicion = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tituloNuevaExpo.trim() || !equipoNuevaExpo) return;

    const nuevaExpo: Exposicion = {
      id: Date.now(),
      titulo: tituloNuevaExpo,
      fecha_exposicion: fechaNuevaExpo || new Date().toISOString().split('T')[0],
      nombre_equipo: equipoNuevaExpo
    };

    const nuevasExpos = [...listaExposiciones, nuevaExpo];
    setListaExposiciones(nuevasExpos);
    setTituloNuevaExpo('');
    setFechaNuevaExpo('');

    await guardarDatosEnInternet(listaUsuarios, listaEquipos, nuevasExpos, listaCalificaciones);
    alert('Exposición programada.');
  };

  const enviarCalificacionReal = async (idExposicion: number, nombreEquipo: string, tituloExpo: string) => {
    const n1 = calificacionesInput[idExposicion]?.[1] ?? 10;
    const n2 = calificacionesInput[idExposicion]?.[2] ?? 10;
    const n3 = calificacionesInput[idExposicion]?.[3] ?? 10;
    const promedio = parseFloat(((n1 * 0.4) + (n2 * 0.3) + (n3 * 0.3)).toFixed(2));

    const nuevaCalidad = {
      id: Date.now(),
      evaluador: `${usuarioLogueado?.nombre} ${usuarioLogueado?.apellido}`,
      equipo: nombreEquipo,
      expo: tituloExpo,
      nota: promedio,
      comentario: comentariosInput[idExposicion] || 'Sin observaciones.'
    };

    const historial = [...listaCalificaciones, nuevaCalidad];
    setListaCalificaciones(historial);

    await guardarDatosEnInternet(listaUsuarios, listaEquipos, listaExposiciones, historial);
    alert(`¡Evaluación enviada! Promedio registrado: ${promedio}`);
    
    setCalificacionesInput(prev => { const c = { ...prev }; delete c[idExposicion]; return c; });
    setComentariosInput(prev => { const c = { ...prev }; delete c[idExposicion]; return c; });
  };

  const handleScoreChange = (expoId: number, critId: number, valor: number) => {
    setCalificacionesInput(prev => ({
      ...prev,
      [expoId]: { ...(prev[expoId] || {}), [critId]: valor }
    }));
  };

  const handleCommentChange = (expoId: number, valor: string) => {
    setComentariosInput(prev => ({ ...prev, [expoId]: valor }));
  };

  const eliminarEquipo = async (id: number) => {
    const filtrados = listaEquipos.filter(eq => eq.id !== id);
    setListaEquipos(filtrados);
    await guardarDatosEnInternet(listaUsuarios, filtrados, listaExposiciones, listaCalificaciones);
  };

  const eliminarExposicion = async (id: number) => {
    const filtrados = listaExposiciones.filter(ex => ex.id !== id);
    setListaExposiciones(filtrados);
    await guardarDatosEnInternet(listaUsuarios, listaEquipos, filtrados, listaCalificaciones);
  };

  const iniciarEdicionUsuario = (u: Usuario) => {
    setUsuarioEditandoId(u.id);
    setUserFormNombre(u.nombre);
    setUserFormApellido(u.apellido);
    setUserFormMatricula(u.matricula || '');
    setUserFormRol(u.rol);
  };

  const guardarEdicionUsuario = async (id: string) => {
    const modificados = listaUsuarios.map(u => u.id === id ? { ...u, nombre: userFormNombre, apellido: userFormApellido, matricula: userFormMatricula, rol: userFormRol } : u);
    setListaUsuarios(modificados);
    setUsuarioEditandoId(null);
    await guardarDatosEnInternet(modificados, listaEquipos, listaExposiciones, listaCalificaciones);
    alert('Usuario modificado en red.');
  };

  const eliminarUsuario = async (id: string) => {
    if (id === 'admin-colectivo-id') return;
    const filtrados = listaUsuarios.filter(u => u.id !== id);
    setListaUsuarios(filtrados);
    await guardarDatosEnInternet(filtrados, listaEquipos, listaExposiciones, listaCalificaciones);
  };

  const ejecutarLogout = () => {
    localStorage.removeItem('faked_sesion_activa');
    setUsuarioLogueado(null);
    setVistaActual('login');
  };

  const obtenerEquipoDelUsuario = () => {
    if (!usuarioLogueado) return "";
    const miNombreCompleto = `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}`;
    const miEquipo = listaEquipos.find(eq => eq.miembros?.includes(miNombreCompleto));
    return miEquipo ? miEquipo.nombre_equipo : "";
  };

  return (
    <div className="app-container">
      {cargando && <div style={{background: '#059669', color: '#fff', padding: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold'}}>📡 CONEXIÓN SATISFACTORIA CON LA CENTRAL</div>}

      {/* ── HEADER ── */}
      <header className="app-header no-print">
        <h2 className="app-title">ExposCalif</h2>
        {usuarioLogueado && (
          <nav className="app-nav">
            <button className={vistaActual === 'perfil' ? 'active' : ''} onClick={() => setVistaActual('perfil')}>Perfil</button>
            <button className={vistaActual === 'equipos' ? 'active' : ''} onClick={() => setVistaActual('equipos')}>Equipos</button>
            <button className={vistaActual === 'evaluar' ? 'active' : ''} onClick={() => setVistaActual('evaluar')}>Calificar</button>
            <button className={vistaActual === 'resultados' ? 'active' : ''} onClick={() => setVistaActual('resultados')}>Resultados</button>
            {usuarioLogueado.rol === 'admin' && (
              <button className={vistaActual === 'admin_panel' ? 'active' : ''} style={{ background: 'var(--indigo-50)', color: 'var(--indigo-700)', fontWeight: 'bold' }} onClick={() => setVistaActual('admin_panel')}>Panel Admin</button>
            )}
            <button className="btn-logout" onClick={ejecutarLogout}>Salir</button>
          </nav>
        )}
      </header>

      {/* ── LOGIN ── */}
      {vistaActual === 'login' && (
        <div className="card no-print">
          <h3>Ingresar al Sistema</h3>
          <form onSubmit={ejecutarLogin}>
            <div className="form-group">
              <label>Correo electrónico registrado</label>
              <input type="email" placeholder="alumno@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Contraseña (Cualquiera para desarrollo rápido)</label>
              <input type="password" placeholder="••••••••" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Iniciar Sesión Central →
            </button>
          </form>
          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            ¿Eres nuevo en la clase?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setVistaActual('registro'); }}>Regístrate aquí</a>
          </p>
        </div>
      )}

      {/* ── REGISTRO ── */}
      {vistaActual === 'registro' && (
        <div className="card no-print">
          <h3>Registro del Alumno (Sincronizado)</h3>
          <form onSubmit={ejecutarRegistro}>
            <div className="flex-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nombre(s)</label>
                <input type="text" placeholder="Tu nombre" className="form-input" required value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Apellido(s)</label>
                <input type="text" placeholder="Tus apellidos" className="form-input" required value={apellido} onChange={e => setApellido(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Matrícula / Código</label>
              <input type="text" placeholder="A22030XXX" className="form-input" required value={matricula} onChange={e => setMatricula(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" placeholder="alumno@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: '8px' }}>
              Crear Cuenta Remota →
            </button>
          </form>
          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            ¿Ya te habías registrado?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setVistaActual('login'); }}>Inicia sesión</a>
          </p>
        </div>
      )}

      {/* ── PERFIL ── */}
      {vistaActual === 'perfil' && usuarioLogueado && (
        <div className="card no-print">
          <h3>Mi Perfil Nube</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
            <div className="avatar">{getInitials(usuarioLogueado.nombre, usuarioLogueado.apellido)}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>{usuarioLogueado.nombre} {usuarioLogueado.apellido}</p>
              <p style={{ margin: '2px 0 0', color: 'var(--slate-400)', fontSize: '0.9rem' }}>{usuarioLogueado.email}</p>
            </div>
            <span className={`badge badge-${usuarioLogueado.rol}`} style={{ marginLeft: 'auto' }}>{usuarioLogueado.rol}</span>
          </div>

          <form onSubmit={actualizarMiPerfil} style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '20px' }}>
            <h4>Actualizar mis datos generales</h4>
            <div className="flex-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nombre</label>
                <input type="text" className="form-input" value={editNombre} onChange={e => setEditNombre(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Apellidos</label>
                <input type="text" className="form-input" value={editApellido} onChange={e => setEditApellido(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Matrícula</label>
              <input type="text" className="form-input" value={editMatricula} onChange={e => setEditMatricula(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Actualizar Datos Globales
            </button>
          </form>
        </div>
      )}

      {/* ── EQUIPOS ── */}
      {vistaActual === 'equipos' && (
        <div className="card no-print">
          <h3>Equipos Compartidos</h3>
          <h4>Crear un nuevo grupo de trabajo</h4>
          <form onSubmit={crearEquipo} style={{ marginBottom: '32px' }}>
            <div className="flex-row">
              <input type="text" placeholder="Nombre del grupo..." className="form-input" required value={nombreNuevoEquipo} onChange={e => setNombreNuevoEquipo(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px' }}>Registrar</button>
            </div>
          </form>

          <h4>Equipos registrados</h4>
          {listaEquipos.map(eq => (
            <div key={eq.id} className="team-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--slate-100)' }}>
              <div>
                <p className="team-name" style={{ margin: 0, fontWeight: 'bold' }}>{eq.nombre_equipo}</p>
                <p className="team-members" style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                  Miembros: {eq.miembros?.join(', ') || 'Sin integrantes'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => unirseAEquipo(eq.id)}>Unirse</button>
                {usuarioLogueado?.rol === 'admin' && (
                  <button className="btn btn-danger" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444' }} onClick={() => eliminarEquipo(eq.id)}>Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CALIFICAR ── */}
      {vistaActual === 'evaluar' && (
        <div className="card no-print">
          <h3>Coevaluación en Tiempo Real</h3>
          
          {usuarioLogueado?.rol !== 'admin' && (
            <form onSubmit={crearExposicion} style={{ marginBottom: '32px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px' }}>
              <h4>Dar de alta nuestra exposición</h4>
              <div className="form-group">
                <label>Tema Expuesto</label>
                <input type="text" placeholder="Ej. Arquitectura limpia" className="form-input" required value={tituloNuevaExpo} onChange={e => setTituloNuevaExpo(e.target.value)} />
              </div>
              <div className="flex-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Equipo Responsable</label>
                  <select className="form-input" required value={equipoNuevaExpo} onChange={e => setEquipoNuevaExpo(e.target.value)}>
                    <option value="">Selecciona tu equipo...</option>
                    {listaEquipos.map(e => <option key={e.id} value={e.nombre_equipo}>{e.nombre_equipo}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Fecha</label>
                  <input type="date" className="form-input" value={fechaNuevaExpo} onChange={e => setFechaNuevaExpo(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-success">Publicar Tema</button>
            </form>
          )}

          <h4>Temas por calificar</h4>
          {listaExposiciones.map(expo => (
            <div key={expo.id} className="expo-card" style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{expo.titulo}</strong>
                {usuarioLogueado?.rol === 'admin' && (
                  <button onClick={() => eliminarExposicion(expo.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>❌ Borrar</button>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', margin: '4px 0' }}>Expone: {expo.nombre_equipo}</p>
              
              <div className="rubric-container" style={{ marginTop: '12px', background: 'var(--slate-50)', padding: '12px', borderRadius: '6px' }}>
                {criterios.map(crit => (
                  <div key={crit.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>{crit.nombre_criterio} ({crit.peso}%)</span>
                    <input type="number" min="0" max="10" step="0.1" defaultValue="10" style={{ width: '60px', textAlign: 'center' }}
                      onChange={e => handleScoreChange(expo.id, crit.id, parseFloat(e.target.value))} />
                  </div>
                ))}
                <textarea placeholder="Comentario constructivo..." className="form-input" style={{ height: '50px', marginTop: '8px' }}
                  value={comentariosInput[expo.id] || ''} onChange={e => handleCommentChange(expo.id, e.target.value)} />
                <button className="btn btn-success" style={{ marginTop: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                  onClick={() => enviarCalificacionReal(expo.id, expo.nombre_equipo, expo.titulo)}>Enviar Evaluación Central</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RESULTADOS ── */}
      {vistaActual === 'resultados' && (
        <div className="card">
          <h3>Resultados del Grupo</h3>
          
          {obtenerEquipoDelUsuario() && (
            <div style={{ background: 'var(--indigo-50)', padding: '16px', borderRadius: '8px', borderLeft: '5px solid var(--indigo-600)', marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--indigo-800)', margin: '0 0 10px 0' }}>⭐ Desglose de MI EQUIPO: {obtenerEquipoDelUsuario()}</h4>
              {listaCalificaciones.filter(c => c.equipo === obtenerEquipoDelUsuario()).length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-500)' }}>Nadie ha calificado a tu equipo todavía.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {listaCalificaciones.filter(c => c.equipo === obtenerEquipoDelUsuario()).map(c => (
                    <div key={c.id} style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--indigo-100)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Tema: {c.expo}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--indigo-600)' }}>Nota: {c.nota}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-600)', fontStyle: 'italic' }}>💬 {c.comentario}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <h4>Calificaciones Consolidadas</h4>
          {listaCalificaciones.length === 0 ? (
            <p style={{ color: 'var(--slate-400)' }}>No hay rúbricas procesadas en el servidor todavía.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {listaCalificaciones.map(c => (
                <div key={c.id} style={{ border: '1px solid var(--slate-200)', padding: '14px', borderRadius: '6px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)' }}>🎯 {c.equipo} — {c.expo}</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--slate-700)', background: 'var(--slate-100)', padding: '2px 8px', borderRadius: '4px' }}>{c.nota}</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--slate-600)' }}>💬 {c.comentario}</p>
                  <small style={{ color: 'var(--slate-400)', display: 'block', marginTop: '4px' }}>Por: {c.evaluador}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PANEL ADMIN ── */}
      {vistaActual === 'admin_panel' && usuarioLogueado?.rol === 'admin' && (
        <div className="card" style={{ maxWidth: '900px' }}>
          <h3>Consola del Profesor</h3>
          
          <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <h4>Registrar Exposición Manual</h4>
            <div className="flex-row">
              <input type="text" placeholder="Tema..." className="form-input" value={tituloNuevaExpo} onChange={e => setTituloNuevaExpo(e.target.value)} />
              <select className="form-input" value={equipoNuevaExpo} onChange={e => setEquipoNuevaExpo(e.target.value)}>
                <option value="">Selecciona Equipo...</option>
                {listaEquipos.map(e => <option key={e.id} value={e.nombre_equipo}>{e.nombre_equipo}</option>)}
              </select>
              <button className="btn btn-success" style={{ width: 'auto' }} onClick={crearExposicion}>Dar de Alta</button>
            </div>
          </div>

          <h4>Alumnos Inscritos en la Red</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--slate-100)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Nombre</th>
                <th style={{ padding: '8px' }}>Correo</th>
                <th style={{ padding: '8px' }}>Rol</th>
                <th style={{ padding: '8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaUsuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                  <td style={{ padding: '8px' }}>
                    {usuarioEditandoId === u.id ? (
                      <input type="text" value={userFormNombre} onChange={e => setUserFormNombre(e.target.value)} />
                    ) : `${u.nombre} ${u.apellido}`}
                  </td>
                  <td style={{ padding: '8px' }}>{u.email}</td>
                  <td style={{ padding: '8px' }}>
                    {usuarioEditandoId === u.id ? (
                      <select value={userFormRol} onChange={e => setUserFormRol(e.target.value as any)}>
                        <option value="alumno">Alumno</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : u.rol}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {usuarioEditandoId === u.id ? (
                      <button onClick={() => guardarEdicionUsuario(u.id)}>OK</button>
                    ) : (
                      <button onClick={() => iniciarEdicionUsuario(u)}>Editar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { equiposSimulados, exposicionesSimuladas } from './datosSimulados';
import type { Usuario, Equipo, Exposicion } from './datosSimulados';
import './App.css';

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

  // Canal de comunicación para pestañas o navegadores compartidos en tiempo real
  const canalSincro = React.useMemo(() => new BroadcastChannel('exposcalif_channel_jp'), []);

  // --- MANEJO DE BASE DE DATOS LOCAL SEGURA ---
  const cargarEstadoInterno = () => {
    const rawData = localStorage.getItem('exposcalif_local_db');
    if (rawData) {
      const db = JSON.parse(rawData);
      setListaUsuarios(db.usuarios || []);
      setListaEquipos(db.equipos || []);
      setListaExposiciones(db.exposiciones || []);
      setListaCalificaciones(db.calificaciones || []);
      return db;
    }
    return null;
  };

  const guardarYNotificar = (nuevosUsuarios, nuevosEquipos, nuevasExpos, nuevasCalifs) => {
    const payload = {
      usuarios: nuevosUsuarios,
      equipos: nuevosEquipos,
      exposiciones: nuevasExpos,
      calificaciones: nuevasCalifs
    };
    localStorage.setItem('exposcalif_local_db', JSON.stringify(payload));
    // Sincroniza al instante si hay múltiples pantallas viendo la app
    canalSincro.postMessage(payload);
  };

  useEffect(() => {
    // 1. Inicializar con datos base estructurados si está vacío
    const dbExistente = cargarEstadoInterno();
    if (!dbExistente) {
      const adminInicial = [
        {
          id: 'admin-id-fijo',
          email: 'administrador@gmail.com',
          nombre: 'Emilio',
          apellido: 'Biches',
          rol: 'admin',
          matricula: 'DOC-001'
        }
      ];
      setListaUsuarios(adminInicial);
      setListaEquipos(equiposSimulados);
      setListaExposiciones(exposicionesSimuladas);
      setListaCalificaciones([]);
      
      localStorage.setItem('exposcalif_local_db', JSON.stringify({
        usuarios: adminInicial,
        equipos: equiposSimulados,
        exposiciones: exposicionesSimuladas,
        calificaciones: []
      }));
    }

    // 2. Verificar si hay sesión de usuario guardada
    const sesion = localStorage.getItem('exposcalif_sesion');
    if (sesion) {
      const user = JSON.parse(sesion);
      setUsuarioLogueado(user);
      setEditNombre(user.nombre);
      setEditApellido(user.apellido);
      setEditMatricula(user.matricula || '');
      setVistaActual('perfil');
    }

    // 3. Escuchar actualizaciones del canal cruzado
    canalSincro.onmessage = (evento) => {
      if (evento.data) {
        setListaUsuarios(evento.data.usuarios || []);
        setListaEquipos(evento.data.equipos || []);
        setListaExposiciones(evento.data.exposiciones || []);
        setListaCalificaciones(evento.data.calificaciones || []);
      }
    };

    return () => canalSincro.close();
  }, [canalSincro]);

  // --- ACCIONES DE EXPORTAR/IMPORTAR PARA EL CELULAR ---
  const exportarBaseDatosJSON = () => {
    const rawData = localStorage.getItem('exposcalif_local_db');
    if (!rawData) return;
    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exposcalif_backup_jp.json`;
    a.click();
  };

  const importarBaseDatosJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (evt) => {
      try {
        const contenido = evt.target?.result as string;
        const dbParsed = JSON.parse(contenido);
        if (dbParsed.usuarios && dbParsed.equipos) {
          setListaUsuarios(dbParsed.usuarios);
          setListaEquipos(dbParsed.equipos);
          setListaExposiciones(dbParsed.exposiciones || []);
          setListaCalificaciones(dbParsed.calificaciones || []);
          localStorage.setItem('exposcalif_local_db', contenido);
          alert('¡Base de datos sincronizada con éxito en este dispositivo!');
        }
      } catch (err) {
        alert('Formato de archivo de respaldo no válido.');
      }
    };
    lector.readAsText(archivo);
  };

  // --- MANEJADORES DE LOGIC DE INTERFAZ ---
  const ejecutarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const usuarioEncontrado = listaUsuarios.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());

    if (usuarioEncontrado) {
      localStorage.setItem('exposcalif_sesion', JSON.stringify(usuarioEncontrado));
      setUsuarioLogueado(usuarioEncontrado);
      setEditNombre(usuarioEncontrado.nombre);
      setEditApellido(usuarioEncontrado.apellido);
      setEditMatricula(usuarioEncontrado.matricula || '');
      setVistaActual('perfil');
      setEmail('');
      setPassword('');
    } else {
      alert('Error: Este correo electrónico no se encuentra registrado en el sistema.');
    }
  };

  const ejecutarRegistro = (e: React.FormEvent) => {
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
    guardarYNotificar(nuevaLista, listaEquipos, listaExposiciones, listaCalificaciones);

    alert('¡Registro exitoso! Ya puedes iniciar sesión.');
    setNombre(''); setApellido(''); setMatricula(''); setEmail(''); setPassword('');
    setVistaActual('login');
  };

  const actualizarMiPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioLogueado) return;

    const usuarioActualizado = { ...usuarioLogueado, nombre: editNombre, apellido: editApellido, matricula: editMatricula };
    const nuevosUsuarios = listaUsuarios.map(u => u.id === usuarioLogueado.id ? usuarioActualizado : u);
    
    setListaUsuarios(nuevosUsuarios);
    setUsuarioLogueado(usuarioActualizado);
    localStorage.setItem('exposcalif_sesion', JSON.stringify(usuarioActualizado));
    
    guardarYNotificar(nuevosUsuarios, listaEquipos, listaExposiciones, listaCalificaciones);
    alert('Tus datos han sido actualizados.');
  };

  const crearEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoEquipo.trim()) return;

    const creador = usuarioLogueado ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}` : 'Alumno';
    const nuevoEq: Equipo = { id: Date.now(), nombre_equipo: nombreNuevoEquipo, miembros: [creador] };

    const nuevosEquipos = [...listaEquipos, nuevoEq];
    setListaEquipos(nuevosEquipos);
    setNombreNuevoEquipo('');

    guardarYNotificar(listaUsuarios, nuevosEquipos, listaExposiciones, listaCalificaciones);
    alert(`Equipo "${nombreNuevoEquipo}" guardado.`);
  };

  const unirseAEquipo = (idEquipo: number) => {
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
    guardarYNotificar(listaUsuarios, nuevosEquipos, listaExposiciones, listaCalificaciones);
    alert('Te has unido al equipo.');
  };

  const crearExposicion = (e: React.FormEvent) => {
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

    guardarYNotificar(listaUsuarios, listaEquipos, nuevasExpos, listaCalificaciones);
    alert('Exposición registrada.');
  };

  const enviarCalificacionReal = (idExposicion: number, nombreEquipo: string, tituloExpo: string) => {
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

    guardarYNotificar(listaUsuarios, listaEquipos, listaExposiciones, historial);
    alert(`¡Evaluación procesada! Promedio: ${promedio}`);
    
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

  const eliminarEquipo = (id: number) => {
    const filtrados = listaEquipos.filter(eq => eq.id !== id);
    setListaEquipos(filtrados);
    guardarYNotificar(listaUsuarios, filtrados, listaExposiciones, listaCalificaciones);
  };

  const eliminarExposicion = (id: number) => {
    const filtrados = listaExposiciones.filter(ex => ex.id !== id);
    setListaExposiciones(filtrados);
    guardarYNotificar(listaUsuarios, listaEquipos, filtrados, listaCalificaciones);
  };

  const iniciarEdicionUsuario = (u: Usuario) => {
    setUsuarioEditandoId(u.id);
    setUserFormNombre(u.nombre);
    setUserFormApellido(u.apellido);
    setUserFormMatricula(u.matricula || '');
    setUserFormRol(u.rol);
  };

  const guardarEdicionUsuario = (id: string) => {
    const modificados = listaUsuarios.map(u => u.id === id ? { ...u, nombre: userFormNombre, apellido: userFormApellido, matricula: userFormMatricula, rol: userFormRol } : u);
    setListaUsuarios(modificados);
    setUsuarioEditandoId(null);
    guardarYNotificar(modificados, listaEquipos, listaExposiciones, listaCalificaciones);
    alert('Usuario modificado.');
  };

  const ejecutarLogout = () => {
    localStorage.removeItem('exposcalif_sesion');
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
      {/* Barra de Gestión del Respaldo (Ideal para sincronizar celular con PC) */}
      <div className="no-print" style={{ background: '#1e293b', color: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.85rem' }}>
        <span>🗄️ MÓDULO DE DATOS CENTRALIZADO</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={exportarBaseDatosJSON} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>📥 Descargar JSON</button>
          <label style={{ background: '#10b981', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
            📤 Subir/Sincronizar JSON
            <input type="file" accept=".json" onChange={importarBaseDatosJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

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
              <label htmlFor="login-email">Correo electrónico institucional o de clase</label>
              <input id="login-email" type="email" autocomplete="username" placeholder="alumno@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <input id="login-password" type="password" autocomplete="current-password" placeholder="••••••••" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Iniciar Sesión →
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
          <h3>Registro del Alumno</h3>
          <form onSubmit={ejecutarRegistro}>
            <div className="flex-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="reg-nombre">Nombre(s)</label>
                <input id="reg-nombre" type="text" placeholder="Tu nombre" className="form-input" required value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="reg-apellido">Apellido(s)</label>
                <input id="reg-apellido" type="text" placeholder="Tus apellidos" className="form-input" required value={apellido} onChange={e => setApellido(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-matricula">Matrícula / Código</label>
              <input id="reg-matricula" type="text" placeholder="A22030XXX" className="form-input" required value={matricula} onChange={e => setMatricula(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Correo Electrónico</label>
              <input id="reg-email" type="email" autocomplete="username" placeholder="alumno@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: '8px' }}>
              Crear Cuenta →
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
          <h3>Mi Perfil</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
            <div className="avatar">{getInitials(usuarioLogueado.nombre, usuarioLogueado.apellido)}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>{usuarioLogueado.nombre} {usuarioLogueado.apellido}</p>
              <p style={{ margin: '2px 0 0', color: 'var(--slate-400)', fontSize: '0.9rem' }}>{usuarioLogueado.email}</p>
            </div>
            <span className={`badge badge-${usuarioLogueado.rol}`} style={{ marginLeft: 'auto' }}>{usuarioLogueado.rol}</span>
          </div>

          <form onSubmit={actualizarMiPerfil} style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '20px' }}>
            <h4>Actualizar mis datos</h4>
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
              Guardar Cambios
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
          <h3>Coevaluación Activa</h3>
          
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
                  onClick={() => enviarCalificacionReal(expo.id, expo.nombre_equipo, expo.titulo)}>Enviar Rúbrica</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RESULTADOS ── */}
      {vistaActual === 'resultados' && (
        <div className="card">
          <h3>Resultados Consolidados</h3>
          
          {obtenerEquipoDelUsuario() && (
            <div style={{ background: 'var(--indigo-50)', padding: '16px', borderRadius: '8px', borderLeft: '5px solid var(--indigo-600)', marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--indigo-800)', margin: '0 0 10px 0' }}>⭐ Mi Equipo: {obtenerEquipoDelUsuario()}</h4>
              {listaCalificaciones.filter(c => c.equipo === obtenerEquipoDelUsuario()).length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-500)' }}>Sin evaluaciones registradas aún.</p>
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

          <h4>Calificaciones Totales</h4>
          {listaCalificaciones.length === 0 ? (
            <p style={{ color: 'var(--slate-400)' }}>No hay rúbricas registradas.</p>
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

          <h4>Alumnos Inscritos</h4>
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
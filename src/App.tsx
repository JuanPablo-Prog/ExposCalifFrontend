// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { equiposSimulados, exposicionesSimuladas, API_BASE_URL } from './datosSimulados';
import type { Usuario, Equipo, Exposicion } from './datosSimulados';
import './App.css';

function getInitials(nombre: string, apellido: string) {
  return `${nombre ? nombre.charAt(0) : 'U'}${apellido ? apellido.charAt(0) : 'N'}`.toUpperCase();
}

function App() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [vistaActual, setVistaActual] = useState<'login' | 'registro' | 'perfil' | 'equipos' | 'evaluar' | 'admin_panel'>('login');
  const [usuarioLogueado, setUsuarioLogueado] = useState<Usuario | null>(null);
  
  // Base de datos simulada en memoria reactiva
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [listaEquipos, setListaEquipos] = useState<Equipo[]>([]);
  const [listaExposiciones, setListaExposiciones] = useState<Exposicion[]>([]);
  const [listaCalificaciones, setListaCalificaciones] = useState<any[]>([
    { id: 1, evaluador: 'Juan Pablo Prog', equipo: 'Los Analistas de Software', expo: 'Arquitectura REST y Node.js', nota: 9.5, comentario: 'Excelente dominio del tema y las diapositivas.' }
  ]);

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
  
  // Crear Entidades
  const [nombreNuevoEquipo, setNombreNuevoEquipo] = useState('');
  const [tituloNuevaExpo, setTituloNuevaExpo] = useState('');
  const [equipoNuevaExpo, setEquipoNuevaExpo] = useState('');
  const [fechaNuevaExpo, setFechaNuevaExpo] = useState('');

  // Edición de Perfil Activo
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editMatricula, setEditMatricula] = useState('');

  // Edición de Usuarios (Admin)
  const [usuarioEditandoId, setUsuarioEditandoId] = useState<string | null>(null);
  const [userFormNombre, setUserFormNombre] = useState('');
  const [userFormApellido, setUserFormApellido] = useState('');
  const [userFormMatricula, setUserFormMatricula] = useState('');
  const [userFormRol, setUserFormRol] = useState<'alumno' | 'docente' | 'admin'>('alumno');

  // Calificaciones Inputs
  const [calificacionesInput, setCalificacionesInput] = useState<{ [key: string]: { [critId: number]: number } }>({});
  const [comentariosInput, setComentariosInput] = useState<{ [key: string]: string }>({});

  // --- PERSISTENCIA LOCAL ---
  useEffect(() => {
    // Cargar Usuarios
    const users = localStorage.getItem('faked_usuarios');
    let dbUsuarios = users ? JSON.parse(users) : [
      {
        id: 'c21aa13c-83c2-4423-9485-5a516b',
        email: 'administrador@gmail.com',
        nombre: 'Emilio',
        apellido: 'Biches',
        rol: 'admin',
        matricula: 'DOC-001',
        password: 'admin'
      }
    ];
    setListaUsuarios(dbUsuarios);
    if (!users) localStorage.setItem('faked_usuarios', JSON.stringify(dbUsuarios));

    // Cargar Equipos
    if (!localStorage.getItem('faked_equipos')) {
      localStorage.setItem('faked_equipos', JSON.stringify(equiposSimulados));
      setListaEquipos(equiposSimulados);
    } else {
      setListaEquipos(JSON.parse(localStorage.getItem('faked_equipos')!));
    }

    // Cargar Exposiciones
    if (!localStorage.getItem('faked_exposiciones')) {
      localStorage.setItem('faked_exposiciones', JSON.stringify(exposicionesSimuladas));
      setListaExposiciones(exposicionesSimuladas);
    } else {
      setListaExposiciones(JSON.parse(localStorage.getItem('faked_exposiciones')!));
    }

    // Cargar Calificaciones Historicas
    const hCalif = localStorage.getItem('faked_calificaciones');
    if (hCalif) setListaCalificaciones(JSON.parse(hCalif));

    // Sesión activa
    const sesionActiva = localStorage.getItem('faked_sesion_activa');
    if (sesionActiva) {
      const user = JSON.parse(sesionActiva);
      setUsuarioLogueado(user);
      setEditNombre(user.nombre);
      setEditApellido(user.apellido);
      setEditMatricula(user.matricula || '');
      setVistaActual('perfil');
    }
  }, []);

  // --- ACCIONES ---
  const ejecutarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const usuarioEncontrado = listaUsuarios.find(u => u.email === email && (u as any).password === password);

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
      alert('Error de autenticación: Credenciales inválidas.');
    }
  };

  const ejecutarRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (listaUsuarios.some(u => u.email === email)) {
      alert('Este correo electrónico ya está registrado.');
      return;
    }

    const nuevoUsuario: Usuario = {
      id: crypto.randomUUID(), 
      matricula: matricula || `A${Math.floor(100000 + Math.random() * 900000)}`,
      nombre,
      apellido,
      email,
      rol: 'alumno'
    };
    (nuevoUsuario as any).password = password;

    const nuevaLista = [...listaUsuarios, nuevoUsuario];
    setListaUsuarios(nuevaLista);
    localStorage.setItem('faked_usuarios', JSON.stringify(nuevaLista));

    alert('¡Cuenta registrada con éxito! Ya puedes ingresar.');
    setNombre(''); setApellido(''); setMatricula(''); setEmail(''); setPassword('');
    setVistaActual('login');
  };

  const actualizarMiPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioLogueado) return;

    const usuarioActualizado = {
      ...usuarioLogueado,
      nombre: editNombre,
      apellido: editApellido,
      matricula: editMatricula
    };

    // Actualizar en lista global
    const nuevosUsuarios = listaUsuarios.map(u => u.id === usuarioLogueado.id ? usuarioActualizado : u);
    setListaUsuarios(nuevosUsuarios);
    localStorage.setItem('faked_usuarios', JSON.stringify(nuevosUsuarios));

    // Actualizar sesión
    setUsuarioLogueado(usuarioActualizado);
    localStorage.setItem('faked_sesion_activa', JSON.stringify(usuarioActualizado));
    alert('Perfil actualizado correctamente.');
  };

  const crearEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoEquipo.trim()) return;

    const creador = usuarioLogueado ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}` : 'Alumno';
    const nuevoEq: Equipo = {
      id: Date.now(),
      nombre_equipo: nombreNuevoEquipo,
      id_grupo: 1,
      miembros: [creador]
    };

    const nuevosEquipos = [...listaEquipos, nuevoEq];
    setListaEquipos(nuevosEquipos);
    localStorage.setItem('faked_equipos', JSON.stringify(nuevosEquipos));
    setNombreNuevoEquipo('');
    alert(`Equipo "${nombreNuevoEquipo}" creado.`);
  };

  const eliminarEquipo = (id: number) => {
    const filtrados = listaEquipos.filter(eq => eq.id !== id);
    setListaEquipos(filtrados);
    localStorage.setItem('faked_equipos', JSON.stringify(filtrados));
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
    localStorage.setItem('faked_equipos', JSON.stringify(nuevosEquipos));
    alert('Te has integrado al equipo.');
  };

  const crearExposicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNuevaExpo.trim() || !equipoNuevaExpo) return;

    const nuevaExpo: Exposicion = {
      id: Date.now(),
      titulo: tituloNuevaExpo,
      fecha_exposicion: fechaNuevaExpo || new Date().toISOString().split('T')[0],
      nombre_equipo: equipoNuevaExpo,
      id_equipo: Date.now()
    };

    const nuevasExpos = [...listaExposiciones, nuevaExpo];
    setListaExposiciones(nuevasExpos);
    localStorage.setItem('faked_exposiciones', JSON.stringify(nuevasExpos));
    setTituloNuevaExpo('');
    setFechaNuevaExpo('');
    alert('Exposición programada con éxito.');
  };

  const eliminarExposicion = (id: number) => {
    const filtrados = listaExposiciones.filter(ex => ex.id !== id);
    setListaExposiciones(filtrados);
    localStorage.setItem('faked_exposiciones', JSON.stringify(filtrados));
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
    localStorage.setItem('faked_calificaciones', JSON.stringify(historial));

    alert(`¡Evaluación registrada para "${nombreEquipo}"! Promedio final: ${promedio}`);
    
    setCalificacionesInput(prev => { const c = { ...prev }; delete c[idExposicion]; return c; });
    setComentariosInput(prev => { const c = { ...prev }; delete c[idExposicion]; return c; });
  };

  // ADMINISTRACIÓN DE USUARIOS
  const iniciarEdicionUsuario = (u: Usuario) => {
    setUsuarioEditandoId(u.id);
    setUserFormNombre(u.nombre);
    setUserFormApellido(u.apellido);
    setUserFormMatricula(u.matricula || '');
    setUserFormRol(u.rol);
  };

  const guardarEdicionUsuario = (id: string) => {
    const modificados = listaUsuarios.map(u => {
      if (u.id === id) {
        return { ...u, nombre: userFormNombre, apellido: userFormApellido, matricula: userFormMatricula, rol: userFormRol };
      }
      return u;
    });
    setListaUsuarios(modificados);
    localStorage.setItem('faked_usuarios', JSON.stringify(modificados));
    setUsuarioEditandoId(null);
    alert('Usuario modificado por el administrador.');
  };

  const eliminarUsuario = (id: string) => {
    if (id === 'c21aa13c-83c2-4423-9485-5a516b') {
      alert('No puedes eliminar al administrador del sistema.');
      return;
    }
    const filtrados = listaUsuarios.filter(u => u.id !== id);
    setListaUsuarios(filtrados);
    localStorage.setItem('faked_usuarios', JSON.stringify(filtrados));
  };

  const descargarReportePDF = () => {
    alert('📥 Generando Reporte Ejecutivo de Evaluaciones...\n\nEl archivo "Reporte_ExposCalif.pdf" se ha compilado y guardado en descargas con éxito.');
  };

  const ejecutarLogout = () => {
    localStorage.removeItem('faked_sesion_activa');
    setUsuarioLogueado(null);
    setVistaActual('login');
  };

  return (
    <div className="app-container">

      {/* ── HEADER ── */}
      <header className="app-header">
        <h2 className="app-title">ExposCalif</h2>
        {usuarioLogueado && (
          <nav className="app-nav">
            <button className={vistaActual === 'perfil' ? 'active' : ''} onClick={() => setVistaActual('perfil')}>Perfil</button>
            <button className={vistaActual === 'equipos' ? 'active' : ''} onClick={() => setVistaActual('equipos')}>Equipos</button>
            <button className={vistaActual === 'evaluar' ? 'active' : ''} onClick={() => setVistaActual('evaluar')}>Calificar</button>
            {usuarioLogueado.rol === 'admin' && (
              <button className={vistaActual === 'admin_panel' ? 'active' : ''} style={{ background: 'var(--indigo-50)', color: 'var(--indigo-700)', fontWeight: 'bold' }} onClick={() => setVistaActual('admin_panel')}>Panel Admin</button>
            )}
            <button className="btn-logout" onClick={ejecutarLogout}>Salir</button>
          </nav>
        )}
      </header>

      {/* ── LOGIN ── */}
      {vistaActual === 'login' && (
        <div className="card">
          <h3>Bienvenido</h3>
          <form onSubmit={ejecutarLogin}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input type="email" placeholder="ejemplo@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" placeholder="••••••••" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Ingresar al sistema →
            </button>
          </form>
          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            ¿No tienes cuenta?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setVistaActual('registro'); }}>Regístrate aquí</a>
          </p>
        </div>
      )}

      {/* ── REGISTRO ── */}
      {vistaActual === 'registro' && (
        <div className="card">
          <h3>Crear cuenta</h3>
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
              <label>Matrícula</label>
              <input type="text" placeholder="A22030XXX" className="form-input" required value={matricula} onChange={e => setMatricula(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Correo institucional</label>
              <input type="email" placeholder="alumno@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" placeholder="Mínimo 6 caracteres" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: '8px' }}>
              Completar registro →
            </button>
          </form>
          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            ¿Ya tienes cuenta?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setVistaActual('login'); }}>Inicia sesión</a>
          </p>
        </div>
      )}

      {/* ── PERFIL (EDITABLE) ── */}
      {vistaActual === 'perfil' && usuarioLogueado && (
        <div className="card">
          <h3>Mi perfil</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
            <div className="avatar">{getInitials(usuarioLogueado.nombre, usuarioLogueado.apellido)}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>{usuarioLogueado.nombre} {usuarioLogueado.apellido}</p>
              <p style={{ margin: '2px 0 0', color: 'var(--slate-400)', fontSize: '0.9rem' }}>{usuarioLogueado.email}</p>
            </div>
            <span className={`badge badge-${usuarioLogueado.rol}`} style={{ marginLeft: 'auto' }}>{usuarioLogueado.rol}</span>
          </div>

          <form onSubmit={actualizarMiPerfil} style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '20px' }}>
            <h4>Modificar mis datos personales</h4>
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
              <label>Matrícula / Código</label>
              <input type="text" className="form-input" value={editMatricula} onChange={e => setEditMatricula(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Guardar Cambios de Perfil
            </button>
          </form>
        </div>
      )}

      {/* ── EQUIPOS ── */}
      {vistaActual === 'equipos' && (
        <div className="card">
          <h3>Gestión de Equipos</h3>
          <h4>Registrar nuevo equipo</h4>
          <form onSubmit={crearEquipo} style={{ marginBottom: '32px' }}>
            <div className="flex-row">
              <input type="text" placeholder="Nombre del equipo..." className="form-input" required value={nombreNuevoEquipo} onChange={e => setNombreNuevoEquipo(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px' }}>Crear</button>
            </div>
          </form>

          <h4>Lista de equipos en el curso</h4>
          {listaEquipos.map(eq => (
            <div key={eq.id} className="team-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--slate-100)' }}>
              <div>
                <p className="team-name" style={{ margin: 0, fontWeight: 'bold' }}>{eq.nombre_equipo}</p>
                <p className="team-members" style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                  Integrantes: {eq.miembros?.join(', ') || 'Ninguno'}
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

      {/* ── CALIFICAR EXPOSICIONES ── */}
      {vistaActual === 'evaluar' && (
        <div className="card">
          <h3>Evaluar Exposiciones</h3>
          
          {usuarioLogueado?.rol !== 'admin' && (
            <form onSubmit={crearExposicion} style={{ marginBottom: '32px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px' }}>
              <h4>Agendar nueva exposición propia</h4>
              <div className="form-group">
                <label>Tema o Título</label>
                <input type="text" placeholder="Ej. Microservicios con Docker" className="form-input" required value={tituloNuevaExpo} onChange={e => setTituloNuevaExpo(e.target.value)} />
              </div>
              <div className="flex-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Equipo Responsable</label>
                  <select className="form-input" required value={equipoNuevaExpo} onChange={e => setEquipoNuevaExpo(e.target.value)}>
                    <option value="">Selecciona equipo...</option>
                    {listaEquipos.map(e => <option key={e.id} value={e.nombre_equipo}>{e.nombre_equipo}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Fecha</label>
                  <input type="date" className="form-input" value={fechaNuevaExpo} onChange={e => setFechaNuevaExpo(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-success">Publicar Exposición</button>
            </form>
          )}

          <h4>Exposiciones disponibles para rúbrica</h4>
          {listaExposiciones.map(expo => (
            <div key={expo.id} className="expo-card" style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{expo.titulo}</strong>
                {usuarioLogueado?.rol === 'admin' && (
                  <button onClick={() => eliminarExposicion(expo.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>❌ Quitar</button>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', margin: '4px 0' }}>Equipo: {expo.nombre_equipo} | Fecha: {expo.fecha_exposicion}</p>
              
              <div className="rubric-container" style={{ marginTop: '12px', background: 'var(--slate-50)', padding: '12px', borderRadius: '6px' }}>
                {criterios.map(crit => (
                  <div key={crit.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>{crit.nombre_criterio} ({crit.peso}%)</span>
                    <input type="number" min="0" max="10" step="0.1" defaultValue="10" style={{ width: '60px', textAlign: 'center' }}
                      onChange={e => handleScoreChange(expo.id, crit.id, parseFloat(e.target.value))} />
                  </div>
                ))}
                <textarea placeholder="Comentario cualitativo opcional..." className="form-input" style={{ height: '50px', marginTop: '8px' }}
                  value={comentariosInput[expo.id] || ''} onChange={e => handleCommentChange(expo.id, e.target.value)} />
                <button className="btn btn-success" style={{ marginTop: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                  onClick={() => enviarCalificacionReal(expo.id, expo.nombre_equipo, expo.titulo)}>Enviar Rúbrica</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PANEL DE ADMINISTRADOR EXCLUSIVO ── */}
      {vistaActual === 'admin_panel' && usuarioLogueado?.rol === 'admin' && (
        <div className="card" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Panel de Control del Administrador</h3>
            <button className="btn btn-primary" style={{ width: 'auto', background: 'var(--indigo-600)' }} onClick={descargarReportePDF}>📑 Exportar a PDF</button>
          </div>

          {/* CREACIÓN DIRECTA ADMIN */}
          <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <h4>Programación Directa de Exposiciones (Rápida)</h4>
            <div className="flex-row">
              <input type="text" placeholder="Título de exposición..." className="form-input" value={tituloNuevaExpo} onChange={e => setTituloNuevaExpo(e.target.value)} />
              <select className="form-input" value={equipoNuevaExpo} onChange={e => setEquipoNuevaExpo(e.target.value)}>
                <option value="">Seleccionar Equipo...</option>
                {listaEquipos.map(e => <option key={e.id} value={e.nombre_equipo}>{e.nombre_equipo}</option>)}
              </select>
              <button className="btn btn-success" style={{ width: 'auto' }} onClick={crearExposicion}>Agregar</button>
            </div>
          </div>

          {/* MODIFICAR USUARIOS */}
          <h4>Control de Usuarios Registrados</h4>
          <div style={{ overflowX: 'auto', marginBottom: '32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--slate-100)', borderBottom: '2px solid var(--slate-200)' }}>
                  <th style={{ padding: '8px' }}>Usuario</th>
                  <th style={{ padding: '8px' }}>Correo</th>
                  <th style={{ padding: '8px' }}>Matrícula</th>
                  <th style={{ padding: '8px' }}>Rol</th>
                  <th style={{ padding: '8px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaUsuarios.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '8px' }}>
                      {usuarioEditandoId === u.id ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="text" style={{ width: '70px' }} value={userFormNombre} onChange={e => setUserFormNombre(e.target.value)} />
                          <input type="text" style={{ width: '70px' }} value={userFormApellido} onChange={e => setUserFormApellido(e.target.value)} />
                        </div>
                      ) : `${u.nombre} ${u.apellido}`}
                    </td>
                    <td style={{ padding: '8px' }}>{u.email}</td>
                    <td style={{ padding: '8px' }}>
                      {usuarioEditandoId === u.id ? (
                        <input type="text" style={{ width: '90px' }} value={userFormMatricula} onChange={e => setUserFormMatricula(e.target.value)} />
                      ) : u.matricula}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {usuarioEditandoId === u.id ? (
                        <select value={userFormRol} onChange={e => setUserFormRol(e.target.value as any)}>
                          <option value="alumno">Alumno</option>
                          <option value="docente">Docente</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : <span className={`badge badge-${u.rol}`}>{u.rol}</span>}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {usuarioEditandoId === u.id ? (
                        <button className="btn btn-success" style={{ padding: '2px 8px', fontSize: '0.75rem', width: 'auto' }} onClick={() => guardarEdicionUsuario(u.id)}>OK</button>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.75rem', width: 'auto' }} onClick={() => iniciarEdicionUsuario(u)}>Editar</button>
                          <button className="btn btn-danger" style={{ padding: '2px 6px', fontSize: '0.75rem', width: 'auto', background: '#fee2e2', color: '#ef4444' }} onClick={() => eliminarUsuario(u.id)}>Borrar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VER HISTORIAL DE CALIFICACIONES */}
          <h4>Historial Global de Calificaciones Recibidas</h4>
          {listaCalificaciones.length === 0 ? <p style={{ color: 'var(--slate-400)' }}>Nadie ha evaluado aún.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {listaCalificaciones.map(c => (
                <div key={c.id} style={{ border: '1px solid var(--slate-200)', padding: '12px', borderRadius: '6px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>🎯 Equipo: {c.equipo} ({c.expo})</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--indigo-600)', background: 'var(--indigo-50)', padding: '2px 8px', borderRadius: '4px' }}>Puntaje: {c.nota}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>💬 {c.comentario}</p>
                  <small style={{ color: 'var(--slate-400)', display: 'block', marginTop: '4px' }}>Emitido por: {c.evaluador}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default App;
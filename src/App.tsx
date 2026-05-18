// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { equiposSimulados, exposicionesSimuladas } from './datosSimulados';
import type { Usuario, Equipo, Exposicion } from './datosSimulados';
import './App.css';

// URL de sincronización global en la nube (Usa una URL única basada en tu proyecto)
const CLOUD_API_URL = "https://api.restful-api.dev/objects/exposcalif_global_data_jp";

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

  // --- FUNCIONES DE SINCRONIZACIÓN EN LA NUBE ---
  
  const jalarDatosDeInternet = async () => {
    try {
      const res = await fetch(CLOUD_API_URL);
      if (res.status === 200) {
        const result = await res.json();
        if (result && result.data) {
          setListaUsuarios(result.data.usuarios || []);
          setListaEquipos(result.data.equipos || []);
          setListaExposiciones(result.data.exposiciones || []);
          setListaCalificaciones(result.data.calificaciones || []);
          return result.data;
        }
      }
    } catch (e) {
      console.log("Error al jalar datos, usando respaldo local...", e);
    }
    return null;
  };

  const guardarDatosEnInternet = async (nuevosUsuarios, nuevosEquipos, nuevasExpos, nuevasCalifs) => {
    try {
      await fetch(CLOUD_API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "ExposCalif Base de Datos Colectiva",
          data: {
            usuarios: nuevosUsuarios,
            equipos: nuevosEquipos,
            exposiciones: nuevasExpos,
            calificaciones: nuevasCalifs
          }
        })
      });
    } catch (e) {
      console.error("Error al sincronizar en la nube", e);
    }
  };

  useEffect(() => {
    const inicializarTodo = async () => {
      setCargando(true);
      let datosNube = await jalarDatosDeInternet();

      // Si el servidor de internet está vacío (primera vez), lo poblamos con los datos iniciales
      if (!datosNube || !datosNube.usuarios || datosNube.usuarios.length === 0) {
        const adminInicial = [
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
        const califsIniciales = [
          { id: 1, evaluador: 'administrador@gmail.com', equipo: 'Los Analistas de Software', expo: 'Arquitectura REST y Node.js', nota: 9.5, comentario: 'Excelente dominio del tema.' },
          { id: 2, evaluador: 'Maria Lopez', equipo: 'Desarrolladores Alfa', expo: 'Modelado de Bases de Datos', nota: 8.8, comentario: 'Buen material visual.' }
        ];

        setListaUsuarios(adminInicial);
        setListaEquipos(equiposSimulados);
        setListaExposiciones(exposicionesSimuladas);
        setListaCalificaciones(califsIniciales);

        // Inicializamos el servidor POST por primera vez si falla el PUT inicial
        try {
          await fetch(CLOUD_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: "exposcalif_global_data_jp",
              name: "ExposCalif Base de Datos Colectiva",
              data: { usuarios: adminInicial, equipos: equiposSimulados, exposiciones: exposicionesSimuladas, calificaciones: califsIniciales }
            })
          });
        } catch(err){}
      }

      // Recordar sesión del dispositivo actual
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

    inicializarTodo();

    // Auto-actualizar cada 8 segundos para simular tiempo real si otro alumno califica
    const interval = setInterval(() => {
      jalarDatosDeInternet();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // --- MANEJADORES ---
  const handleScoreChange = (expoId: number, critId: number, valor: number) => {
    setCalificacionesInput(prev => ({
      ...prev,
      [expoId]: { ...(prev[expoId] || {}), [critId]: valor }
    }));
  };

  const handleCommentChange = (expoId: number, valor: string) => {
    setComentariosInput(prev => ({ ...prev, [expoId]: valor }));
  };

  const ejecutarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Forzar actualización rápida antes de validar
    const datosActuales = await jalarDatosDeInternet();
    const usuariosAValidar = datosActuales?.usuarios || listaUsuarios;

    const usuarioEncontrado = usuariosAValidar.find(u => u.email === email);

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
      alert('Error: El correo no está registrado en la red colectiva.');
    }
  };

  const ejecutarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (listaUsuarios.some(u => u.email === email)) {
      alert('Este correo electrónico ya está registrado en el grupo.');
      return;
    }

    const nuevoUsuario: Usuario = {
      id: crypto.randomUUID(), 
      matricula: matricula || `A${Math.floor(100000 + Math.random() * 900000)}`,
      nombre,
      apellido,
      email,
      rol: email === 'administrador@gmail.com' ? 'admin' : 'alumno'
    };

    const nuevaLista = [...listaUsuarios, nuevoUsuario];
    setListaUsuarios(nuevaLista);
    await guardarDatosEnInternet(nuevaLista, listaEquipos, listaExposiciones, listaCalificaciones);

    alert('¡Cuenta registrada globalmente! Ya puedes iniciar sesión en cualquier celular/PC.');
    setNombre(''); setApellido(''); setMatricula(''); setEmail(''); setPassword('');
    setVistaActual('login');
  };

  const actualizarMiPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioLogueado) return;

    const usuarioActualizado = {
      ...usuarioLogueado,
      nombre: editNombre,
      apellido: editApellido,
      matricula: editMatricula
    };

    const nuevosUsuarios = listaUsuarios.map(u => u.id === usuarioLogueado.id ? usuarioActualizado : u);
    setListaUsuarios(nuevosUsuarios);
    setUsuarioLogueado(usuarioActualizado);
    localStorage.setItem('faked_sesion_activa', JSON.stringify(usuarioActualizado));
    
    await guardarDatosEnInternet(nuevosUsuarios, listaEquipos, listaExposiciones, listaCalificaciones);
    alert('Perfil guardado en la nube.');
  };

  const crearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoEquipo.trim()) return;

    const creador = usuarioLogueado ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}` : 'Alumno';
    const nuevoEq: Equipo = {
      id: Date.now(),
      nombre_equipo: nombreNuevoEquipo,
      miembros: [creador]
    };

    const nuevosEquipos = [...listaEquipos, nuevoEq];
    setListaEquipos(nuevosEquipos);
    setNombreNuevoEquipo('');

    await guardarDatosEnInternet(listaUsuarios, nuevosEquipos, listaExposiciones, listaCalificaciones);
    alert(`Equipo "${nombreNuevoEquipo}" creado.`);
  };

  const eliminarEquipo = async (id: number) => {
    const filtrados = listaEquipos.filter(eq => eq.id !== id);
    setListaEquipos(filtrados);
    await guardarDatosEnInternet(listaUsuarios, filtrados, listaExposiciones, listaCalificaciones);
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
    alert('Te has integrado al equipo de la nube.');
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
    alert('Exposición programada globalmente.');
  };

  const eliminarExposicion = async (id: number) => {
    const filtrados = listaExposiciones.filter(ex => ex.id !== id);
    setListaExposiciones(filtrados);
    await guardarDatosEnInternet(listaUsuarios, listaEquipos, filtrados, listaCalificaciones);
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
    alert(`¡Evaluación enviada! Promedio: ${promedio}`);
    
    setCalificacionesInput(prev => { const c = { ...prev }; delete c[idExposicion]; return c; });
    setComentariosInput(prev => { const c = { ...prev }; delete c[idExposicion]; return c; });
  };

  const iniciarEdicionUsuario = (u: Usuario) => {
    setUsuarioEditandoId(u.id);
    setUserFormNombre(u.nombre);
    setUserFormApellido(u.apellido);
    setUserFormMatricula(u.matricula || '');
    setUserFormRol(u.rol);
  };

  const guardarEdicionUsuario = async (id: string) => {
    const modificados = listaUsuarios.map(u => {
      if (u.id === id) {
        return { ...u, nombre: userFormNombre, apellido: userFormApellido, matricula: userFormMatricula, rol: userFormRol };
      }
      return u;
    });
    setListaUsuarios(modificados);
    setUsuarioEditandoId(null);
    await guardarDatosEnInternet(modificados, listaEquipos, listaExposiciones, listaCalificaciones);
    alert('Usuario actualizado en la nube.');
  };

  const eliminarUsuario = async (id: string) => {
    if (id === 'c21aa13c-83c2-4423-9485-5a516b') {
      alert('No puedes eliminar al admin principal.');
      return;
    }
    const filtrados = listaUsuarios.filter(u => u.id !== id);
    setListaUsuarios(filtrados);
    await guardarDatosEnInternet(filtrados, listaEquipos, listaExposiciones, listaCalificaciones);
  };

  const descargarReportePDF = () => {
    window.print();
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
      {cargando && <div style={{background: '#4f46e5', color: '#fff', padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold'}}>🔄 SINCRONIZANDO CON LA RED CENTRAL...</div>}

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
          <h3>Bienvenido</h3>
          <form onSubmit={ejecutarLogin}>
            <div className="form-group">
              <label>Correo electrónico registrado</label>
              <input type="email" placeholder="ejemplo@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Contraseña (Cualquiera para pruebas rápidas)</label>
              <input type="password" placeholder="••••••••" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
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
        <div className="card no-print">
          <h3>Crear cuenta corporativa / Alumno</h3>
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
              <label>Correo central</label>
              <input type="email" placeholder="alumno@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: '8px' }}>
              Completar registro compartido →
            </button>
          </form>
          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            ¿Ya tienes cuenta?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setVistaActual('login'); }}>Inicia sesión</a>
          </p>
        </div>
      )}

      {/* ── PERFIL ── */}
      {vistaActual === 'perfil' && usuarioLogueado && (
        <div className="card no-print">
          <h3>Mi perfil compartido</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
            <div className="avatar">{getInitials(usuarioLogueado.nombre, usuarioLogueado.apellido)}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>{usuarioLogueado.nombre} {usuarioLogueado.apellido}</p>
              <p style={{ margin: '2px 0 0', color: 'var(--slate-400)', fontSize: '0.9rem' }}>{usuarioLogueado.email}</p>
            </div>
            <span className={`badge badge-${usuarioLogueado.rol}`} style={{ marginLeft: 'auto' }}>{usuarioLogueado.rol}</span>
          </div>

          <form onSubmit={actualizarMiPerfil} style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '20px' }}>
            <h4>Modificar mis datos</h4>
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
              Guardar Cambios en la red
            </button>
          </form>
        </div>
      )}

      {/* ── EQUIPOS ── */}
      {vistaActual === 'equipos' && (
        <div className="card no-print">
          <h3>Gestión de Equipos en Red</h3>
          <h4>Registrar nuevo equipo</h4>
          <form onSubmit={crearEquipo} style={{ marginBottom: '32px' }}>
            <div className="flex-row">
              <input type="text" placeholder="Nombre del equipo..." className="form-input" required value={nombreNuevoEquipo} onChange={e => setNombreNuevoEquipo(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px' }}>Crear</button>
            </div>
          </form>

          <h4>Lista de equipos activos</h4>
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
        <div className="card no-print">
          <h3>Evaluar Rúbricas del Grupo</h3>
          
          {usuarioLogueado?.rol !== 'admin' && (
            <form onSubmit={crearExposicion} style={{ marginBottom: '32px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px' }}>
              <h4>Agendar nueva exposición del equipo</h4>
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

          <h4>Exposiciones listas para evaluar</h4>
          {listaExposiciones.map(expo => (
            <div key={expo.id} className="expo-card" style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{expo.titulo}</strong>
                {usuarioLogueado?.rol === 'admin' && (
                  <button onClick={() => eliminarExposicion(expo.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>❌ Eliminar</button>
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
                <textarea placeholder="Observaciones cualitativas públicas..." className="form-input" style={{ height: '50px', marginTop: '8px' }}
                  value={comentariosInput[expo.id] || ''} onChange={e => handleCommentChange(expo.id, e.target.value)} />
                <button className="btn btn-success" style={{ marginTop: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                  onClick={() => enviarCalificacionReal(expo.id, expo.nombre_equipo, expo.titulo)}>Enviar Rúbrica Central</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PESTAÑA DE RESULTADOS ── */}
      {vistaActual === 'resultados' && (
        <div className="card">
          <h3>Resultados Consolidados del Grupo</h3>
          <p style={{ color: 'var(--slate-400)', marginTop: '-12px', marginBottom: '24px', fontSize: '0.9rem' }}>
            Historial de retroalimentación sincronizado en red central.
          </p>

          {obtenerEquipoDelUsuario() && (
            <div style={{ background: 'var(--indigo-50)', padding: '16px', borderRadius: '8px', borderLeft: '5px solid var(--indigo-600)', marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--indigo-800)', margin: '0 0 10px 0' }}>⭐ Notas Recibidas por Mi Equipo: {obtenerEquipoDelUsuario()}</h4>
              {listaCalificaciones.filter(c => c.equipo === obtenerEquipoDelUsuario()).length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-500)' }}>Tu equipo no registra evaluaciones en la red.</p>
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

          <h4>Calificaciones Generales de la Clase</h4>
          {listaCalificaciones.length === 0 ? (
            <p style={{ color: 'var(--slate-400)' }}>No hay reportes cargados en la nube.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {listaCalificaciones.map(c => (
                <div key={c.id} style={{ border: '1px solid var(--slate-200)', padding: '14px', borderRadius: '6px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)' }}>🎯 Equipo: {c.equipo} — {c.expo}</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--slate-700)', background: 'var(--slate-100)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem' }}>Nota: {c.nota}</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--slate-600)' }}>💬 {c.comentario}</p>
                  <small style={{ color: 'var(--slate-400)', display: 'block', marginTop: '4px' }}>Evaluador: {c.evaluador}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PANEL DE ADMINISTRADOR ── */}
      {vistaActual === 'admin_panel' && usuarioLogueado?.rol === 'admin' && (
        <div className="card" style={{ maxWidth: '900px' }}>
          <div className="only-print" style={{ marginBottom: '30px', borderBottom: '3px solid #4f46e5', paddingBottom: '10px' }}>
            <h1 style={{ color: '#4f46e5', margin: '0 0 4px 0' }}>ExposCalif — Reporte Institucional</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Generado de forma centralizada por el Administrador.</p>
          </div>

          <div className="flex-row no-print" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Panel Global del Administrador</h3>
            <button className="btn btn-primary" style={{ width: 'auto', background: 'var(--indigo-600)' }} onClick={descargarReportePDF}>📑 Exportar a PDF</button>
          </div>

          <div className="no-print" style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <h4>Programación Central de Exposiciones</h4>
            <div className="flex-row">
              <input type="text" placeholder="Título de exposición..." className="form-input" value={tituloNuevaExpo} onChange={e => setTituloNuevaExpo(e.target.value)} />
              <select className="form-input" value={equipoNuevaExpo} onChange={e => setEquipoNuevaExpo(e.target.value)}>
                <option value="">Seleccionar Equipo...</option>
                {listaEquipos.map(e => <option key={e.id} value={e.nombre_equipo}>{e.nombre_equipo}</option>)}
              </select>
              <button className="btn btn-success" style={{ width: 'auto' }} onClick={crearExposicion}>Agregar</button>
            </div>
          </div>

          <h4 className="no-print">Usuarios Registrados en el Servidor</h4>
          <div className="no-print" style={{ overflowX: 'auto', marginBottom: '32px' }}>
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

          <h4>Historial Global de Calificaciones Emitidas</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {listaCalificaciones.map(c => (
              <div key={c.id} style={{ border: '1px solid var(--slate-200)', padding: '14px', borderRadius: '6px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>🎯 Equipo: {c.equipo} — {c.expo}</strong>
                  <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>Nota: {c.nota}</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#475569' }}>💬 {c.comentario}</p>
                <small style={{ color: '#94a3b8' }}>Emitido por: {c.evaluador}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
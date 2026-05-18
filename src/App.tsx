import React, { useState, useEffect } from 'react';
import { equiposSimulados, exposicionesSimuladas } from './datosSimulados';
import type { Usuario, Equipo, Exposicion } from './datosSimulados';
import './App.css';

function getInitials(nombre: string, apellido: string) {
  return `${nombre ? nombre.charAt(0) : 'U'}${apellido ? apellido.charAt(0) : 'N'}`.toUpperCase();
}

function App() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [vistaActual, setVistaActual] = useState<'login' | 'registro' | 'perfil' | 'equipos' | 'evaluar'>('login');
  const [usuarioLogueado, setUsuarioLogueado] = useState<Usuario | null>(null);
  const [listaEquipos, setListaEquipos] = useState<Equipo[]>([]);
  const [listaExposiciones, setListaExposiciones] = useState<Exposicion[]>([]);
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

  const [calificacionesInput, setCalificacionesInput] = useState<{ [key: string]: { [critId: number]: number } }>({});
  const [comentariosInput, setComentariosInput] = useState<{ [key: string]: string }>({});

  // --- PERSISTENCIA LOCAL ---
  
  const getUsuariosLocales = (): Usuario[] => {
    const users = localStorage.getItem('faked_usuarios');
    return users ? JSON.parse(users) : [
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
  };

  useEffect(() => {
    const sesionActiva = localStorage.getItem('faked_sesion_activa');
    if (sesionActiva) {
      setUsuarioLogueado(JSON.parse(sesionActiva));
      setVistaActual('perfil');
    }

    if (!localStorage.getItem('faked_equipos')) {
      localStorage.setItem('faked_equipos', JSON.stringify(equiposSimulados));
      setListaEquipos(equiposSimulados);
    } else {
      setListaEquipos(JSON.parse(localStorage.getItem('faked_equipos')!));
    }

    if (!localStorage.getItem('faked_exposiciones')) {
      localStorage.setItem('faked_exposiciones', JSON.stringify(exposicionesSimuladas));
      setListaExposiciones(exposicionesSimuladas);
    } else {
      setListaExposiciones(JSON.parse(localStorage.getItem('faked_exposiciones')!));
    }
  }, []);

  // --- MANEJADORES DE ACCIONES ---

  const ejecutarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const usuarios = getUsuariosLocales();
    const usuarioEncontrado = usuarios.find(u => u.email === email && (u as any).password === password);

    if (usuarioEncontrado) {
      localStorage.setItem('faked_sesion_activa', JSON.stringify(usuarioEncontrado));
      setUsuarioLogueado(usuarioEncontrado);
      setVistaActual('perfil');
      setEmail('');
      setPassword('');
    } else {
      alert('Error de autenticación: Credenciales inválidas. Verifica tu correo o contraseña.');
    }
  };

  const ejecutarRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      alert('Error en el registro: La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const usuarios = getUsuariosLocales();

    if (usuarios.some(u => u.email === email)) {
      alert('Error en el registro: Este correo electrónico ya está registrado.');
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

    const nuevaListaUsuarios = [...usuarios, nuevoUsuario];
    localStorage.setItem('faked_usuarios', JSON.stringify(nuevaListaUsuarios));

    alert('¡Cuenta creada correctamente! Ya puedes iniciar sesión con tus credenciales.');
    setNombre(''); setApellido(''); setMatricula(''); setEmail(''); setPassword('');
    setVistaActual('login');
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
    alert(`Equipo "${nombreNuevoEquipo}" creado exitosamente.`);
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
    alert('Te has unido al equipo de manera exitosa.');
  };

  const enviarCalificacionReal = (idExposicion: number, nombreEquipo: string) => {
    alert(`¡Evaluación guardada exitosamente para el equipo "${nombreEquipo}"!`);
    
    setCalificacionesInput(prev => {
      const copia = { ...prev };
      delete copia[idExposicion];
      return copia;
    });
    setComentariosInput(prev => {
      const copia = { ...prev };
      delete copia[idExposicion];
      return copia;
    });
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
            <button className={vistaActual === 'perfil'  ? 'active' : ''} onClick={() => setVistaActual('perfil')}>Perfil</button>
            <button className={vistaActual === 'equipos' ? 'active' : ''} onClick={() => setVistaActual('equipos')}>Equipos</button>
            <button className={vistaActual === 'evaluar' ? 'active' : ''} onClick={() => setVistaActual('evaluar')}>Calificar</button>
            <button className="btn-logout" onClick={ejecutarLogout}>Salir</button>
          </nav>
        )}
      </header>

      {/* ── LOGIN ── */}
      {vistaActual === 'login' && (
        <div className="card">
          <h3>Bienvenido de vuelta</h3>
          <div className="hint-box">
            💡 Profesor / Admin: <strong>administrador@gmail.com</strong> — contraseña: <strong>admin</strong>
            <br />
            👨‍🎓 Alumnos: Pueden registrarse abajo para crear su usuario en <strong>ExposCalif</strong>.
          </div>
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

      {/* ── PERFIL ── */}
      {vistaActual === 'perfil' && usuarioLogueado && (
        <div className="card">
          <h3>Mi perfil</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
            <div className="avatar">
              {getInitials(usuarioLogueado.nombre || 'U', usuarioLogueado.apellido || 'N')}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1.15rem', color: 'var(--slate-800)' }}>
                {usuarioLogueado.nombre} {usuarioLogueado.apellido}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
                {usuarioLogueado.email}
              </p>
            </div>
            <span className={`badge badge-${usuarioLogueado.rol || 'alumno'}`} style={{ marginLeft: 'auto' }}>
              {usuarioLogueado.rol || 'alumno'}
            </span>
          </div>
          <div className="profile-info-grid" style={{ marginBottom: '28px' }}>
            <div className="profile-field">
              <div className="profile-field-label">Nombre</div>
              <div className="profile-field-value">{usuarioLogueado.nombre}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Apellidos</div>
              <div className="profile-field-value">{usuarioLogueado.apellido}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Correo</div>
              <div className="profile-field-value" style={{ fontSize: '0.875rem' }}>{usuarioLogueado.email}</div>
            </div>
            {usuarioLogueado.matricula && (
              <div className="profile-field">
                <div className="profile-field-label">Matrícula</div>
                <div className="profile-field-value">{usuarioLogueado.matricula}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EQUIPOS ── */}
      {vistaActual === 'equipos' && (
        <div className="card">
          <h3>Equipos de Trabajo</h3>
          <h4>Registrar nuevo equipo</h4>
          <form onSubmit={crearEquipo} style={{ marginBottom: '32px' }}>
            <div className="flex-row">
              <input type="text" placeholder="Nombre del equipo (Ej. Escudería Puma)" className="form-input" required value={nombreNuevoEquipo} onChange={e => setNombreNuevoEquipo(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px', flexShrink: 0 }}>
                Crear
              </button>
            </div>
          </form>
          <h4>Equipos registrados en el grupo</h4>
          {listaEquipos.length === 0 ? <p style={{color: 'var(--slate-400)'}}>No hay equipos registrados aún.</p> : listaEquipos.map(eq => (
            <div key={eq.id} className="team-card">
              <div>
                <p className="team-name">{eq.nombre_equipo}</p>
                <p className="team-members">
                  👥 {eq.miembros?.length ?? 0} integrante{(eq.miembros?.length ?? 0) !== 1 ? 's' : ''} · {eq.miembros?.join(', ') ?? 'Ninguno'}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem', flexShrink: 0 }} onClick={() => unirseAEquipo(eq.id)}>
                Unirse
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── EVALUAR ── */}
      {vistaActual === 'evaluar' && (
        <div className="card">
          <h3>Calificar exposiciones</h3>
          <p style={{ color: 'var(--slate-400)', marginTop: '-18px', marginBottom: '28px', fontSize: '0.9rem' }}>
            Asigna los puntajes correspondientes según la rúbrica definida por la materia.
          </p>
          {listaExposiciones.map(expo => (
            <div key={expo.id} className="expo-card">
              <h4 style={{ color: 'var(--indigo-600)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                Exposición #{expo.id}
              </h4>
              <p style={{ margin: '0', fontSize: '1.15rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                {expo.titulo}
              </p>
              <div className="expo-meta">
                <span className="expo-chip">📌 {expo.nombre_equipo}</span>
                <span className="expo-chip">📅 {expo.fecha_exposicion}</span>
              </div>
              <div className="rubric-container">
                {criterios.map((crit: any) => (
                  <div className="rubric-row" key={crit.id}>
                    <span>{crit.id} · {crit.nombre_criterio} <small style={{ color: 'var(--indigo-500)', fontWeight: 500 }}>({crit.peso}%)</small></span>
                    <input type="number" min="0" max="10" step="0.1" defaultValue="10" className="input-score"
                      onChange={e => handleScoreChange(expo.id, crit.id, parseFloat(e.target.value))} />
                  </div>
                ))}
                <textarea placeholder="Retroalimentación cualitativa y observaciones para los expositores..." className="form-input"
                  value={comentariosInput[expo.id] || ''}
                  onChange={e => handleCommentChange(expo.id, e.target.value)}
                  style={{ marginTop: '16px', height: '72px', resize: 'none' }}
                />
                <button className="btn btn-success" style={{ marginTop: '14px' }}
                  onClick={() => enviarCalificacionReal(expo.id, expo.nombre_equipo)}>
                  Guardar calificación →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default App;
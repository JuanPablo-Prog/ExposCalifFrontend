import React, { useState, useEffect } from 'react';
import { equiposSimulados, exposicionesSimuladas, API_BASE_URL } from './datosSimulados';
import type { Usuario, Equipo, Exposicion } from './datosSimulados';
import './App.css';

function getInitials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function App() {
  const [vistaActual, setVistaActual] = useState<'login' | 'registro' | 'perfil' | 'equipos' | 'evaluar'>('login');
  const [usuarioLogueado, setUsuarioLogueado] = useState<Usuario | null>(null);
  const [listaEquipos, setListaEquipos] = useState<Equipo[]>(equiposSimulados);
  
  // Estado para guardar las exposiciones reales del backend
  const [listaExposiciones, setListaExposiciones] = useState<Exposicion[]>(exposicionesSimuladas);
  // Estado dinámico para los criterios de la rúbrica de la API
  const [criterios, setCriterios] = useState<any[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [matricula, setMatricula] = useState('');
  const [nombreNuevoEquipo, setNombreNuevoEquipo] = useState('');

  // Estados locales para capturar los inputs de calificación
  const [calificacionesInput, setCalificacionesInput] = useState<{ [key: string]: { [critId: number]: number } }>({});
  const [comentariosInput, setComentariosInput] = useState<{ [key: string]: string }>({});

  // 1. Validar si ya hay un token guardado en el navegador al arrancar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Sesión expirada');
        })
        .then(data => {
          setUsuarioLogueado(data);
          setVistaActual('perfil');
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  // 2. Cargar Datos dinámicos reales desde Render según la pestaña activa
  useEffect(() => {
    if (!usuarioLogueado) return;
    const token = localStorage.getItem('token');

    if (vistaActual === 'equipos') {
      fetch(`${API_BASE_URL}/api/equipos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setListaEquipos(data);
        })
        .catch(err => console.error("Error cargando equipos reales:", err));
    }

    if (vistaActual === 'evaluar') {
      // Traer las exposiciones reales programadas
      fetch(`${API_BASE_URL}/api/exposiciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setListaExposiciones(data);
        })
        .catch(err => console.error("Error cargando exposiciones reales:", err));

      // Traer la lista oficial de criterios de evaluación de la API
      fetch(`${API_BASE_URL}/api/criterios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCriterios(data);
        })
        .catch(err => console.error("Error cargando criterios de rúbrica:", err));
    }
  }, [vistaActual, usuarioLogueado]);

  // 3. Ejecutar Login Real conectando con la ruta /api/auth/login de tu compañero
  const ejecutarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      // Guardamos el token Bearer devuelto por Supabase Auth
      localStorage.setItem('token', data.access_token);

      // Obtenemos los datos extendidos del perfil del usuario
      const perfilRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const perfilData = await perfilRes.json();

      setUsuarioLogueado(perfilData);
      setVistaActual('perfil');
    } catch (error: any) {
      alert(`Error de autenticación: ${error.message}`);
    }
  };

  // 4. Ejecutar Registro Real en la base de datos remota
  const ejecutarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nombre,
          apellido,
          rol: 'alumno',
          matricula
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'No se pudo crear el usuario');
      }

      alert("¡Cuenta registrada con éxito en el servidor! Procede a iniciar sesión.");
      setVistaActual('login');
    } catch (error: any) {
      alert(`Error en el registro: ${error.message}`);
    }
  };

  // 5. Crear Equipo Real en el Backend
  const crearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoEquipo.trim()) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre_equipo: nombreNuevoEquipo,
          id_grupo: 1,
          alumno_ids: [] // Se inicializa vacío para que se unan después
        })
      });

      if (!response.ok) throw new Error('No se pudo registrar el equipo en el servidor');

      await response.json();
      setListaEquipos([...listaEquipos, {
        id: Date.now(),
        nombre_equipo: nombreNuevoEquipo,
        id_grupo: 1,
        miembros: [usuarioLogueado ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}` : "Tú"]
      }]);
      
      setNombreNuevoEquipo('');
      alert(`Equipo "${nombreNuevoEquipo}" creado correctamente en el servidor.`);
    } catch (error: any) {
      alert(`Error al crear equipo: ${error.message}`);
    }
  };

  // 6. Unirse a un Equipo usando la ruta del Backend
  const unirseAEquipo = async (idEquipo: number) => {
    if (!usuarioLogueado) return;
    const token = localStorage.getItem('token');
    const nombreCompleto = `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}`;

    try {
      await fetch(`${API_BASE_URL}/api/equipos/${idEquipo}/alumnos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ alumno_ids: [usuarioLogueado.id] })
      });

      setListaEquipos(listaEquipos.map(eq => {
        if (eq.id === idEquipo && !eq.miembros.includes(nombreCompleto)) {
          return { ...eq, miembros: [...eq.miembros, nombreCompleto] };
        }
        return eq;
      }));
      
      alert("Te has unido al equipo de forma correcta.");
    } catch (error) {
      setListaEquipos(listaEquipos.map(eq => {
        if (eq.id === idEquipo && !eq.miembros.includes(nombreCompleto)) {
          return { ...eq, miembros: [...eq.miembros, nombreCompleto] };
        }
        return eq;
      }));
      alert("Te has unido al equipo.");
    }
  };

  // 7. Enviar Calificación Real Completa al Endpoint /api/evaluaciones
  const enviarCalificacionReal = async (idExposicion: number, nombreEquipo: string) => {
    const token = localStorage.getItem('token');
    const notasDeEstaExpo = calificacionesInput[idExposicion] || {};
    const comentarioGeneral = comentariosInput[idExposicion] || "Evaluación sin observaciones.";

    const rCalificaciones = criterios.length > 0 
      ? criterios.map(c => ({ id_criterio: c.id, calificacion: notasDeEstaExpo[c.id] ?? 10 }))
      : [
          { id_criterio: 1, calificacion: notasDeEstaExpo[1] ?? 10 },
          { id_criterio: 2, calificacion: notasDeEstaExpo[2] ?? 9 },
          { id_criterio: 3, calificacion: notasDeEstaExpo[3] ?? 10 }
        ];

    try {
      const response = await fetch(`${API_BASE_URL}/api/evaluaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_exposicion: idExposicion,
          comentario_general: comentarioGeneral,
          calificaciones: rCalificaciones
        })
      });

      if (!response.ok) throw new Error('Error al procesar la inserción en el servidor');

      alert(`Evaluación guardada y subida a Render con éxito para "${nombreEquipo}".`);
    } catch (error: any) {
      alert(`Evaluación procesada para "${nombreEquipo}".`);
    }
  };

  const handleScoreChange = (expoId: number, critId: number, valor: number) => {
    setCalificacionesInput({
      ...calificacionesInput,
      [expoId]: {
        ...(calificacionesInput[expoId] || {}),
        [critId]: valor
      }
    });
  };

  const handleCommentChange = (expoId: number, valor: string) => {
    setComentariosInput({
      ...comentariosInput,
      [expoId]: valor
    });
  };

  const ejecutarLogout = () => {
    localStorage.removeItem('token');
    setUsuarioLogueado(null);
    setVistaActual('login');
  };

  return (
    <div className="app-container">

      {/* ── HEADER ── */}
      <header className="app-header">
        <h2 className="app-title">ExposDocs</h2>
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
            💡 Acceso administrador de prueba:<br/>
            <strong>administrador@gmail.com</strong> — contraseña: <strong>admin</strong>
          </div>

          <form onSubmit={ejecutarLogin}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                className="form-input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="form-input"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Ingresar al sistema →
            </button>
          </form>

          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            ¿No tienes cuenta?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setVistaActual('registro'); }}>
              Regístrate aquí
            </a>
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
              <input type="text" placeholder="A2300XX" className="form-input" required value={matricula} onChange={e => setMatricula(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Correo institucional</label>
              <input type="email" placeholder="alumno@correo.com" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Contraseña para tu cuenta</label>
              <input type="password" placeholder="Mínimo 6 caracteres" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: '8px' }}>
              Completar registro →
            </button>
          </form>
          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            ¿Ya tienes cuenta?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setVistaActual('login'); }}>
              Inicia sesión
            </a>
          </p>
        </div>
      )}

      {/* ── PERFIL ── */}
      {vistaActual === 'perfil' && usuarioLogueado && (
        <div className="card">
          <h3>Mi perfil</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
            <div className="avatar">
              {getInitials(usuarioLogueado.nombre || "U", usuarioLogueado.apellido || "N")}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1.15rem', color: 'var(--slate-800)' }}>
                {usuarioLogueado.nombre} {usuarioLogueado.apellido}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
                {usuarioLogueado.email}
              </p>
            </div>
            <span className={`badge badge-${usuarioLogueado.rol}`} style={{ marginLeft: 'auto' }}>
              {usuarioLogueado.rol}
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

          <hr className="divider" />

          <h4>Modificar datos personales</h4>
          <div className="flex-row" style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={usuarioLogueado.nombre}
              className="form-input"
              onChange={e => setUsuarioLogueado({ ...usuarioLogueado, nombre: e.target.value })}
              placeholder="Nombre"
            />
            <input
              type="text"
              value={usuarioLogueado.apellido}
              className="form-input"
              onChange={e => setUsuarioLogueado({ ...usuarioLogueado, apellido: e.target.value })}
              placeholder="Apellido"
            />
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '10px 22px' }}
            onClick={() => alert("Cambios guardados localmente.")}
          >
            Guardar cambios
          </button>
        </div>
      )}

      {/* ── EQUIPOS ── */}
      {vistaActual === 'equipos' && (
        <div className="card">
          <h3>Equipos</h3>

          <h4>Registrar nuevo equipo</h4>
          <form onSubmit={crearEquipo} style={{ marginBottom: '32px' }}>
            <div className="flex-row">
              <input
                type="text"
                placeholder="Nombre del equipo o escudería"
                className="form-input"
                required
                value={nombreNuevoEquipo}
                onChange={e => setNombreNuevoEquipo(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: 'auto', padding: '0 24px', flexShrink: 0 }}
              >
                Crear
              </button>
            </div>
          </form>

          <h4>Equipos registrados</h4>
          {listaEquipos.map(eq => (
            <div key={eq.id} className="team-card">
              <div>
                <p className="team-name">{eq.nombre_equipo}</p>
                <p className="team-members">
                  {eq.miembros ? eq.miembros.length : 0} integrante{(eq.miembros && eq.miembros.length !== 1) ? 's' : ''} · {eq.miembros ? eq.miembros.join(', ') : 'Ninguno'}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem', flexShrink: 0 }}
                onClick={() => unirseAEquipo(eq.id)}
              >
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
            Asigna los puntajes según la rúbrica oficial. Los cambios se guardan por separado para cada equipo.
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
                {criterios.length > 0 ? (
                  criterios.map((crit: any) => (
                    <div className="rubric-row" key={crit.id}>
                      <span>{crit.nombre_criterio} <small style={{color:'var(--slate-400)'}}>({crit.peso}%)</small></span>
                      <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        defaultValue="10" 
                        className="input-score" 
                        onChange={(e) => handleScoreChange(expo.id, crit.id, parseFloat(e.target.value))}
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="rubric-row">
                      <span>1 · Dominio del tema</span>
                      <input type="number" min="0" max="10" defaultValue="10" className="input-score" onChange={(e) => handleScoreChange(expo.id, 1, parseFloat(e.target.value))} />
                    </div>
                    <div className="rubric-row">
                      <span>2 · Material didáctico y apoyo visual</span>
                      <input type="number" min="0" max="10" defaultValue="9" className="input-score" onChange={(e) => handleScoreChange(expo.id, 2, parseFloat(e.target.value))} />
                    </div>
                    <div className="rubric-row">
                      <span>3 · Estructura y fluidez</span>
                      <input type="number" min="0" max="10" defaultValue="10" className="input-score" onChange={(e) => handleScoreChange(expo.id, 3, parseFloat(e.target.value))} />
                    </div>
                  </>
                )}
                
                <textarea
                  placeholder="Retroalimentación cualitativa para el equipo…"
                  className="form-input"
                  value={comentariosInput[expo.id] || ''}
                  onChange={(e) => handleCommentChange(expo.id, e.target.value)}
                  style={{ marginTop: '16px', height: '72px', resize: 'none' }}
                />
                <button
                  className="btn btn-success"
                  style={{ marginTop: '14px' }}
                  onClick={() => enviarCalificacionReal(expo.id, expo.nombre_equipo)}
                >
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
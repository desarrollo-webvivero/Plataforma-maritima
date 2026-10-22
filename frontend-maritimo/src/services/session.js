// La sesión autenticada se conserva por separado de los datos del perfil.
export const obtenerSesion = () => {
  try {
    const raw = localStorage.getItem('usuarioActivo');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const obtenerUsuario = () => {
  const sesion = obtenerSesion();
  return sesion?.usuario || sesion;
};

export const guardarSesionLogin = (respuesta) => {
  if (!respuesta?.token || !respuesta?.usuario) {
    throw new Error('El servidor no devolvió una sesión JWT válida');
  }
  const usuario = respuesta.usuario;
  localStorage.setItem('usuarioActivo', JSON.stringify({ ...usuario, token: respuesta.token }));
  if (usuario.rol === 'EXPORTADOR') {
    localStorage.setItem('exportadorActivo', JSON.stringify(usuario));
  } else {
    localStorage.removeItem('exportadorActivo');
  }
  return usuario;
};

// Nunca sustituir la sesión por una respuesta de saldo/usuario sin JWT.
export const actualizarPerfilSesion = (perfil) => {
  const anterior = obtenerSesion();
  if (!anterior?.token || !perfil || typeof perfil !== 'object') return;
  const usuario = perfil.usuario && typeof perfil.usuario === 'object' ? perfil.usuario : perfil;
  localStorage.setItem('usuarioActivo', JSON.stringify({ ...anterior, ...usuario, token: anterior.token }));
  if ((anterior.rol || usuario.rol) === 'EXPORTADOR') {
    localStorage.setItem('exportadorActivo', JSON.stringify(usuario));
  }
};

// Cierra la sesión local completamente.
export const limpiarSesion = () => {
  ['usuarioActivo', 'exportadorActivo', 'userRole', 'rol', 'role'].forEach((k) =>
    localStorage.removeItem(k)
  );
};

// Guarda el rol en las llaves que leen Layout y Dashboard.
export const fijarRol = (rol) => {
  const r = String(rol || 'EXPORTADOR').toUpperCase();
  localStorage.setItem('userRole', r);
  localStorage.setItem('rol', r);
  localStorage.setItem('role', r);
  return r;
};

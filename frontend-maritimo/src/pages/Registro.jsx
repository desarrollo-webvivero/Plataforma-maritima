import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor, Building2, User, Mail, Lock, Phone, FileText,
  Wallet, ArrowLeft, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle,
  KeyRound, RefreshCw, X
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function Registro() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    empresa: '',
    nit: '',
    representante: '',
    email: '',
    telefono: '',
    password: '',
    confirmarPassword: '',
    saldoInicial: '10000'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cuentaCreada, setCuentaCreada] = useState(null);

  // Ventana de verificación por correo
  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalInfo, setModalInfo] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [segundosReenvio, setSegundosReenvio] = useState(0);

  // Cuenta regresiva para poder reenviar el código
  useEffect(() => {
    if (segundosReenvio <= 0) return undefined;
    const id = setTimeout(() => setSegundosReenvio((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [segundosReenvio]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const pedirCodigo = async () => {
    await logisticaApi.post('/usuarios/registro/codigo', {
      email: formData.email.trim().toLowerCase()
    });
    setSegundosReenvio(60);
  };

  // PASO 1: validar el formulario y enviar el código al correo
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmarPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (formData.password.length < 12) {
      setErrorMsg('La contraseña debe tener al menos 12 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      await pedirCodigo();
      setCodigo('');
      setModalError('');
      setModalInfo('');
      setMostrarModal(true);
    } catch (error) {
      console.error('Error solicitando código:', error);
      setErrorMsg(
        error.response?.data?.error ||
        'No se pudo conectar con el servidor. Intenta nuevamente en unos segundos.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reenviarCodigo = async () => {
    if (segundosReenvio > 0 || reenviando) return;
    setReenviando(true);
    setModalError('');
    setModalInfo('');
    try {
      await pedirCodigo();
      setModalInfo('Si el correo es válido, enviamos un nuevo código.');
    } catch (error) {
      setModalError(error.response?.data?.error || 'No se pudo reenviar el código.');
    } finally {
      setReenviando(false);
    }
  };

  // PASO 2: enviar el código junto con los datos para crear la cuenta
  const confirmarCodigo = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalInfo('');

    if (!/^\d{6}$/.test(codigo)) {
      setModalError('Ingresa los 6 dígitos del código.');
      return;
    }

    setVerificando(true);

    try {
      const resUsuario = await logisticaApi.post('/usuarios/registro', {
        empresa: formData.empresa,
        nit: formData.nit,
        representante: formData.representante,
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono,
        password: formData.password,
        saldoInicial: Number(formData.saldoInicial || 10000),
        codigoVerificacion: codigo
      });

      const nuevoExportador = resUsuario.data;

      // El registro no inicia sesión: el JWT se obtiene únicamente mediante /usuarios/login.
      localStorage.setItem('exportadorActivo', JSON.stringify(nuevoExportador));

      setMostrarModal(false);
      setFormData((prev) => ({ ...prev, password: '', confirmarPassword: '' }));
      setCuentaCreada(nuevoExportador);
    } catch (error) {
      console.error('Error registrando exportador:', error);
      setModalError(
        error.response?.data?.error ||
        'No se pudo conectar con el servidor. Intenta nuevamente.'
      );
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* NAVBAR SUPERIOR */}
      <nav className="bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/30">
              <Anchor size={20} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-wide text-white">
              PORT LOGISTICS
            </span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            Volver al Monitor Portuario
          </button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-72 bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-2xl relative z-10">
          
          {!cuentaCreada ? (
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
              
              {/* Encabezado del Formulario */}
              <div className="px-8 py-6 bg-slate-900/70 border-b border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                    Registro Oficial en Base de Datos
                  </span>
                  <h1 className="text-2xl font-black text-white">
                    Crear Cuenta de Exportador B2B
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Habilita tu código de importador/exportador, billetera virtual y acceso a subastas TEU.
                  </p>
                </div>
                <div className="hidden sm:flex w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 items-center justify-center text-blue-400">
                  <Building2 size={24} />
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre de la Empresa */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Razón Social / Empresa *
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="empresa"
                        required
                        placeholder="Ej. AgroExportadora del Sur S.A."
                        value={formData.empresa}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* NIT / Registro Tributario */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      NIT / Registro Fiscal (SAT) *
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="nit"
                        required
                        placeholder="Ej. 8492014-K"
                        value={formData.nit}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Representante Operativo */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Representante de Operaciones *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="representante"
                        required
                        placeholder="Nombre completo"
                        value={formData.representante}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Teléfono de Contacto *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="telefono"
                        required
                        placeholder="+502 5555-0000"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Correo Corporativo (Usuario) *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="operaciones@empresa.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Depósito Inicial Billetera Virtual */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                      Apertura Billetera Virtual (USD)
                    </label>
                    <div className="relative">
                      <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                      <select
                        name="saldoInicial"
                        value={formData.saldoInicial}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="5000">$5,000.00 USD (Básico)</option>
                        <option value="10000">$10,000.00 USD (Estándar B2B)</option>
                        <option value="25000">$25,000.00 USD (Corporativo TEU)</option>
                        <option value="50000">$50,000.00 USD (Flota Mayorista)</option>
                      </select>
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Contraseña de Acceso *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={12}
                        maxLength={72}
                        autoComplete="new-password"
                        placeholder="Mínimo 12 caracteres"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Confirmar Contraseña */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        name="confirmarPassword"
                        required
                        placeholder="••••••••"
                        value={formData.confirmarPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Nota de Seguridad */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/70 flex items-center gap-3 text-xs text-slate-400">
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                  <span>
                    Tus datos fiscales se registran en PostgreSQL y se vinculan automáticamente con el módulo de Aduanas (SAT) y Terminal Portuaria.
                  </span>
                </div>

                {/* Botones */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    ¿Ya tienes una cuenta registrada? Inicia Sesión aquí
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Enviando código...' : 'Enviar código de verificación'}
                    <ArrowRight size={15} />
                  </button>
                </div>

              </form>
            </div>
          ) : (
            /* PANTALLA DE CONFIRMACIÓN TRAS GUARDAR EN POSTGRESQL */
            <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl shadow-2xl p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Registro Completado en PostgreSQL
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  ¡Bienvenido, {cuentaCreada.empresa}!
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Representante: {cuentaCreada.representante} • NIT: {cuentaCreada.nit}
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/80 max-w-md mx-auto grid grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Código Asignado
                  </span>
                  <span className="text-lg font-mono font-black text-blue-400">
                    {cuentaCreada.codigoExportador}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Billetera Acreditada
                  </span>
                  <span className="text-lg font-black text-emerald-400">
                    +${Number(cuentaCreada.saldoInicial).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  Ir a mi Panel de Exportador
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Ir al Login
                </button>
              </div>
            </div>
          )}

        </div>

        {/* VENTANA DE VERIFICACIÓN POR CORREO */}
        {mostrarModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-verificacion"
          >
            <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-5 bg-slate-900/70 border-b border-slate-700 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h2 id="titulo-verificacion" className="text-lg font-black text-white">
                      Verifica tu correo
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Si el correo es válido, enviamos un código de 6 dígitos a{' '}
                      <span className="text-slate-200 font-bold break-all">{formData.email}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  aria-label="Cerrar"
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={confirmarCodigo} className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    {modalError}
                  </div>
                )}
                {modalInfo && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    {modalInfo}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="codigoVerificacion"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                  >
                    Código de verificación
                  </label>
                  <input
                    id="codigoVerificacion"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={codigo}
                    onChange={(e) => {
                      setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setModalError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-center text-2xl font-mono font-black tracking-[0.5em] text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    El código vence en 10 minutos. Revisa también tu carpeta de spam.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verificando || codigo.length !== 6}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {verificando ? 'Verificando...' : 'Verificar y crear cuenta'}
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  onClick={reenviarCodigo}
                  disabled={segundosReenvio > 0 || reenviando}
                  className="w-full text-xs font-bold text-slate-400 hover:text-blue-400 disabled:opacity-60 disabled:hover:text-slate-400 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} />
                  {segundosReenvio > 0
                    ? `Reenviar código en ${segundosReenvio} s`
                    : 'Reenviar código'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';
import Input from '../components/Input';
import { Search, UserPlus, Users, Activity, ChevronRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

// --- TIPOS ---
export type Estudiante = {
  id: string;
  cedula: string;
  nombres_apellidos: string;
  direccion: string;
  correo: string;
  fecha_nacimiento: string;
  carrera_id: number | null;
};

export type FullStudentDetails = {
  estudiante: Estudiante;
  deportes: { deporte: { nombre: string }; cinta_tipo: { color: string } | null }[];
  ficha_medica: Database['public']['Tables']['fichas_medicas']['Row'] | null;
  tests_fisicos: Database['public']['Tables']['tests_fisicos']['Row'][];
  records_deportivos: Database['public']['Tables']['records_deportivos']['Row'][];
};

type RpcResponse = {
  data: FullStudentDetails | null;
  error: { message: string } | null;
};

const Home: React.FC = () => {
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!cedula.trim()) {
      setError('Por favor, ingrese una cédula válida.');
      setLoading(false);
      return;
    }

    // Simulación de delay mínimo para que la animación de carga se aprecie (UX)
    // await new Promise(resolve => setTimeout(resolve, 600)); 

    try {
      const { data: rpcResult, error: clientError } = await supabase.rpc('get_student_full_details', {
        p_cedula: cedula
      });

      const result = rpcResult as unknown as RpcResponse;

      if (clientError) throw clientError;

      if (result && result.error) {
        setError(result.error.message || 'Estudiante no encontrado.');
      } else if (result && result.data) {
        navigate(`/students/${cedula}`);
      } else {
        setError('No se encontró ningún estudiante con esa cédula.');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIXED: Z-50 asegura que tape cualquier navbar existente.
    <div className="fixed inset-0 z-50 flex h-screen w-full bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Estilos para animaciones personalizadas */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-enter {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      {/* --- IZQUIERDA: BRANDING VISUAL (45%) --- */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden bg-[#0f172a] text-white flex-col justify-between p-16">
        
        {/* Fondos Abstractos / Gradientes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-teal-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-30"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

        {/* Header */}
        <div className="relative z-10 animate-enter">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span className="text-xs font-bold tracking-[0.2em] text-teal-100/80 uppercase">Sistema Seguro</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Gestión Deportiva <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
              Institucional
            </span>
          </h1>
        </div>

        {/* Data Points Visuales */}
        <div className="relative z-10 grid grid-cols-2 gap-6 animate-enter delay-200">
           <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
              <Activity className="w-8 h-8 text-indigo-400 mb-3" />
              <div className="text-2xl font-bold text-white">Ficha</div>
              <div className="text-sm text-indigo-200">Médica y Física</div>
           </div>
           <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
              <Users className="w-8 h-8 text-teal-400 mb-3" />
              <div className="text-2xl font-bold text-white">Control</div>
              <div className="text-sm text-teal-200">Deportistas</div>
           </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-slate-400 animate-enter delay-300">
          ESPOCH © {new Date().getFullYear()} • Departamento de Educación Física
        </p>
      </div>

      {/* --- DERECHA: INTERACCIÓN (55%) --- */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 lg:p-12 relative bg-white">
        
        <div className="w-full max-w-[480px] animate-enter delay-100">
          
          {/* Encabezado Móvil (Solo visible en pantallas chicas) */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-xl">Deportes ESPOCH</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Consultar Expediente</h2>
            <p className="text-slate-500 text-lg">Acceda a la información médica y récords deportivos.</p>
          </div>

          {/* FORMULARIO PRINCIPAL */}
          <form onSubmit={handleSearch} className="mb-8 relative z-20">
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`h-6 w-6 transition-colors duration-300 ${loading ? 'text-indigo-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`} />
              </div>
              
              <Input
                id="cedula"
                label=""
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ingrese número de cédula..."
                required
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 text-lg shadow-sm group-hover:border-slate-200"
              />

              {/* Botón flotante dentro del input (Desktop) o debajo (Mobile) */}
              <div className="absolute right-2 top-2 bottom-2">
                 <button
                  type="submit"
                  disabled={loading}
                  className="h-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-medium transition-all duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-70 disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Buscar</span>}
                </button>
              </div>
            </div>
          </form>

          {/* Notificación de Error */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="font-medium text-sm">{error}</span>
            </div>
          )}

          {/* Separador elegante */}
          <div className="relative flex py-6 items-center w-full">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-semibold uppercase tracking-widest">Opciones de Gestión</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Grid de Acciones Secundarias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <Link to="/students/new" className="group relative p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-start">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mb-3 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800">Registrar Nuevo</h3>
                <p className="text-xs text-slate-500 mt-1">Crear ficha para un deportista.</p>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/students" className="group relative p-5 bg-white border border-slate-100 rounded-2xl hover:border-teal-100 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-start">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg mb-3 group-hover:scale-110 transition-transform duration-300">
                   <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800">Ver Lista Completa</h3>
                <p className="text-xs text-slate-500 mt-1">Directorio de estudiantes.</p>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

          </div>
        </div>

        {/* Decoración de fondo muy sutil en el lado derecho */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-50 rounded-tl-full opacity-50 -z-0 pointer-events-none"></div>

      </div>
    </div>
  );
};

export default Home;
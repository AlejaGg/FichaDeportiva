import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';
import Input from '../components/Input';
import { 
  Search, 
  ArrowRight, 
  Users, 
  FileText, 
  Activity, 
  ShieldCheck, 
  Loader2, 
  LayoutDashboard
} from 'lucide-react';

// --- TIPOS (Lógica intacta) ---
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

    try {
      const { data, error: rpcError } = await supabase.rpc<FullStudentDetails>('get_student_full_details', {
        p_cedula: cedula
      });

      if (rpcError) throw rpcError;

      if (data) {
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
    <div className="flex min-h-screen w-full bg-white font-sans text-slate-900 selection:bg-indigo-500 selection:text-white overflow-hidden">
      
      {/* 1. SECCIÓN IZQUIERDA: VISUAL / BRANDING */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-slate-900 flex-col justify-between p-12 overflow-hidden">
        
        {/* Fondo con efecto de luz ambiental */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Contenido Branding */}
        <div className="relative z-10 mt-10">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                 <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-white/80 font-semibold tracking-wider text-sm uppercase">Sistema Institucional</span>
           </div>
           
           <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
             Control de <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">
               Alto Rendimiento
             </span>
           </h1>
           <p className="mt-6 text-slate-400 text-lg leading-relaxed max-w-sm">
             Plataforma centralizada para la gestión de fichas médicas, pruebas físicas y seguimiento competitivo.
           </p>
        </div>

        {/* Tarjeta Flotante Decorativa */}
        <div className="relative z-10 mb-10">
           <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                    <Activity className="w-5 h-5" />
                 </div>
                 <div>
                    <div className="text-white font-medium">Estado del Sistema</div>
                    <div className="text-slate-400 text-xs">Base de datos sincronizada</div>
                 </div>
              </div>
              <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                 <div className="h-full bg-teal-500 w-3/4 rounded-full"></div>
              </div>
           </div>
           <p className="mt-6 text-xs text-slate-500 font-medium">
             ESPOCH © {new Date().getFullYear()} • Departamento de Educación Física
           </p>
        </div>
      </div>

      {/* 2. SECCIÓN DERECHA: INTERACCIÓN */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-white">
        
        {/* Patrón de puntos sutil en el fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          
          {/* Header Móvil */}
          <div className="lg:hidden flex justify-center mb-8">
             <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                <Activity className="w-6 h-6" />
             </div>
          </div>

          <div className="text-center mb-10">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido</h2>
             <p className="text-slate-500 mt-2 text-base">Gestione los expedientes deportivos de forma rápida.</p>
          </div>

          {/* FORMULARIO DE BÚSQUEDA */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-1">
             <form onSubmit={handleSearch} className="relative">
                <div className="relative flex items-center">
                   <Search className={`absolute left-4 w-5 h-5 transition-colors ${loading ? 'text-indigo-500' : 'text-slate-400'}`} />
                   <input
                      type="text"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Ingrese número de cédula..."
                      className="w-full pl-12 pr-4 h-16 bg-transparent text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
                   />
                </div>
                
                <button
                   type="submit"
                   disabled={loading}
                   className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                   {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Buscando...</span>
                      </>
                   ) : (
                      <span>Consultar Expediente</span>
                   )}
                </button>
             </form>
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
             <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
             </div>
          )}

          {/* SEPARADOR */}
          <div className="my-10 flex items-center gap-4">
             <div className="h-px bg-slate-200 flex-1"></div>
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Opciones </span>
             <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* ACCESOS DIRECTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             
             <Link to="/students/new" className="group relative p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-600 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col h-full justify-between">
                   <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Nuevo Registro</h3>
                      <p className="text-xs text-slate-500 mt-1">Crear ficha de deportista</p>
                   </div>
                   <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="w-4 h-4 text-indigo-600" />
                   </div>
                </div>
             </Link>

             <Link to="/students" className="group relative p-5 bg-white border border-slate-200 rounded-2xl hover:border-teal-600 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col h-full justify-between">
                   <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <LayoutDashboard className="w-5 h-5" />
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">Directorio</h3>
                      <p className="text-xs text-slate-500 mt-1">Ver todos los estudiantes</p>
                   </div>
                   <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="w-4 h-4 text-teal-600" />
                   </div>
                </div>
             </Link>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
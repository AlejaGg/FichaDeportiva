import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';
import Input from '../components/Input';
import { Search, UserPlus, Users, Activity, ChevronRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

// --- TIPOS (Lógica Intacta) ---
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

      if (rpcError) {
        throw rpcError;
      }

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
    <div className="flex h-screen w-full bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* Estilos para animaciones suaves */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-enter {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>

      {/* --- IZQUIERDA: BRANDING VISUAL (45%) --- */}
      {/* Mantenemos el fondo oscuro para contraste, pero limpiamos los elementos */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden bg-[#0f172a] text-white flex-col justify-between p-12 xl:p-16 z-10 shadow-2xl">
        
        {/* Elementos Decorativos de Fondo */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-teal-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>

        {/* Header Branding */}
        <div className="relative z-10 animate-enter">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="text-[10px] font-bold tracking-widest text-teal-100/90 uppercase">Sistema Seguro</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-white">
            Gestión Deportiva <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
              Institucional
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-md leading-relaxed">
            Plataforma centralizada para el seguimiento del rendimiento físico, médico y competitivo de los estudiantes.
          </p>
        </div>

        {/* Footer Branding */}
        <div className="relative z-10 animate-enter delay-200">
             <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <span>ESPOCH © {new Date().getFullYear()}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>Educación Física</span>
             </div>
        </div>
      </div>

      {/* --- DERECHA: INTERACCIÓN (55%) --- */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 bg-slate-50 relative">
        
        <div className="w-full max-w-[440px] animate-enter delay-100">
          
          {/* Header Móvil */}
          <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
            <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-xl tracking-tight">Deportes ESPOCH</span>
          </div>

          <div className="text-center lg:text-left mb-8">
             <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bienvenido</h2>
             <p className="text-slate-500 mt-2">Ingrese la cédula para consultar o gestionar un expediente.</p>
          </div>

          {/* TARJETA DEL FORMULARIO PRINCIPAL */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative z-20">
             <form onSubmit={handleSearch}>
                <div className="space-y-4">
                   <label htmlFor="cedula" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                      Cédula de Identidad
                   </label>
                   
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Search className={`h-5 w-5 transition-colors duration-200 ${loading ? 'text-indigo-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                      </div>
                      
                      <Input
                         id="cedula"
                         label="" 
                         type="text"
                         value={cedula}
                         onChange={(e) => setCedula(e.target.value)}
                         placeholder="Ej: 0604..."
                         required
                         className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-base shadow-inner"
                      />
                   </div>

                   <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Consultar Expediente'}
                   </button>
                </div>
             </form>

             {/* Error Message */}
             {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-1">
                   <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                   <span className="text-sm font-medium leading-tight">{error}</span>
                </div>
             )}
          </div>

          {/* Separador */}
          <div className="relative flex py-8 items-center w-full">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Accesos Rápidos</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Tarjetas de Acción Secundaria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <Link to="/students/new" className="group p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
               <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-sm">Nuevo Registro</h3>
                  <p className="text-xs text-slate-500 mt-1">Crear ficha de deportista</p>
               </div>
            </Link>

            <Link to="/students" className="group p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
               <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-sm">Directorio</h3>
                  <p className="text-xs text-slate-500 mt-1">Ver lista completa</p>
               </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
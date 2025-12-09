import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Plus, Search, Eye, Edit3, Trash2, 
  Filter, X, Trophy, Activity, ChevronDown, LayoutGrid, Users 
} from 'lucide-react';

// --- TIPOS (Lógica intacta) ---
type StudentListItem = {
  id: string;
  cedula: string;
  nombres_apellidos: string;
  edad: number | null;
  carrera: string | null;
  deportes: string[] | null;
  cintas: string[] | null;
};

const StudentList: React.FC = () => {
  // --- LÓGICA (INTACTA) ---
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [cintaFilter, setCintaFilter] = useState('');
  
  const [allDeportes, setAllDeportes] = useState<string[]>([]);
  const [allCintas, setAllCintas] = useState<string[]>([]);

  // Fetch Inicial
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: studentsData } = await supabase.from('vista_lista_estudiantes_completa').select('*');
        if (studentsData) setStudents(studentsData as StudentListItem[]);

        const { data: deportesRes } = await supabase.from('deportes').select('nombre').order('nombre');
        if (deportesRes) setAllDeportes(deportesRes.map(d => d.nombre));

        const { data: cintasRes } = await supabase.from('cinta_tipos').select('color').order('color');
        if (cintasRes) setAllCintas(cintasRes.map(c => c.color));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lógica Filtrado
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = student.nombres_apellidos.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.cedula.includes(searchTerm);
      const matchSport = !sportFilter || (student.deportes && student.deportes.includes(sportFilter));
      const matchCinta = !cintaFilter || (student.cintas && student.cintas.includes(cintaFilter));
      return matchSearch && matchSport && matchCinta;
    });
  }, [students, searchTerm, sportFilter, cintaFilter]);

  const handleDelete = async (id: string, name: string) => {
    toast.error(`¿Estás seguro de que quieres eliminar a ${name}?`, {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const { error } = await supabase.rpc('delete_student', { p_student_id: id });
          if (error) {
            toast.error(`Error al eliminar: ${error.message}`);
          } else {
            setStudents(prev => prev.filter(s => s.id !== id));
            toast.success(`${name} ha sido eliminado.`);
          }
        },
      },
      cancel: { label: 'Cancelar' },
    });
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-violet-500'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // --- RENDERIZADO (DISEÑO MEJORADO) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* 1. Header Principal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Users className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-900 leading-none">Directorio de Estudiantes</h1>
               <p className="text-xs text-slate-500 mt-1 font-medium">Gestión y seguimiento deportivo</p>
             </div>
          </div>
          
          <button 
            onClick={() => navigate('/students/new')} 
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition-all transform active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline">Registrar Nuevo</span>
          </button>
        </div>
      </header>

      {/* 2. Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Contenedor de la Tabla y Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* A. Barra de Herramientas (Filtros) */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between items-center">
             
             {/* Buscador */}
             <div className="relative w-full xl:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o cédula..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                />
             </div>

             {/* Selectores */}
             <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                {/* Filtro Deporte */}
                <div className="relative w-full sm:w-48">
                   <select 
                      value={sportFilter}
                      onChange={(e) => setSportFilter(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-600 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-sm font-medium hover:border-slate-400 transition-colors"
                   >
                      <option value="">Todos los Deportes</option>
                      {allDeportes.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Filtro Cinta */}
                <div className="relative w-full sm:w-48">
                   <select 
                      value={cintaFilter}
                      onChange={(e) => setCintaFilter(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-600 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-sm font-medium hover:border-slate-400 transition-colors"
                   >
                      <option value="">Todas las Cintas</option>
                      {allCintas.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Botón Limpiar */}
                {(searchTerm || sportFilter || cintaFilter) && (
                   <button 
                     onClick={() => {setSearchTerm(''); setSportFilter(''); setCintaFilter('');}}
                     className="px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                   >
                     <X className="w-4 h-4" />
                     Limpiar
                   </button>
                )}
             </div>
          </div>

          {/* B. Tabla de Datos */}
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="text-sm font-medium">Cargando datos...</span>
               </div>
            ) : filteredStudents.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                     <Filter className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-semibold">No se encontraron resultados</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                     Intenta ajustar los filtros de búsqueda para encontrar lo que necesitas.
                  </p>
               </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-4 pl-6 pr-4">Estudiante</th>
                    <th className="py-4 px-4">Información</th>
                    <th className="py-4 px-4">Deportes</th>
                    <th className="py-4 px-4">Nivel / Cintas</th>
                    <th className="py-4 pr-6 pl-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                      
                      {/* 1. Estudiante (Avatar + Nombre) */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full ${getAvatarColor(student.nombres_apellidos)} text-white flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white`}>
                              {student.nombres_apellidos.charAt(0)}
                           </div>
                           <div>
                              <div className="font-bold text-slate-800 text-sm">{student.nombres_apellidos}</div>
                              <div className="text-xs text-slate-500 font-mono">{student.cedula}</div>
                           </div>
                        </div>
                      </td>

                      {/* 2. Información (Edad / Carrera) */}
                      <td className="py-4 px-4">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700 block truncate max-w-[180px]" title={student.carrera || ''}>
                               {student.carrera || 'No registrada'}
                            </span>
                            <span className="text-xs text-slate-500">
                               {student.edad ? `${student.edad} años` : 'Edad N/A'}
                            </span>
                         </div>
                      </td>

                      {/* 3. Deportes */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                           {student.deportes && student.deportes.length > 0 ? (
                              student.deportes.map((d, i) => (
                                 <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {d}
                                 </span>
                              ))
                           ) : <span className="text-slate-400 text-xs italic">-</span>}
                        </div>
                      </td>

                      {/* 4. Cintas */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                           {student.cintas && student.cintas.length > 0 ? (
                              student.cintas.map((c, i) => (
                                 <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-emerald-100">
                                    {c}
                                 </span>
                              ))
                           ) : <span className="text-slate-400 text-xs italic">-</span>}
                        </div>
                      </td>

                      {/* 5. ACCIONES (Visibles, sin fondo) */}
                      <td className="py-4 pr-6 pl-4">
                        <div className="flex items-center justify-end gap-3">
                           {/* Botón Ver */}
                           <button 
                              onClick={() => navigate(`/students/${student.cedula}`)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                              title="Ver ficha completa"
                           >
                              <Eye className="w-5 h-5" />
                           </button>

                           {/* Botón Editar */}
                           <button 
                              onClick={() => navigate(`/students/edit/${student.cedula}`)}
                              className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                              title="Editar registro"
                           >
                              <Edit3 className="w-5 h-5" />
                           </button>

                           {/* Botón Eliminar */}
                           <button 
                              onClick={() => handleDelete(student.id, student.nombres_apellidos)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                              title="Eliminar estudiante"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer Simple */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total: {filteredStudents.length} Registros
             </span>
          </div>

        </div>
      </main>
    </div>
  );
};

export default StudentList;
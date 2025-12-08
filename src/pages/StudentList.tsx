import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, Search, Eye, Edit3, Trash2, 
  Filter, X, Trophy, Activity, ChevronDown, LayoutGrid 
} from 'lucide-react';

// --- TIPOS ---
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
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- FILTROS ---
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
    if (confirm(`¿Eliminar a ${name}?`)) {
      await supabase.rpc('delete_student', { p_student_id: id });
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-500'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    // FONDO GLOBAL: Gris muy suave para contraste
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans overflow-hidden">
      
      {/* 1. HEADER SUPERIOR - Altura generosa y separado del contenido */}
      <div className="bg-[#0f172a] text-white shrink-0 shadow-lg z-20">
        <div className="px-8 py-5 flex justify-between items-center max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/5">
               <LayoutGrid className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Panel de Estudiantes</h1>
              <p className="text-slate-400 text-sm">Gestión de inscripciones y seguimiento</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/students/new')} 
            className="group bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-900/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      {/* 2. CONTENEDOR PRINCIPAL FLOTANTE - Aquí está el truco del "Aire" */}
      <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col max-w-[1920px] mx-auto w-full">
        
        {/* TARJETA BLANCA QUE ENCIERRA TODO (Borde redondeado grande + Sombra suave) */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col h-full overflow-hidden">
          
          {/* A. SECCIÓN DE FILTROS (Padding Generoso) */}
          <div className="p-6 border-b border-slate-100 bg-white shrink-0">
            <div className="flex flex-col lg:flex-row gap-5 items-center justify-between">
              
              {/* Buscador Grande */}
              <div className="relative w-full lg:w-[450px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, apellido o cédula..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Filtros Dropdown (Con espacio entre ellos) */}
              <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                 
                 {/* Select Deporte */}
                 <div className="relative min-w-[200px]">
                   <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <select 
                     value={sportFilter}
                     onChange={(e) => setSportFilter(e.target.value)}
                     className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer transition-all font-medium text-sm"
                   >
                     <option value="">Todos los Deportes</option>
                     {allDeportes.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                 </div>

                 {/* Select Cinta */}
                 <div className="relative min-w-[200px]">
                   <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <select 
                     value={cintaFilter}
                     onChange={(e) => setCintaFilter(e.target.value)}
                     className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer transition-all font-medium text-sm"
                   >
                     <option value="">Todas las Cintas</option>
                     {allCintas.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                 </div>

                 {/* Botón Limpiar */}
                 {(searchTerm || sportFilter || cintaFilter) && (
                    <button 
                      onClick={() => {setSearchTerm(''); setSportFilter(''); setCintaFilter('');}}
                      className="px-4 py-3.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden xl:inline">Limpiar</span>
                    </button>
                 )}
              </div>
            </div>
          </div>

          {/* B. TABLA (Con espacio interno y filas más altas) */}
          <div className="flex-1 overflow-auto bg-white relative">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                 <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
                 <span className="font-medium">Cargando base de datos...</span>
               </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center pb-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No hay resultados</h3>
                <p className="text-slate-500">Intenta cambiar los filtros de búsqueda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="py-5 pl-8 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Estudiante</th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Edad</th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Carrera</th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Deportes</th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Nivel / Cintas</th>
                    <th className="py-5 pr-8 pl-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors group">
                      
                      {/* 1. Nombre - Padding Grande */}
                      <td className="py-5 pl-8 pr-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full ${getAvatarColor(student.nombres_apellidos)} text-white flex items-center justify-center text-lg font-bold shadow-sm ring-4 ring-white`}>
                            {student.nombres_apellidos.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-base">{student.nombres_apellidos}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                {student.cedula}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Edad */}
                      <td className="py-5 px-6 text-slate-600 font-medium">
                        {student.edad ? `${student.edad} años` : <span className="text-slate-300">-</span>}
                      </td>

                      {/* 3. Carrera */}
                      <td className="py-5 px-6">
                         <div className="text-sm text-slate-600 font-medium max-w-[200px] truncate" title={student.carrera || ''}>
                            {student.carrera || <span className="text-slate-300 italic">No registrada</span>}
                         </div>
                      </td>

                      {/* 4. Deportes (Tags espaciados) */}
                      <td className="py-5 px-6">
                        <div className="flex flex-wrap gap-2">
                          {student.deportes && student.deportes.length > 0 ? (
                            student.deportes.map((d, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                                {d}
                              </span>
                            ))
                          ) : <span className="text-slate-300 italic text-sm">Sin deportes</span>}
                        </div>
                      </td>

                      {/* 5. Cintas (Tags espaciados) */}
                      <td className="py-5 px-6">
                        <div className="flex flex-wrap gap-2">
                          {student.cintas && student.cintas.length > 0 ? (
                            student.cintas.map((c, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                {c}
                              </span>
                            ))
                          ) : <span className="text-slate-300 italic text-sm">-</span>}
                        </div>
                      </td>

                      {/* 6. Acciones (Botones Grandes y Visibles) */}
                      <td className="py-5 pr-8 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                          <button 
                            onClick={() => navigate(`/students/${student.cedula}`)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg transition-all"
                            title="Ver Ficha"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => navigate(`/students/edit/${student.cedula}`)}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id, student.nombres_apellidos)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg transition-all"
                            title="Eliminar"
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

          {/* Footer de la tabla */}
          <div className="bg-slate-50 px-8 py-3 border-t border-slate-200 flex justify-end shrink-0">
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
               Total Registros: {filteredStudents.length}
             </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentList;
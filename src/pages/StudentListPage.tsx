import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, Search, Eye, Edit3, Trash2, 
  X, Filter, Trophy, Activity, Users, MoreHorizontal 
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
    const colors = ['bg-slate-800', 'bg-indigo-600', 'bg-blue-600', 'bg-violet-600', 'bg-emerald-600'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // --- LÓGICA DE COLOR DE CINTA (SOLO EL PUNTO) ---
  const getBeltDotColor = (cintaName: string) => {
    const lower = cintaName.toLowerCase();
    
    if (lower.includes('amarill')) return 'bg-yellow-400';
    if (lower.includes('naranj')) return 'bg-orange-500';
    if (lower.includes('azul')) return 'bg-blue-600';
    if (lower.includes('verd')) return 'bg-emerald-500';
    if (lower.includes('roj')) return 'bg-red-600';
    if (lower.includes('morad') || lower.includes('purpur')) return 'bg-purple-600';
    if (lower.includes('cafe') || lower.includes('marr')) return 'bg-amber-800';
    if (lower.includes('negr')) return 'bg-slate-900'; 
    if (lower.includes('blanc')) return 'bg-slate-200 border border-slate-300'; // Borde extra para blanco
    
    return 'bg-slate-400';
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50/50 font-sans overflow-hidden">
      
      {/* 1. HEADER LIMPIO */}
      <div className="pt-8 pb-6 px-6 md:px-10 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Directorio de Estudiantes
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
              Total: {filteredStudents.length}
            </span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gestión académica y seguimiento de grados deportivos.
          </p>
        </div>

        <button 
          onClick={() => navigate('/students/new')} 
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-slate-200 transition-all flex items-center gap-2 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>Registrar Nuevo</span>
        </button>
      </div>

      {/* 2. BARRA DE FILTROS */}
      <div className="px-6 md:px-10 py-4 shrink-0 z-10">
        <div className="flex flex-col xl:flex-row gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          
          {/* Buscador */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o cédula..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white text-sm text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 items-center no-scrollbar">
             {/* Filtro Deporte */}
             <div className="relative min-w-[180px]">
               <select 
                 value={sportFilter}
                 onChange={(e) => setSportFilter(e.target.value)}
                 className="w-full pl-3 pr-8 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
               >
                 <option value="">Todos los Deportes</option>
                 {allDeportes.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
               <Activity className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Filtro Cinta */}
            <div className="relative min-w-[180px]">
               <select 
                 value={cintaFilter}
                 onChange={(e) => setCintaFilter(e.target.value)}
                 className="w-full pl-3 pr-8 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
               >
                 <option value="">Todas las Cintas</option>
                 {allCintas.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <Trophy className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Botón Limpiar */}
            {(searchTerm || sportFilter || cintaFilter) && (
              <button 
                onClick={() => {setSearchTerm(''); setSportFilter(''); setCintaFilter('');}}
                className="h-10 px-3 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium shrink-0"
              >
                <X className="w-4 h-4 mr-1" />
                Borrar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABLA */}
      <div className="flex-1 overflow-hidden px-6 md:px-10 pb-6">
        <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* Header Tabla */}
          <div className="grid grid-cols-[2fr,1fr,1.5fr,1.5fr,1.5fr,100px] gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
            <div>Estudiante</div>
            <div>Edad</div>
            <div>Carrera</div>
            <div>Deportes</div>
            <div>Grados / Cintas</div>
            <div className="text-right">Acciones</div>
          </div>

          {/* Body Tabla (Scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3 mt-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600"></div>
                 <span className="text-sm">Cargando...</span>
               </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Filter className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-medium">Sin resultados</h3>
                <p className="text-slate-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="grid grid-cols-[2fr,1fr,1.5fr,1.5fr,1.5fr,100px] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors group text-sm">
                    
                    {/* 1. Nombre */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 shrink-0 rounded-full ${getAvatarColor(student.nombres_apellidos)} text-white flex items-center justify-center text-sm font-bold shadow-sm`}>
                        {student.nombres_apellidos.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate" title={student.nombres_apellidos}>
                          {student.nombres_apellidos}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{student.cedula}</div>
                      </div>
                    </div>

                    {/* 2. Edad */}
                    <div>
                      {student.edad ? (
                        <span className="text-slate-600 font-medium">{student.edad} años</span>
                      ) : <span className="text-slate-300">-</span>}
                    </div>

                    {/* 3. Carrera */}
                    <div className="text-slate-600 truncate" title={student.carrera || ''}>
                      {student.carrera || <span className="text-slate-300">-</span>}
                    </div>

                    {/* 4. Deportes */}
                    <div className="flex flex-wrap gap-1.5">
                      {student.deportes && student.deportes.length > 0 ? (
                        student.deportes.map((d, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {d}
                          </span>
                        ))
                      ) : <span className="text-slate-300">-</span>}
                    </div>

                    {/* 5. Cintas (NUEVO DISEÑO) */}
                    <div className="flex flex-wrap gap-2">
                      {student.cintas && student.cintas.length > 0 ? (
                        student.cintas.map((c, i) => (
                          // Diseño SIN fondo de color en el texto. Solo un punto indicativo.
                          <div 
                            key={i} 
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-white shadow-sm"
                            title={`Cinta ${c}`}
                          >
                            <span className={`w-2 h-2 rounded-full shadow-sm ${getBeltDotColor(c)}`}></span>
                            <span className="text-xs font-medium text-slate-700">{c}</span>
                          </div>
                        ))
                      ) : <span className="text-slate-300">-</span>}
                    </div>

                    {/* 6. Acciones */}
                    <div className="flex justify-end relative">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/students/${student.cedula}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/students/edit/${student.cedula}`)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.nombres_apellidos)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-100 group-hover:opacity-0 transition-opacity text-slate-300">
                         <MoreHorizontal className="w-5 h-5" />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentList;
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Printer, Edit3, ArrowLeft, User, FileText, 
  Activity, Trophy, HeartPulse, Building2 
} from 'lucide-react';

// === INTERFACES (Lógica Intacta) ===
interface FichaMedica {
  tipo_sangre: string;
  patologias: string | null;
  ultima_consulta_medica: string | null;
}

interface TestFisico {
  id: number;
  categoria: string;
  prueba: string;
  unidad: string;
  resultado: string;
  created_at: string;
  fecha_prueba: string;
}

interface RecordDeportivo {
  id: number;
  nombre_competencia: string;
  fecha_competencia: string;
  resultado: string;
  puesto: number;
}

interface RawEstudiante {
  id: string;
  cedula: string;
  nombres_apellidos: string;
  fecha_nacimiento: string;
  direccion: string;
  correo: string;
  carrera_id: number | null;
  facultad_id: number | null;
}

interface RawCarrera {
  id: number;
  nombre: string;
  facultad_id: number;
}

interface RawFacultad {
  id: number;
  nombre: string;
}

interface RawDeporteItem {
  estudiante_deporte: any;
  deporte: { id: number; nombre: string };
  cinta_tipo: { id: number; color: string } | null;
}

interface RawCintaItem {
  deporte_id: number;
  deporte_nombre: string;
  cinta_tipo_id: number | null;
  cinta_color: string | null;
}

interface GetStudentFullDetailsData {
  estudiante: RawEstudiante;
  deportes: RawDeporteItem[];
  ficha_medica: FichaMedica | null;
  tests_fisicos: TestFisico[];
  records_deportivos: RecordDeportivo[];
  carrera: RawCarrera | null;
  facultad: RawFacultad | null;
  cintas: RawCintaItem[];
}

interface GetStudentFullDetailsResponse {
  data: GetStudentFullDetailsData | null;
  error: { message: string; detail?: string } | null;
}

interface StudentDetails {
  id: string;
  cedula: string;
  nombres_apellidos: string;
  fecha_nacimiento: string;
  direccion: string;
  correo: string;
  carrera: string;
  facultad: string;
  edad: number;
  ficha_medica: FichaMedica | null;
  tests_fisicos: TestFisico[];
  deportes: string[];
  cintas: string[] | null;
  records_deportivos: RecordDeportivo[];
}

// === HELPER FUNCTIONS (Lógica Intacta) ===
const calcularEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

const mapToStudentDetails = (payload: GetStudentFullDetailsData): StudentDetails => {
  const {
    estudiante, deportes, ficha_medica, tests_fisicos, records_deportivos, carrera, facultad, cintas,
  } = payload;

  const deportesNombres = deportes?.map(d => d.deporte.nombre) ?? [];
  const cintasNombres = cintas && cintas.length > 0
      ? cintas.filter(c => c.cinta_color).map(c => `${c.deporte_nombre} - ${c.cinta_color}`)
      : null;

  return {
    id: estudiante.id,
    cedula: estudiante.cedula,
    nombres_apellidos: estudiante.nombres_apellidos,
    fecha_nacimiento: estudiante.fecha_nacimiento,
    direccion: estudiante.direccion,
    correo: estudiante.correo,
    carrera: carrera?.nombre ?? 'No registrada',
    facultad: facultad?.nombre ?? 'No registrada',
    edad: calcularEdad(estudiante.fecha_nacimiento),
    ficha_medica: ficha_medica,
    tests_fisicos,
    deportes: deportesNombres,
    cintas: cintasNombres,
    records_deportivos,
  };
};

// === COMPONENTES DE DISEÑO ===

// Campo de Dato Individual (Optimizada para Grid)
const DataField: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
  <div className={`${fullWidth ? 'col-span-1 md:col-span-2 print:col-span-3' : 'col-span-1'} mb-2 print:mb-1`}>
    <dt className="text-xs font-bold text-slate-500 uppercase tracking-wide print:text-black print:text-[10px]">{label}</dt>
    <dd className="text-sm font-medium text-slate-900 border-b border-slate-100 pb-1 mt-0.5 print:text-xs print:border-slate-300">
      {value || <span className="text-slate-300 italic">-</span>}
    </dd>
  </div>
);

// Contenedor de Sección
const SectionBlock: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 overflow-hidden print:shadow-none print:border print:border-slate-300 print:mb-4 print:rounded-none">
    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 print:bg-slate-100 print:py-1.5 print:border-slate-300">
      <span className="text-indigo-600 print:text-black print:scale-75">{icon}</span>
      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider print:text-black print:text-xs">{title}</h3>
    </div>
    <div className="p-6 print:p-3">
      {children}
    </div>
  </section>
);

const StudentDetail: React.FC = () => {
  const { cedula } = useParams<{ cedula: string }>();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      if (!cedula) return;
      setLoading(true);
      try {
        const { data, error: rpcError } = await supabase.rpc<GetStudentFullDetailsResponse>(
          'get_student_full_details', { p_cedula: cedula }
        );
        if (rpcError) throw rpcError;
        if (data?.data) {
          setStudent(mapToStudentDetails(data.data));
        } else {
          setError('Estudiante no encontrado');
        }
      } catch (err: any) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [cedula]);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando expediente...</div>;
  if (error || !student) return <div className="p-10 text-center text-red-500 font-bold">{error || 'No encontrado'}</div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 print:bg-white print:p-0 print:pb-0">
      
      {/* --- BARRA DE NAVEGACIÓN (Se oculta al imprimir) --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button onClick={() => navigate('/students')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                 <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-slate-800">Expediente Digital</h1>
           </div>
           <div className="flex gap-3">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-medium transition-colors">
                 <Printer className="w-4 h-4" /> Imprimir PDF
              </button>
              <button onClick={() => navigate(`/students/edit/${student.cedula}`)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
                 <Edit3 className="w-4 h-4" /> Editar
              </button>
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 print:max-w-none print:px-8 print:py-4">
        
        {/* --- ENCABEZADO DE IMPRESIÓN (Solo visible al imprimir) --- */}
        <div className="hidden print:flex flex-col items-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-widest">Unidad de Deportes</h1>
            <h2 className="text-sm font-semibold uppercase text-gray-600">Ficha Técnica del Deportista</h2>
            <p className="text-xs text-gray-500 mt-1">Fecha de Emisión: {new Date().toLocaleDateString()}</p>
        </div>

        {/* 1. SECCIÓN: DATOS PERSONALES (Compacto y Profesional) */}
        <SectionBlock title="Información Personal y Académica" icon={<User className="w-4 h-4" />}>
           <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 print:grid-cols-3 print:gap-y-2">
              <DataField label="Nombres Completos" value={student.nombres_apellidos} fullWidth />
              <DataField label="Cédula de Identidad" value={student.cedula} />
              <DataField label="Fecha Nacimiento" value={`${student.fecha_nacimiento} (${student.edad} años)`} />
              <DataField label="Correo Institucional" value={student.correo} />
              <DataField label="Dirección" value={student.direccion} />
              <DataField label="Facultad" value={student.facultad} />
              <DataField label="Carrera" value={student.carrera} />
           </dl>
        </SectionBlock>

        {/* 2. GRID DEPORTIVO Y MÉDICO (Lado a lado en pantalla, apilado o grid en print) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
           
           {/* Perfil Deportivo */}
           <SectionBlock title="Perfil Deportivo" icon={<Trophy className="w-4 h-4" />}>
              <dl className="grid grid-cols-1 gap-4 print:grid-cols-2">
                 <DataField label="Disciplina(s)" value={student.deportes?.join(', ')} />
                 <DataField label="Nivel / Cintas" value={student.cintas?.join(', ')} />
              </dl>
           </SectionBlock>

           {/* Ficha Médica */}
           <SectionBlock title="Datos Médicos" icon={<HeartPulse className="w-4 h-4" />}>
              <dl className="grid grid-cols-2 gap-4">
                 <DataField label="Tipo de Sangre" value={student.ficha_medica?.tipo_sangre} />
                 <DataField label="Última Consulta" value={student.ficha_medica?.ultima_consulta_medica} />
                 <DataField label="Patologías / Alergias" value={student.ficha_medica?.patologias} fullWidth />
              </dl>
           </SectionBlock>
        </div>

        {/* 3. TABLA DE TESTS FÍSICOS */}
        <SectionBlock title="Evaluación de Rendimiento Físico" icon={<Activity className="w-4 h-4" />}>
          {student.tests_fisicos.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-slate-200 print:border-black">
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="px-4 py-3 print:py-2">Categoría</th>
                    <th className="px-4 py-3 print:py-2">Prueba</th>
                    <th className="px-4 py-3 print:py-2">Resultado</th>
                    <th className="px-4 py-3 print:py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {student.tests_fisicos.map(test => (
                    <tr key={test.id}>
                      <td className="px-4 py-3 print:py-1.5 font-medium">{test.categoria}</td>
                      <td className="px-4 py-3 print:py-1.5">{test.prueba}</td>
                      <td className="px-4 py-3 print:py-1.5 font-bold">{test.resultado} {test.unidad}</td>
                      <td className="px-4 py-3 print:py-1.5 text-slate-500 print:text-black">{new Date(test.fecha_prueba).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No hay registros de evaluaciones.</p>
          )}
        </SectionBlock>

        {/* 4. TABLA DE COMPETENCIAS */}
        <SectionBlock title="Historial Competitivo" icon={<FileText className="w-4 h-4" />}>
          {student.records_deportivos.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-slate-200 print:border-black">
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="px-4 py-3 print:py-2">Competencia</th>
                    <th className="px-4 py-3 print:py-2">Fecha</th>
                    <th className="px-4 py-3 print:py-2">Puesto</th>
                    <th className="px-4 py-3 print:py-2">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {student.records_deportivos.map(record => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 print:py-1.5 font-medium">{record.nombre_competencia}</td>
                      <td className="px-4 py-3 print:py-1.5">{record.fecha_competencia}</td>
                      <td className="px-4 py-3 print:py-1.5 font-bold">#{record.puesto}</td>
                      <td className="px-4 py-3 print:py-1.5 uppercase text-xs">{record.resultado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <p className="text-sm text-slate-400 italic">No hay registros de competencias.</p>
          )}
        </SectionBlock>

        {/* Pie de página de impresión */}
        <div className="hidden print:flex mt-8 pt-8 border-t border-black justify-between text-[10px] text-gray-500">
            <span>Sistema de Gestión Deportiva ESPOCH</span>
            <span>Generado el: {new Date().toLocaleString()}</span>
        </div>

      </main>
    </div>
  );
};

export default StudentDetail;
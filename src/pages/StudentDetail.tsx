import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface FichaMedica {
  tipo_sangre: string;
  patologias: string | null;
  ultima_consulta_medica: string | null; // 'YYYY-MM-DD'
}

interface TestFisico {
  id: number;
  categoria: string;
  prueba: string;
  unidad: string;
  resultado: string;
  created_at: string; // timestamp
}

interface RecordDeportivo {
  id: number;
  nombre_competencia: string;
  fecha_competencia: string; // 'YYYY-MM-DD'
  resultado: string;
  puesto: number;
}

// === Tipos que reflejan lo que devuelve la función PL/pgSQL ===
interface RawEstudiante {
  id: string; // uuid
  cedula: string;
  nombres_apellidos: string;
  fecha_nacimiento: string;
  direccion: string;
  correo: string;
  carrera: string;
  facultad: string;
  // puedes añadir más campos si luego los usas
}

interface RawDeporteItem {
  estudiante_deporte: any; // no lo usas en el front por ahora
  deporte: { id: number; nombre: string };
  cinta_tipo: { id: number; nombre: string } | null;
}

interface GetStudentFullDetailsData {
  estudiante: RawEstudiante;
  deportes: RawDeporteItem[];
  ficha_medica: FichaMedica | null;
  tests_fisicos: TestFisico[];
  records_deportivos: RecordDeportivo[];
}

interface GetStudentFullDetailsResponse {
  data: GetStudentFullDetailsData | null;
  error: { message: string; detail?: string } | null;
}

// === Tipo que usará tu UI (ya “planchado”) ===
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

// Componente reutilizable para mostrar un campo de datos
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row py-2 border-b border-gray-200">
    <strong className="font-semibold w-full sm:w-1/3">{label}:</strong>
    <span className="w-full sm:w-2/3">
      {value ?? <span className="text-gray-400">No disponible</span>}
    </span>
  </div>
);

// Componente para secciones
const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-gray-700 mb-3 bg-gray-100 p-2 rounded-md">
      {title}
    </h2>
    {children}
  </div>
);

// Helper para calcular edad a partir de la fecha
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

// Mapea lo que devuelve la función PL/pgSQL a StudentDetails
const mapToStudentDetails = (payload: GetStudentFullDetailsData): StudentDetails => {
  const { estudiante, deportes, ficha_medica, tests_fisicos, records_deportivos } = payload;

  const deportesNombres = deportes?.map(d => d.deporte.nombre) ?? [];
  const cintasNombres = deportes
    ?.map(d => d.cinta_tipo?.nombre)
    .filter((c): c is string => Boolean(c)) ?? null;

  return {
    id: estudiante.id,
    cedula: estudiante.cedula,
    nombres_apellidos: estudiante.nombres_apellidos,
    fecha_nacimiento: estudiante.fecha_nacimiento,
    direccion: estudiante.direccion,
    correo: estudiante.correo,
    carrera: estudiante.carrera,
    facultad: estudiante.facultad,
    edad: calcularEdad(estudiante.fecha_nacimiento),
    ficha_medica: ficha_medica,
    tests_fisicos,
    deportes: deportesNombres,
    cintas: cintasNombres,
    records_deportivos,
  };
};

const StudentDetail: React.FC = () => {
  const { cedula } = useParams<{ cedula: string }>();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      if (!cedula) {
        setError('No se proporcionó una cédula válida.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc<GetStudentFullDetailsResponse>(
          'get_student_full_details',
          { p_cedula: cedula }
        );

        if (rpcError) {
          throw rpcError;
        }

        if (!data) {
          setError('No se obtuvo respuesta del servidor.');
          return;
        }

        // data es el objeto que retorna tu función: { data: {...}, error: {...} }
        if (data.error) {
          setError(data.error.message || 'Ocurrió un error al obtener los datos del estudiante.');
          return;
        }

        if (!data.data) {
          setError('No se encontró ningún estudiante con la cédula proporcionada.');
          return;
        }

        const mapped = mapToStudentDetails(data.data);
        setStudent(mapped);
      } catch (err: any) {
        console.error('Error al obtener los detalles del estudiante:', err);
        setError('Ocurrió un error al cargar los datos del estudiante.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [cedula]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center p-8">Cargando detalles del estudiante...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!student) {
    return <div className="text-center p-8">No hay datos para mostrar.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      {/* --- Botones de Acción (No se imprimen) --- */}
      <div className="flex justify-between items-center mb-6 no-print">
        <Link to="/students" className="text-blue-600 hover:underline self-center">
          &larr; Volver a la lista
        </Link>
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* --- Área Imprimible --- */}
      <div className="p-8 bg-white shadow-lg rounded-lg printable-area">
        {/* Encabezado formal para impresión */}
        <div className="print-only-header text-center mb-8">
          <h1 className="text-2xl font-bold">Centro de Deportes ESPOCH</h1>
          <p className="text-lg">Ficha Deportiva del Estudiante</p>
        </div>

        <DetailSection title="Datos Personales y Académicos">
          <DetailItem label="Nombres y Apellidos" value={student.nombres_apellidos} />
          <DetailItem label="Cédula" value={student.cedula} />
          <DetailItem label="Email" value={student.correo} />
          <DetailItem label="Edad" value={`${student.edad} años`} />
          <DetailItem label="Fecha de Nacimiento" value={student.fecha_nacimiento} />
          <DetailItem label="Dirección" value={student.direccion} />
          <DetailItem label="Facultad" value={student.facultad} />
          <DetailItem label="Carrera" value={student.carrera} />
          <DetailItem label="Deportes" value={student.deportes?.join(', ')} />
          <DetailItem label="Cinta(s)" value={student.cintas?.join(', ')} />
        </DetailSection>

        {student.ficha_medica && Object.keys(student.ficha_medica).length > 0 && (
          <DetailSection title="Ficha Médica">
            <DetailItem label="Tipo de Sangre" value={student.ficha_medica.tipo_sangre} />
            <DetailItem label="Patologías" value={student.ficha_medica.patologias} />
            <DetailItem
              label="Última Consulta"
              value={student.ficha_medica.ultima_consulta_medica}
            />
          </DetailSection>
        )}

        {student.tests_fisicos && student.tests_fisicos.length > 0 && (
          <DetailSection title="Tests Físicos">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 font-semibold">Categoría</th>
                    <th className="p-3 font-semibold">Prueba</th>
                    <th className="p-3 font-semibold">Resultado</th>
                    <th className="p-3 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {student.tests_fisicos.map(test => (
                    <tr key={test.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{test.categoria}</td>
                      <td className="p-3">{test.prueba}</td>
                      <td className="p-3">
                        {test.resultado} {test.unidad}
                      </td>
                      <td className="p-3">
                        {new Date(test.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailSection>
        )}

        {student.records_deportivos && student.records_deportivos.length > 0 && (
          <DetailSection title="Récords Deportivos">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 font-semibold">Competencia</th>
                    <th className="p-3 font-semibold">Fecha</th>
                    <th className="p-3 font-semibold">Puesto</th>
                    <th className="p-3 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {student.records_deportivos.map(record => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{record.nombre_competencia}</td>
                      <td className="p-3">{record.fecha_competencia}</td>
                      <td className="p-3">{record.puesto}</td>
                      <td className="p-3">{record.resultado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailSection>
        )}

        <div className="flex justify-end space-x-4 border-t pt-6 mt-8 no-print">
          <button
            onClick={() => navigate(`/students/edit/${student.cedula}`)}
            className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition"
          >
            Editar
          </button>
          <button className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;

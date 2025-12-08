import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';
import Button from '../components/Button';
import './print.css'; // Import print-specific styles

// Tipos actualizados para coincidir con la nueva estructura de la función RPC
export type Estudiante = {
  id: string;
  cedula: string;
  nombres_apellidos: string;
  direccion: string;
  correo: string;
  fecha_nacimiento: string;
  facultad_id: number;
  facultad_nombre: string;
  carrera_id: number;
  carrera_nombre: string;
};

export type FullStudentDetails = {
  estudiante: Estudiante;
  deporte: { id: number; nombre: string } | null;
  cinta: { id: number; color: string } | null;
  ficha_medica: Database['public']['Tables']['fichas_medicas']['Row'] | null;
  tests_fisicos: (Database['public']['Tables']['tests_fisicos']['Row'] & { fecha_prueba: string })[];
  records_deportivos: (Database['public']['Tables']['records_deportivos']['Row'])[];
};

type RpcResponse = {
  data: FullStudentDetails | null;
  error: { message: string } | null;
};

// Helper component for styled sections
const DetailSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`mb-6 bg-white rounded-lg shadow-md p-6 ${className}`}>
    <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">{title}</h2>
    <div className="space-y-2 text-gray-800">
      {children}
    </div>
  </div>
);

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-4">
    <strong className="font-semibold col-span-1">{label}:</strong>
    <span className="col-span-2">{value ?? <span className="text-gray-400">No disponible</span>}</span>
  </div>
);

const StudentDetails: React.FC = () => {
  const { cedula } = useParams<{ cedula?: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<FullStudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async (id: string) => {
      setLoading(true);
      setError(null);
      setStudent(null);
      
      const { data: rpcResponse, error: clientError } = await supabase.rpc('get_student_full_details', { 
        p_cedula: id 
      }) as { data: RpcResponse | null; error: any };

      if (clientError) {
        console.error('Error fetching details:', clientError);
        setError(`Error al buscar al estudiante: ${clientError.message}`);
      } else if (rpcResponse && rpcResponse.error) {
        setError(rpcResponse.error.message || `No se encontró ningún estudiante con la cédula: ${id}`);
      } else if (rpcResponse && rpcResponse.data) {
        // La búsqueda fue exitosa, los datos están en rpcResponse.data
        setStudent(rpcResponse.data);
      } else {
        setError(`No se encontró ningún estudiante con la cédula: ${id}`);
      }
      setLoading(false);
    };

    if (cedula) {
      fetchDetails(cedula);
    }
  }, [cedula]);

  const handlePrint = () => {
    window.print();
  };

  // Función para calcular la edad
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  return (
    <div className="printable-area">
      <Button onClick={() => navigate('/students')} className="no-print mb-6" variant="secondary">
        &larr; Volver a la lista
      </Button>

      {loading && <div className="text-center p-8">Cargando...</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}
      
      {student && (
        <div id="student-record">
          <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-gray-800">Ficha Deportiva</h1>
             <Button onClick={handlePrint} className="no-print">Imprimir Ficha</Button>
          </div>
          
          <DetailSection title="Datos Personales">
            <DetailItem label="Cédula" value={student.estudiante.cedula} />
            <DetailItem label="Nombres y Apellidos" value={student.estudiante.nombres_apellidos} />
            <DetailItem label="Fecha de Nacimiento" value={student.estudiante.fecha_nacimiento ? new Date(student.estudiante.fecha_nacimiento).toLocaleDateString('es-EC', { timeZone: 'UTC' }) : 'N/A'} />
            <DetailItem label="Edad" value={`${calculateAge(student.estudiante.fecha_nacimiento)} años`} />
            <DetailItem label="Dirección" value={student.estudiante.direccion} />
            <DetailItem label="Correo" value={student.estudiante.correo} />
            <DetailItem label="Facultad" value={student.estudiante.facultad_nombre} />
            <DetailItem label="Carrera" value={student.estudiante.carrera_nombre} />
          </DetailSection>

          <DetailSection title="Información Deportiva">
            <DetailItem label="Deporte" value={student.deporte?.nombre} />
            <DetailItem label="Cinta" value={student.cinta?.color} />
          </DetailSection>

          {student.ficha_medica && (
            <DetailSection title="Ficha Médica">
                <DetailItem label="Tipo de Sangre" value={student.ficha_medica.tipo_sangre} />
                <DetailItem label="Patologías" value={student.ficha_medica.patologias} />
                <DetailItem label="Última Consulta Médica" value={student.ficha_medica.ultima_consulta_medica ? new Date(student.ficha_medica.ultima_consulta_medica).toLocaleDateString('es-EC', { timeZone: 'UTC' }) : 'N/A'} />
            </DetailSection>
          )}

          <DetailSection title="Tests Físicos">
            {student.tests_fisicos && student.tests_fisicos.length > 0 ? (
                <table className="w-full text-left mt-4">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="p-3">Categoría</th>
                            <th className="p-3">Prueba</th>
                            <th className="p-3">Resultado</th>
                            <th className="p-3">Unidad</th>
                            <th className="p-3">Fecha de Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {student.tests_fisicos.map(test => (
                            <tr key={test.id} className="border-b">
                                <td className="p-3 capitalize">{test.categoria}</td>
                                <td className="p-3">{test.prueba}</td>
                                <td className="p-3">{test.resultado}</td>
                                <td className="p-3">{test.unidad}</td>
                                <td className="p-3">{new Date(test.fecha_prueba).toLocaleDateString('es-EC', { timeZone: 'UTC' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p>No hay tests físicos registrados.</p>}
          </DetailSection>

          <DetailSection title="Récord Deportivo" className="print-break-before">
            {student.records_deportivos && student.records_deportivos.length > 0 ? (
                <table className="w-full text-left mt-4">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="p-3">Competencia</th>
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Resultado</th>
                            <th className="p-3">Puesto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {student.records_deportivos.map(record => (
                            <tr key={record.id} className="border-b">
                                <td className="p-3">{record.nombre_competencia}</td>
                                <td className="p-3">{record.fecha_competencia ? new Date(record.fecha_competencia).toLocaleDateString('es-EC', { timeZone: 'UTC' }) : 'N/A'}</td>
                                <td className="p-3">{record.resultado}</td>
                                <td className="p-3">{record.puesto}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p>No hay récords deportivos registrados.</p>}
          </DetailSection>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
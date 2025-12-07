import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';

// Tipo para los datos completos del estudiante que recibimos del RPC
type StudentDetails = {
  id: string;
  cedula: string;
  nombres_apellidos: string;
  fecha_nacimiento: string;
  direccion: string;
  correo: string;
  carrera: string;
  facultad: string;
  edad: number;
  ficha_medica: {
    tipo_sangre: string;
    patologias: string;
    ultima_consulta_medica: string;
  };
  tests_fisicos: {
    id: number;
    categoria: string;
    prueba: string;
    unidad: string;
    resultado: string;
  }[];
  deportes: string[];
  records_deportivos: {
    id: number;
    nombre_competencia: string;
    fecha_competencia: string;
    resultado: string;
    puesto: number;
  }[];
};

// Componente para mostrar una sección de detalles
const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 mb-4">{title}</h2>
    {children}
  </div>
);

// Componente para mostrar un campo de dato
const DetailField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-lg text-gray-900">{value || 'N/A'}</p>
  </div>
);

const StudentDetail: React.FC = () => {
  const { cedula } = useParams<{ cedula: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!cedula) return;
      setLoading(true);
      const { data, error } = await supabase.rpc('get_student_full_details', { p_cedula: cedula });

      if (error) {
        console.error('Error fetching student details:', error);
        setError('No se pudo cargar la información del estudiante.');
      } else if (Object.keys(data).length === 0) {
        setError('No se encontró un estudiante con la cédula proporcionada.');
      } else {
        setStudent(data);
      }
      setLoading(false);
    };

    fetchStudentData();
  }, [cedula]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando ficha del estudiante...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  if (!student) {
    return <div className="text-center p-8">No hay datos para mostrar.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button onClick={() => navigate('/')} variant="secondary" className="mb-6 flex items-center gap-2">
        <ArrowLeft size={20} />
        Volver a la Lista
      </Button>

      <h1 className="text-4xl font-bold text-gray-800 mb-2">{student.nombres_apellidos}</h1>
      <p className="text-xl text-gray-600 mb-8">Cédula: {student.cedula}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <DetailSection title="Datos Personales">
            <DetailField label="Edad" value={`${student.edad} años`} />
            <DetailField label="Fecha de Nacimiento" value={new Date(student.fecha_nacimiento).toLocaleDateString()} />
            <DetailField label="Correo Electrónico" value={student.correo} />
            <DetailField label="Dirección" value={student.direccion} />
            <DetailField label="Facultad" value={student.facultad} />
            <DetailField label="Carrera" value={student.carrera} />
          </DetailSection>

          <DetailSection title="Ficha Médica">
            <DetailField label="Tipo de Sangre" value={student.ficha_medica?.tipo_sangre} />
            <DetailField label="Patologías" value={student.ficha_medica?.patologias} />
            <DetailField label="Última Consulta Médica" value={student.ficha_medica?.ultima_consulta_medica ? new Date(student.ficha_medica.ultima_consulta_medica).toLocaleDateString() : 'N/A'} />
          </DetailSection>
        </div>

        <div>
          <DetailSection title="Información Deportiva">
            <DetailField label="Deportes" value={student.deportes?.join(', ')} />
          </DetailSection>

          <DetailSection title="Tests Físicos">
            {student.tests_fisicos?.length > 0 ? (
              student.tests_fisicos.map(test => (
                <div key={test.id} className="mb-4 p-3 border rounded-md">
                  <p className="font-semibold">{test.categoria}: {test.prueba}</p>
                  <p>Resultado: {test.resultado} {test.unidad}</p>
                </div>
              ))
            ) : <p>No hay tests físicos registrados.</p>}
          </DetailSection>

          <DetailSection title="Récords Deportivos">
            {student.records_deportivos?.length > 0 ? (
              student.records_deportivos.map(record => (
                <div key={record.id} className="mb-4 p-3 border rounded-md">
                  <p className="font-semibold">{record.nombre_competencia}</p>
                  <p>Fecha: {new Date(record.fecha_competencia).toLocaleDateString()}</p>
                  <p>Resultado: {record.resultado} (Puesto: {record.puesto})</p>
                </div>
              ))
            ) : <p>No hay récords deportivos registrados.</p>}
          </DetailSection>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Importar el cliente de Supabase
import { Database } from '../types/database';
import Input from '../components/Input'; // Asumiendo que existe un componente Input

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

// Definimos el tipo de la respuesta completa de la función RPC
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

    if (!cedula) {
      setError('Por favor, ingrese una cédula.');
      setLoading(false);
      return;
    }

    try {
      // Llamar a la función RPC para obtener los detalles completos del estudiante
      const { data: rpcResult, error: clientError } = await supabase.rpc('get_student_full_details', {
        p_cedula: cedula
      });
      
      console.log('Respuesta de Supabase:', rpcResult);

      if (clientError) {
        throw clientError;
      }

      if (rpcResult && rpcResult.error) {
        setError(rpcResult.error.message || 'Estudiante no encontrado.');
      } else if (rpcResult && rpcResult.data) {
        // Búsqueda exitosa
        navigate(`/students/${cedula}`);
      } else {
        setError('No se encontró ningún estudiante con la cédula proporcionada.');
      }
    } catch (err: any) {
      console.error('Error al buscar estudiante:', err);
      // Mostramos un mensaje más amigable al usuario y guardamos el detalle en la consola.
      setError(
        err.message.includes('permission denied') ? 'Error de permisos en la base de datos.' : 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-2xl mx-auto mt-10">
      <h1 className="text-4xl font-bold mb-4 text-blue-800">Bienvenido al Sistema de Ficha Deportiva</h1>
      <p className="text-lg text-gray-700 mb-8">
        Gestione la información médica, física y deportiva de los estudiantes de artes marciales de la ESPOCH.
      </p>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Buscar Estudiante por Cédula</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Input
            id="cedula-search"
            label="Cédula"
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ingrese la cédula del estudiante"
            required
            className="w-full sm:w-64"
          />
          <button
            type="submit"
            className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300 w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar Estudiante'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      <div className="space-y-4 sm:space-x-4 flex flex-col sm:flex-row justify-center">
        <Link 
          to="/students/new"
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 inline-block"
        >
          Registrar Nuevo Estudiante
        </Link>
        <Link 
          to="/students" 
          className="bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition duration-300 inline-block"
        >
          Ver Lista de Estudiantes
        </Link>
      </div>
    </div>
  );
};

export default Home;

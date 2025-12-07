import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Importar el cliente de Supabase
import Input from '../components/Input'; // Asumiendo que existe un componente Input

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
      const { data, error } = await supabase.rpc('get_student_full_details', { p_cedula: cedula });

      if (error) {
        throw error;
      }

      // CORRECCIÓN: La función RPC devuelve un objeto vacío {} si no encuentra nada.
      // Debemos verificar si el objeto tiene propiedades (como 'id') para confirmar que se encontró un estudiante.
      if (data && data.id) {
        // Si se encuentra el estudiante, navegar a la página de detalles
        navigate(`/students/${cedula}`);
      } else {
        setError('No se encontró ningún estudiante con esa cédula.');
      }
    } catch (err: any) {
      console.error('Error al buscar estudiante:', err);
      setError(`Error al buscar estudiante: ${err.message || 'Error desconocido'}`);
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

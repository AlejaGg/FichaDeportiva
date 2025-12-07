import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { DeporteName } from '../types/database';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { PlusCircle, Search, Eye, Edit, Trash2 } from 'lucide-react';

// Definimos un tipo más simple para la lista de estudiantes
type StudentListItem = {
  id: string;
  cedula: string;
  nombres_apellidos: string;
  carrera: string | null;
  deportes: string[] | null;
};

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [carreraFilter, setCarreraFilter] = useState('');
  const [allCarreras, setAllCarreras] = useState<string[]>([]);
  const [availableSports, setAvailableSports] = useState<DeporteName[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      // Usamos la vista que ya tenías, es más eficiente
      const { data, error } = await supabase
        .from('estudiantes_vista')
        .select('id, cedula, nombres_apellidos, carrera, deportes');

      if (error) {
        console.error('Error fetching students:', error);
        setError('No se pudo cargar la lista de estudiantes.');
      } else {
        setStudents(data as StudentListItem[]);
      }
      setLoading(false);
    };

    fetchStudents();

    // Cargar todas las carreras para el filtro
    const fetchCarreras = async () => {
      const { data, error } = await supabase
        .from('carreras')
        .select('nombre')
        .order('nombre');
      if (!error && data) {
        setAllCarreras(data.map(c => c.nombre));
      }
    };
    fetchCarreras();
  }, []);

  // Lógica para filtrar estudiantes en el cliente
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.cedula.includes(searchTerm) || 
                            student.nombres_apellidos.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCarrera = !carreraFilter || student.carrera === carreraFilter;
      return matchesSearch && matchesCarrera;
    });
  }, [students, searchTerm, carreraFilter]);

  const handleDelete = async (studentId: string, studentName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${studentName}? Esta acción no se puede deshacer.`)) {
        const { error } = await supabase.rpc('delete_student', { p_student_id: studentId });
        if (error) {
            console.error('Error deleting student:', error);
            alert(`Error al eliminar: ${error.message}`);
        } else {
            alert('Estudiante eliminado con éxito.');
            // Actualizar la lista de estudiantes en el estado para reflejar el cambio
            setStudents(students.filter(s => s.id !== studentId));
        }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Estudiantes</h1>
        <Button onClick={() => navigate('/students/new')} className="flex items-center gap-2">
          <PlusCircle size={20} />
          Crear Estudiante
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por cédula o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <Select
            value={carreraFilter}
            onChange={(e) => setCarreraFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las Carreras</option>
            {allCarreras.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      {/* Tabla de Estudiantes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center p-8">Cargando estudiantes...</div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md m-4">{error}</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-4 font-semibold">Cédula</th>
                <th className="p-4 font-semibold">Nombres y Apellidos</th>
                <th className="p-4 font-semibold">Carrera</th>
                <th className="p-4 font-semibold">Deportes</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">{student.cedula}</td>
                    <td className="p-4">{student.nombres_apellidos}</td>
                    <td className="p-4">{student.carrera ?? 'N/A'}</td>
                    <td className="p-4">{student.deportes?.join(', ') ?? 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => navigate(`/students/${student.cedula}`)} title="Ver Ficha" className="text-blue-600 hover:text-blue-800">
                          <Eye size={20} />
                        </button>
                        <button onClick={() => navigate(`/students/edit/${student.cedula}`)} title="Editar" className="text-green-600 hover:text-green-800">
                          <Edit size={20} />
                        </button>
                        <button onClick={() => handleDelete(student.id, student.nombres_apellidos)} title="Eliminar" className="text-red-600 hover:text-red-800">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">
                    No se encontraron estudiantes que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
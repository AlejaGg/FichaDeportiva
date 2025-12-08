import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DeporteName, ResultadoCompetencia, RESULTADOS_COMPETENCIA, TipoSangreEnum, FichaMedicaInsert, TestFisicoInsert, RecordDeportivoInsert, CategoriaPruebaEnum, CATEGORIAS_PRUEBA } from '../types/database';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';

// Helper types for form state
type EstudianteState = {
  cedula: string; // La cédula no debe cambiar en modo edición
  nombres_apellidos: string;
  direccion: string;
  correo: string;
  carrera_id: number | '';
  facultad_id: number | '';
  fecha_nacimiento: string;
};

type FichaMedicaState = {
  tipo_sangre: TipoSangreEnum | '';
  patologias: string;
  ultima_consulta_medica: string;
};

type RecordDeportivoState = RecordDeportivoInsert & {
  id?: number; // Add id for existing records
};

type TestFisicoState = TestFisicoInsert & {
  id?: number; // Add id for existing tests
};

type Carrera = {
  id: number; // Corregido: el nombre de la propiedad era incorrecto
  nombre: string;
  facultad_id: number;
  facultad_nombre: string;
}

type Facultad = { id: number; nombre: string; }



// Helper component for form sections
const FormSection: React.FC<{ title: string; children: React.ReactNode, actionButton?: React.ReactNode }> = ({ title, children, actionButton }) => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        {actionButton}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );

const StudentForm: React.FC = () => {
  const { cedula } = useParams<{ cedula?: string }>();
  const isEditMode = !!cedula;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableSports, setAvailableSports] = useState<DeporteName[]>([]);
  const [availableFacultades, setAvailableFacultades] = useState<Facultad[]>([]);
  const [availableCarreras, setAvailableCarreras] = useState<Carrera[]>([]);
  const [availableCintas, setAvailableCintas] = useState<string[]>([]);
  
  // Unificar estado
  const [estudiante, setEstudiante] = useState<EstudianteState>({
    cedula: '',
    nombres_apellidos: '',
    direccion: '',
    correo: '',
    carrera_id: '',
    facultad_id: '',
    fecha_nacimiento: '',
  });
  const [selectedSport, setSelectedSport] = useState<DeporteName | ''>('');
  const [selectedCinta, setSelectedCinta] = useState<string>('');
  const [fichaMedica, setFichaMedica] = useState<FichaMedicaState>({
    tipo_sangre: 'A+',
    patologias: '',
    ultima_consulta_medica: '',
  });
  const [testsFisicos, setTestsFisicos] = useState<TestFisicoState[]>([]);
  const [records, setRecords] = useState<RecordDeportivoState[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null); // El tipo ya es correcto (string para UUID)
  const [testsToDelete, setTestsToDelete] = useState<number[]>([]);
  const [recordsToDelete, setRecordsToDelete] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Carreras filtradas basadas en la facultad seleccionada
  const filteredCarreras = availableCarreras.filter(c => c.facultad_id === estudiante.facultad_id);


  useEffect(() => {
    const fetchSports = async () => {
      const { data, error } = await supabase
        .from('deportes')
        .select('nombre');
      if (error) {
        console.error('Error fetching sports:', error);
      } else {
        const sportNames = data.map(d => d.nombre as DeporteName);
        setAvailableSports(sportNames);
        // No seleccionar por defecto para que el usuario elija explícitamente
      }
    };
    fetchSports();

    const fetchFacultadesAndCarreras = async () => {
        const { data: facultadesData, error: facultadesError } = await supabase.rpc('get_facultades');
        if (facultadesError) console.error('Error fetching facultades:', facultadesError);
        else setAvailableFacultades(facultadesData || []);

        const { data: carrerasData, error: carrerasError } = await supabase.rpc('get_carreras_con_facultad');
        if (carrerasError) console.error('Error fetching carreras:', carrerasError);
        else setAvailableCarreras(carrerasData || []);
    };

    const fetchCintas = async () => {
      const { data, error } = await supabase.from('cinta_tipos').select('color').order('id');
      if (error) {
        console.error('Error fetching cintas:', error);
      } else {
        setAvailableCintas(data.map(c => c.color));
      }
    };
    fetchCintas();
    fetchFacultadesAndCarreras();
  }, []);

  // useEffect separado para cargar datos del estudiante una vez que las carreras estén listas
  useEffect(() => {
    if (isEditMode && cedula && availableCarreras.length > 0) {
      const fetchStudentData = async () => {
        setLoading(true);
        const { data, error: clientError } = await supabase.rpc('get_student_full_details', { p_cedula: cedula });
        setLoading(false);

        if (clientError || (data && data.error)) {
          const errorMessage = clientError?.message || data?.error?.message || 'No se pudo cargar la información del estudiante o no existe.';
          alert(errorMessage);
          navigate('/');
          return;
        }
        
        if (data && data.data) {
            const studentData = data.data;
            const carrera = availableCarreras.find(c => c.id === studentData.estudiante.carrera_id);

            setStudentId(studentData.estudiante.id);
            setEstudiante({
              cedula: studentData.estudiante.cedula || '',
              nombres_apellidos: studentData.estudiante.nombres_apellidos || '',
              direccion: studentData.estudiante.direccion || '',
              correo: studentData.estudiante.correo || '',
              carrera_id: studentData.estudiante.carrera_id || '',
              facultad_id: carrera?.facultad_id || '',
              fecha_nacimiento: studentData.estudiante.fecha_nacimiento ? new Date(studentData.estudiante.fecha_nacimiento).toISOString().split('T')[0] : '',
            });
            setSelectedSport(studentData.deportes?.[0]?.deporte?.nombre || '');
            setSelectedCinta(studentData.deportes?.[0]?.cinta_tipo?.color || '');
            if (studentData.ficha_medica) {
              setFichaMedica({
                tipo_sangre: studentData.ficha_medica.tipo_sangre || 'A+',
                patologias: studentData.ficha_medica.patologias || '',
                ultima_consulta_medica: studentData.ficha_medica.ultima_consulta_medica ? new Date(studentData.ficha_medica.ultima_consulta_medica).toISOString().split('T')[0] : '',
              });
            }
            setTestsFisicos(studentData.tests_fisicos || []);
            setRecords(studentData.records_deportivos || []);
        }
      };
      fetchStudentData();
    }
  }, [isEditMode, cedula, availableCarreras, navigate]);


  const handleEstudianteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number = value;
    
    if (name === 'carrera_id' || name === 'facultad_id') {
      finalValue = value ? Number(value) : '';
    }

    setEstudiante({ ...estudiante, [name]: finalValue });
  };

  const handleFichaMedicaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFichaMedica({ ...fichaMedica, [e.target.name]: e.target.value as TipoSangreEnum | string });
  };
  
  const handleTestFisicoChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newTests = [...testsFisicos];
    newTests[index] = { ...newTests[index], [name]: value };
    setTestsFisicos(newTests);
  };

  const addTestFisico = () => {
    setTestsFisicos([...testsFisicos, {
      categoria: CATEGORIAS_PRUEBA[0], // CORREGIDO: Usar el valor del array ('Velocidad') en lugar de un string en minúscula.
      prueba: '',
      unidad: '',
      resultado: '',
    }]);
  };

  const removeTestFisico = (index: number) => {
    const testToRemove = testsFisicos[index];
    if (testToRemove.id) { // Si tiene ID, es un registro existente
      setTestsToDelete([...testsToDelete, testToRemove.id]);
    }
    const newTests = testsFisicos.filter((_, i) => i !== index);
    setTestsFisicos(newTests);
  };

  const handleRecordChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newRecords = [...records];
    const record = newRecords[index];
    
    if (name === 'puesto') {
      newRecords[index] = { ...record, [name]: value === '' ? '' : parseInt(value, 10) };
    } else if (name === 'resultado') {
      newRecords[index] = { ...record, [name]: value as ResultadoCompetencia };
    }
    else {
      newRecords[index] = { ...record, [name]: value };
    }
    setRecords(newRecords);
  };

  const addRecord = () => {
    setRecords([...records, {
      nombre_competencia: '',
      fecha_competencia: '',
      resultado: 'otro', // CORRECCIÓN: El ENUM en la DB espera valores en minúscula.
      puesto: 0,
    }]);
  };

  const removeRecord = (index: number) => {
    const recordToRemove = records[index];
    if (recordToRemove.id) { // Si tiene ID, es un registro existente
      setRecordsToDelete([...recordsToDelete, recordToRemove.id]);
    }
    const newRecords = records.filter((_, i) => i !== index);
    setRecords(newRecords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!estudiante.cedula && !isEditMode) {
      alert('La cédula es obligatoria.');
      return;
    }
    if (selectedSport === '') {
      alert('Debe seleccionar un deporte.');
      return;
    }
    setLoading(true);

    try {
      // Prepare data for RPC
      const fichaMedicaPayload: FichaMedicaInsert = {
        tipo_sangre: fichaMedica.tipo_sangre || undefined,
        patologias: fichaMedica.patologias || undefined,
        ultima_consulta_medica: fichaMedica.ultima_consulta_medica || undefined,
      };

      const recordsDeportivosPayload: RecordDeportivoInsert[] = records.map(record => ({
        nombre_competencia: record.nombre_competencia,
        fecha_competencia: record.fecha_competencia,
        resultado: record.resultado,
        puesto: record.puesto === '' ? undefined : record.puesto,
      }));

      let error;

      if (isEditMode) {
        // Lógica de actualización
        const result = await supabase.rpc('update_full_student', {
            p_student_id: studentId,
            p_nombres_apellidos: estudiante.nombres_apellidos,
            p_fecha_nacimiento: estudiante.fecha_nacimiento,
            p_direccion: estudiante.direccion,
            p_correo: estudiante.correo,
            p_carrera_id: estudiante.carrera_id === '' ? null : estudiante.carrera_id,
            p_deporte_nombre: selectedSport,
            p_cinta_color: selectedCinta,
            p_ficha_medica: fichaMedicaPayload,
            p_tests_fisicos_a_agregar: testsFisicos.filter(t => !t.id), // Solo los nuevos
            p_tests_fisicos_a_eliminar: testsToDelete,
            p_records_a_agregar: records.filter(r => !r.id), // Solo los nuevos
            p_records_a_eliminar: recordsToDelete,
        });
        error = result.error;
      } else {
        // Lógica de creación
        const result = await supabase.rpc('create_full_student', {
            p_cedula: estudiante.cedula,
            p_nombres_apellidos: estudiante.nombres_apellidos,
            p_fecha_nacimiento: estudiante.fecha_nacimiento,
            p_direccion: estudiante.direccion,
            p_correo: estudiante.correo,
            p_facultad_id: estudiante.facultad_id === '' ? null : estudiante.facultad_id,
            p_carrera_id: estudiante.carrera_id === '' ? null : estudiante.carrera_id,
            p_deporte_nombre: selectedSport,
            p_ficha_medica: fichaMedicaPayload,
            p_cinta_color: selectedCinta,
            p_tests_fisicos: testsFisicos,
            p_records_deportivos: recordsDeportivosPayload,
        });
        error = result.error;
      }

      if (error) {
        throw error;
      }

      alert(`¡Estudiante ${isEditMode ? 'actualizado' : 'registrado'} con éxito!`);
      navigate(`/students/${estudiante.cedula}`);

    } catch (error: any) {
      console.error('Error al registrar:', error);
      if (error.message.includes('duplicate key value violates unique constraint "estudiantes_cedula_key"')) {
        setError('Error: La cédula ingresada ya existe en la base de datos.');
      } else {
        setError(`Error al ${isEditMode ? 'actualizar' : 'registrar'} el estudiante: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Editar Estudiante' : 'Registrar Nuevo Estudiante'}</h1>

      {/* Deporte Section */}
      <FormSection title="1. Deporte">
        <Select
          label="Seleccione un Deporte"
          id="deporte"
          name="deporte"
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value as DeporteName)}
          required
        >
          <option value="" disabled>Seleccione...</option>
          {availableSports.map(sport => (
            <option key={sport} value={sport}>{sport}</option>
          ))}
        </Select>
        <Select
          label="Seleccione una Cinta"
          id="cinta"
          name="cinta"
          value={selectedCinta}
          onChange={(e) => setSelectedCinta(e.target.value)}
        >
          <option value="">Ninguna</option>
          {availableCintas.map(cinta => <option key={cinta} value={cinta}>{cinta}</option>)}
        </Select>
      </FormSection>

      {/* Datos Personales */}
      <FormSection title="2. Datos Personales">
        <Input label="Cédula" id="cedula" name="cedula" value={estudiante.cedula} onChange={handleEstudianteChange} required disabled={isEditMode} />
        <Input label="Nombres y Apellidos" id="nombres_apellidos" name="nombres_apellidos" value={estudiante.nombres_apellidos} onChange={handleEstudianteChange} required />
        <Input label="Dirección" id="direccion" name="direccion" value={estudiante.direccion} onChange={handleEstudianteChange} required />
        <Input label="Correo Electrónico" id="correo" name="correo" type="email" value={estudiante.correo} onChange={handleEstudianteChange} required />
        <Select label="Facultad" id="facultad_id" name="facultad_id" value={estudiante.facultad_id} onChange={handleEstudianteChange} required>
            <option value="" disabled>Seleccione...</option>
            {availableFacultades.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
        </Select>
        <Select label="Carrera" id="carrera_id" name="carrera_id" value={estudiante.carrera_id} onChange={handleEstudianteChange} required disabled={!estudiante.facultad_id}>
            <option value="" disabled>Seleccione una facultad primero...</option>
            {filteredCarreras.map(c => (
                    <option key={c.id} value={c.id}>
                        {c.nombre}
                    </option>
                ))
            }
        </Select>
        <Input label="Fecha de Nacimiento" id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={estudiante.fecha_nacimiento} onChange={handleEstudianteChange} required />
      </FormSection>

      {/* Ficha Médica */}
      <FormSection title="3. Ficha Médica">
        <Select label="Tipo de Sangre" id="tipo_sangre" name="tipo_sangre" value={fichaMedica.tipo_sangre} onChange={handleFichaMedicaChange}>
          {['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input label="Patologías (separadas por coma)" id="patologias" name="patologias" value={fichaMedica.patologias || ''} onChange={handleFichaMedicaChange} />
        <Input label="Última Consulta Médica" id="ultima_consulta_medica" name="ultima_consulta_medica" type="date" value={fichaMedica.ultima_consulta_medica || ''} onChange={handleFichaMedicaChange} />
      </FormSection>

      {/* Test Físicos */}
      <FormSection 
        title="4. Tests Físicos"
        actionButton={
            <Button type="button" onClick={addTestFisico} variant="secondary">
                + Añadir Test
            </Button>
        }
      >
        {testsFisicos.map((test, index) => (
          <div key={index} className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-md mb-4 relative">
             <Button type="button" onClick={() => removeTestFisico(index)} variant="danger" className="absolute -top-2 -right-2 w-8 h-8 rounded-full !p-0">X</Button>
            <Select label="Categoría" id={`cat-${index}`} name="categoria" value={test.categoria} onChange={e => handleTestFisicoChange(index, e)}>
              {CATEGORIAS_PRUEBA.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Prueba" id={`prueba-${index}`} name="prueba" value={test.prueba} onChange={e => handleTestFisicoChange(index, e)} />
            <Input label="Unidad" id={`unidad-${index}`} name="unidad" value={test.unidad} onChange={e => handleTestFisicoChange(index, e)} />
            <Input label="Resultado" id={`resultado-${index}`} name="resultado" value={test.resultado} onChange={e => handleTestFisicoChange(index, e)} />
          </div>
        ))}
        {testsFisicos.length === 0 && <p className="text-gray-500 md:col-span-2">No hay tests físicos. Añada uno si es necesario.</p>}
      </FormSection>


      {/* Record Deportivo */}
      <FormSection 
        title="5. Récord Deportivo"
        actionButton={
            <Button type="button" onClick={addRecord} variant="secondary">
                + Añadir Récord
            </Button>
        }
      >
        {records.map((record, index) => (
          <div key={index} className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-4 border p-4 rounded-md mb-4 relative">
            <Button type="button" onClick={() => removeRecord(index)} variant="danger" className="absolute -top-2 -right-2 w-8 h-8 rounded-full !p-0">X</Button>
            <Input label="Competencia" id={`comp-${index}`} name="nombre_competencia" value={record.nombre_competencia} onChange={e => handleRecordChange(index, e)} />
            <Input label="Fecha" id={`fecha-${index}`} name="fecha_competencia" type="date" value={record.fecha_competencia} onChange={e => handleRecordChange(index, e)} />
            <Input label="Puesto" id={`puesto-${index}`} name="puesto" type="number" value={record.puesto} onChange={e => handleRecordChange(index, e)} />
            <Select label="Resultado" id={`res-${index}`} name="resultado" value={record.resultado} onChange={e => handleRecordChange(index, e)}>
              {RESULTADOS_COMPETENCIA.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
            <div/>
          </div>
        ))}
         {records.length === 0 && <p className="text-gray-500 md:col-span-2">No hay récords deportivos. Añada uno si es necesario.</p>}
    </FormSection>
      
      {/* Submit Button */}
      <div className="mt-8 text-right">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Estudiante' : 'Registrar Estudiante')}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;

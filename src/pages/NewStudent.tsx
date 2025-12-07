import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DeporteName, ResultadoCompetencia, RESULTADOS_COMPETENCIA, TipoSangreEnum, FichaMedicaInsert, TestFisicoInsert, RecordDeportivoInsert, CategoriaPruebaEnum, CATEGORIAS_PRUEBA } from '../types/database';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { useNavigate, Navigate } from 'react-router-dom';

// Combined form state type
type FormState = {
  estudiante: {
    cedula: string;
    nombres_apellidos: string;
    direccion: string;
    correo: string;
    carrera: string;
    facultad: string;
    fecha_nacimiento: string;
  };
  fichaMedica: {
    tipo_sangre: TipoSangreEnum | '';
    patologias: string;
    ultima_consulta_medica: string;
  };
  testsFisicos: TestFisicoInsert[];
  records: Array<{
  nombre_competencia: string;
  fecha_competencia: string;
  resultado: ResultadoCompetencia;
  puesto: number | '';
}>;
};

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

const NewStudent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSports, setAvailableSports] = useState<DeporteName[]>([]);
  const [selectedSport, setSelectedSport] = useState<DeporteName | ''>('');

  const [formState, setFormState] = useState<FormState>({
    estudiante: {
      cedula: '',
      nombres_apellidos: '',
      direccion: '',
      correo: '',
      carrera: '',
      facultad: '',
      fecha_nacimiento: '',
    },
    fichaMedica: { tipo_sangre: '', patologias: '', ultima_consulta_medica: '' },
    testsFisicos: [],
    records: [],
  });

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
        if (sportNames.length > 0) {
          setSelectedSport(sportNames[0]); // Select first sport by default
        }
      }
    };
    fetchSports();
  }, []);

  const handleInputChange = <T extends keyof FormState>(section: T, name: keyof FormState[T], value: any) => {
    setFormState(prevState => ({
      ...prevState,
      [section]: {
        ...prevState[section],
        [name]: value,
      },
    }));
  };

  const handleTestFisicoChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newTests = [...formState.testsFisicos];
    newTests[index] = { ...newTests[index], [name]: value };
    setFormState(prevState => ({ ...prevState, testsFisicos: newTests }));
  };

  const addTestFisico = () => {
    const newTest: TestFisicoInsert = {
      categoria: CATEGORIAS_PRUEBA[0],
      prueba: '',
      unidad: '',
      resultado: '',
    };
    setFormState(prevState => ({ ...prevState, testsFisicos: [...prevState.testsFisicos, newTest] }));
  };

  const removeTestFisico = (index: number) => {
    const newTests = formState.testsFisicos.filter((_, i) => i !== index);
    setFormState(prevState => ({ ...prevState, testsFisicos: newTests }));
  };

  const handleRecordChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newRecords = [...formState.records];
    const record = newRecords[index];
    
    if (name === 'puesto') {
      newRecords[index] = { ...record, [name]: value === '' ? '' : parseInt(value, 10) };
    } else if (name === 'resultado') {
      newRecords[index] = { ...record, [name]: value as ResultadoCompetencia };
    } else {
      newRecords[index] = { ...record, [name]: value };
    }
    setFormState(prevState => ({ ...prevState, records: newRecords }));
  };

  const addRecord = () => {
    const newRecord = {
      nombre_competencia: '',
      fecha_competencia: '',
      resultado: RESULTADOS_COMPETENCIA[0],
      puesto: '',
    };
    setFormState(prevState => ({ ...prevState, records: [...prevState.records, newRecord] }));
  };

  const removeRecord = (index: number) => {
    const newRecords = formState.records.filter((_, i) => i !== index);
    setFormState(prevState => ({ ...prevState, records: newRecords }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formState.estudiante.cedula) {
      setError('La cédula es obligatoria.');
      return;
    }
    if (selectedSport === '') {
      alert('Debe seleccionar un deporte.');
      return;
    }
    setLoading(true);

    const { estudiante, fichaMedica, testsFisicos, records } = formState;

    try {
      // Prepare data for RPC
      const fichaMedicaPayload: FichaMedicaInsert = {
        tipo_sangre: fichaMedica.tipo_sangre ? fichaMedica.tipo_sangre : undefined,
        patologias: fichaMedica.patologias ? fichaMedica.patologias : undefined,
        ultima_consulta_medica: fichaMedica.ultima_consulta_medica ? fichaMedica.ultima_consulta_medica : undefined,
      };

      const recordsDeportivosPayload: RecordDeportivoInsert[] = records.map(record => ({
        ...record,
        fecha_competencia: record.fecha_competencia,
        resultado: record.resultado,
        puesto: record.puesto === '' ? undefined : record.puesto,
      }));

      const { error } = await supabase.rpc('create_full_student', {
        p_cedula: estudiante.cedula,
        p_nombres_apellidos: estudiante.nombres_apellidos,
        p_fecha_nacimiento: estudiante.fecha_nacimiento,
        p_direccion: estudiante.direccion,
        p_correo: estudiante.correo,
        p_carrera: estudiante.carrera,
        p_facultad: estudiante.facultad,
        p_deporte_nombre: selectedSport,
        p_ficha_medica: fichaMedicaPayload,
        p_tests_fisicos: testsFisicos,
        p_records_deportivos: recordsDeportivosPayload,
      });

      if (error) {
        throw error;
      }

      alert('¡Estudiante registrado con éxito!');
      navigate(`/student/${formState.estudiante.cedula}`);

    } catch (error: any) {
      console.error('Error al registrar:', error);
      if (error.message.includes('duplicate key value violates unique constraint "estudiantes_cedula_key"')) {
        setError('Error: La cédula ingresada ya existe en la base de datos.');
      } else {
        alert(`Error al registrar el estudiante: ${error.message}`);
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
      <h1 className="text-3xl font-bold mb-6">Registrar Nuevo Estudiante</h1>

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
      </FormSection>

      {/* Datos Personales */}
      <FormSection title="2. Datos Personales">
        <Input label="Cédula" id="cedula" name="cedula" value={formState.estudiante.cedula} onChange={e => handleInputChange('estudiante', 'cedula', e.target.value)} required />
        <Input label="Nombres y Apellidos" id="nombres_apellidos" name="nombres_apellidos" value={formState.estudiante.nombres_apellidos} onChange={e => handleInputChange('estudiante', 'nombres_apellidos', e.target.value)} required />
        <Input label="Dirección" id="direccion" name="direccion" value={formState.estudiante.direccion} onChange={e => handleInputChange('estudiante', 'direccion', e.target.value)} required />
        <Input label="Correo Electrónico" id="correo" name="correo" type="email" value={formState.estudiante.correo} onChange={e => handleInputChange('estudiante', 'correo', e.target.value)} required />
        <Input label="Carrera" id="carrera" name="carrera" value={formState.estudiante.carrera} onChange={e => handleInputChange('estudiante', 'carrera', e.target.value)} required />
        <Input label="Facultad" id="facultad" name="facultad" value={formState.estudiante.facultad} onChange={e => handleInputChange('estudiante', 'facultad', e.target.value)} required />
        <Input label="Fecha de Nacimiento" id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={formState.estudiante.fecha_nacimiento} onChange={e => handleInputChange('estudiante', 'fecha_nacimiento', e.target.value)} required />
      </FormSection>

      {/* Ficha Médica */}
      <FormSection title="3. Ficha Médica">
        <Select label="Tipo de Sangre" id="tipo_sangre" name="tipo_sangre" value={formState.fichaMedica.tipo_sangre} onChange={e => handleInputChange('fichaMedica', 'tipo_sangre', e.target.value)}>
          {['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input label="Patologías (separadas por coma)" id="patologias" name="patologias" value={formState.fichaMedica.patologias || ''} onChange={e => handleInputChange('fichaMedica', 'patologias', e.target.value)} />
        <Input label="Última Consulta Médica" id="ultima_consulta_medica" name="ultima_consulta_medica" type="date" value={formState.fichaMedica.ultima_consulta_medica || ''} onChange={e => handleInputChange('fichaMedica', 'ultima_consulta_medica', e.target.value)} />
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
        {formState.testsFisicos.map((test, index) => (
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
        {formState.testsFisicos.length === 0 && <p className="text-gray-500 md:col-span-2">No hay tests físicos. Añada uno si es necesario.</p>}
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
        {formState.records.map((record, index) => (
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
         {formState.records.length === 0 && <p className="text-gray-500 md:col-span-2">No hay récords deportivos. Añada uno si es necesario.</p>}
    </FormSection>
      
      {/* Submit Button */}
      <div className="mt-8 text-right">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar Estudiante'}
        </Button>
      </div>
    </form>
  );
};

export default NewStudent;

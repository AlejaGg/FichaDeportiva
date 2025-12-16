import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DeporteName, ResultadoCompetencia, RESULTADOS_COMPETENCIA, TipoSangreEnum, FichaMedicaInsert, TestFisicoInsert, RecordDeportivoInsert, CATEGORIAS_PRUEBA } from '../types/database';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
// Importamos iconos para mejorar la estética visual
import { 
  User, 
  Activity, 
  Medal, 
  HeartPulse, 
  ArrowLeft, 
  Dumbbell, 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// --- TIPOS (Lógica Original Intacta) ---
type EstudianteState = {
  cedula: string;
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

type RecordDeportivoState = RecordDeportivoInsert & { id?: number; };
type TestFisicoState = TestFisicoInsert & { id?: number; };
type Carrera = { id: number; nombre: string; facultad_id: number; facultad_nombre: string; }
type Facultad = { id: number; nombre: string; }

// --- NUEVO COMPONENTE DE SECCIÓN (SOLO DISEÑO) ---
const FormSection: React.FC<{ 
  title: string; 
  subtitle?: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  actionButton?: React.ReactNode 
}> = ({ title, subtitle, icon, children, actionButton }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-100 group">
    <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actionButton && (
        <div className="shrink-0 self-end sm:self-auto">
          {actionButton}
        </div>
      )}
    </div>
    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      {children}
    </div>
  </div>
);

const StudentForm: React.FC = () => {
  // --- LÓGICA (NO SE HA TOCADO NADA AQUÍ) ---
  const { cedula } = useParams<{ cedula?: string }>();
  const isEditMode = !!cedula;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableSports, setAvailableSports] = useState<DeporteName[]>([]);
  const [availableFacultades, setAvailableFacultades] = useState<Facultad[]>([]);
  const [availableCarreras, setAvailableCarreras] = useState<Carrera[]>([]);
  const [availableCintas, setAvailableCintas] = useState<string[]>([]);
  
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
  const [initialTests, setInitialTests] = useState<TestFisicoState[]>([]);
  const [initialRecords, setInitialRecords] = useState<RecordDeportivoState[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [testsToDelete, setTestsToDelete] = useState<number[]>([]);
  const [recordsToDelete, setRecordsToDelete] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredCarreras = availableCarreras.filter(c => c.facultad_id === estudiante.facultad_id);

  useEffect(() => {
    const fetchSports = async () => {
      const { data, error } = await supabase.from('deportes').select('nombre');
      if (error) console.error('Error fetching sports:', error);
      else setAvailableSports(data.map(d => d.nombre as DeporteName));
    };
    fetchSports();

    const fetchFacultadesAndCarreras = async () => {
        const { data: facultadesData, error: facultadesError } = await supabase.rpc('get_facultades');
        if (facultadesError) console.error('Error fetching facultades:', facultadesError);
        else setAvailableFacultades((facultadesData as unknown as Facultad[]) || []);

        const { data: carrerasData, error: carrerasError } = await supabase.rpc('get_carreras_con_facultad');
        if (carrerasError) console.error('Error fetching carreras:', carrerasError);
        else setAvailableCarreras((carrerasData as unknown as Carrera[]) || []);
    };

    const fetchCintas = async () => {
      const { data, error } = await supabase.from('cinta_tipos').select('color').order('id');
      if (error) console.error('Error fetching cintas:', error);
      else setAvailableCintas((data || []).map((c: any) => c.color));
    };
    fetchCintas();
    fetchFacultadesAndCarreras();
  }, []);

  useEffect(() => {
    if (isEditMode && cedula && availableCarreras.length > 0) {
      const fetchStudentData = async () => {
        setLoading(true);
        const { data, error: clientError } = await supabase.rpc('get_student_full_details', { p_cedula: cedula });
        setLoading(false);

        if (clientError) {
          alert(clientError?.message || 'Error al cargar estudiante.');
          navigate('/students'); // UX: Regresar a lista si falla
          return;
        }
        
        if (data) {
            const response: any = data;
            // La función RPC retorna {data: {...}, error: {...}}
            if (response?.error) {
              alert(response.error.message || 'Error al cargar estudiante.');
              navigate('/students');
              return;
            }
            
            const studentData: any = response?.data;
            if (!studentData) {
              alert('No se encontraron datos del estudiante.');
              navigate('/students');
              return;
            }
            
            const carreraId = studentData.estudiante?.carrera_id || null;
            const carrera = carreraId ? availableCarreras.find(c => c.id === carreraId) : null;

            setStudentId(studentData.estudiante.id);
            setEstudiante({
              cedula: studentData.estudiante.cedula || '',
              nombres_apellidos: studentData.estudiante.nombres_apellidos || '',
              direccion: studentData.estudiante.direccion || '',
              correo: studentData.estudiante.correo || '',
              carrera_id: carreraId || '',
              facultad_id: carrera?.facultad_id || '',
              fecha_nacimiento: studentData.estudiante.fecha_nacimiento ? new Date(studentData.estudiante.fecha_nacimiento).toISOString().split('T')[0] : '',
            });
            // Los deportes vienen como array de objetos con deporte.nombre
            setSelectedSport((studentData.deportes && studentData.deportes[0]?.deporte?.nombre) || '');
            setSelectedCinta((studentData.deportes && studentData.deportes[0]?.cinta_tipo?.color) || '');
            if (studentData.ficha_medica) {
              setFichaMedica({
                tipo_sangre: studentData.ficha_medica.tipo_sangre || 'A+',
                patologias: studentData.ficha_medica.patologias || '',
                ultima_consulta_medica: studentData.ficha_medica.ultima_consulta_medica ? new Date(studentData.ficha_medica.ultima_consulta_medica).toISOString().split('T')[0] : '',
              });
            }
            setTestsFisicos(studentData.tests_fisicos || []);
            setInitialTests(studentData.tests_fisicos || []);
            setRecords(studentData.records_deportivos || []);
            setInitialRecords(studentData.records_deportivos || []);
        }
      };
      fetchStudentData();
    }
  }, [isEditMode, cedula, availableCarreras, navigate]);


  const handleEstudianteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number = value;
    if (name === 'carrera_id' || name === 'facultad_id') finalValue = value ? Number(value) : '';
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
    setTestsFisicos([...testsFisicos, { categoria: CATEGORIAS_PRUEBA[0], prueba: '', unidad: '', resultado: '' }]);
  };

  const removeTestFisico = (index: number) => {
    const testToRemove = testsFisicos[index];
    if (testToRemove.id) setTestsToDelete([...testsToDelete, testToRemove.id]);
    setTestsFisicos(testsFisicos.filter((_, i) => i !== index));
  };

  const handleRecordChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newRecords = [...records];
    const record = newRecords[index];
    if (name === 'puesto') newRecords[index] = { ...record, [name]: value === '' ? '' : parseInt(value, 10) };
    else if (name === 'resultado') newRecords[index] = { ...record, [name]: value as ResultadoCompetencia };
    else newRecords[index] = { ...record, [name]: value };
    setRecords(newRecords);
  };

  const addRecord = () => {
    setRecords([...records, { nombre_competencia: '', fecha_competencia: '', resultado: 'OTRO', puesto: 0 }]);
  };

  const removeRecord = (index: number) => {
    const recordToRemove = records[index];
    if (recordToRemove.id) setRecordsToDelete([...recordsToDelete, recordToRemove.id]);
    setRecords(records.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!estudiante.cedula && !isEditMode) {
      toast.error('La cédula es obligatoria para un nuevo registro.');
      return;
    }
    if (selectedSport === '') {
      toast.error('Debe seleccionar un deporte.');
      return;
    }
    
    setLoading(true);
    try {
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

      const testsToUpdate = testsFisicos.filter(current => {
        if (!current.id) return false;
        const original = initialTests.find(t => t.id === current.id);
        return original && JSON.stringify(current) !== JSON.stringify(original);
      });

      const recordsToUpdate = records.filter(current => {
        if (!current.id) return false;
        const original = initialRecords.find(r => r.id === current.id);
        return original && JSON.stringify(current) !== JSON.stringify(original);
      });

      let error;

      if (isEditMode) {
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
            p_tests_fisicos_a_agregar: testsFisicos.filter(t => !t.id),
            p_tests_fisicos_a_actualizar: testsToUpdate,
            p_tests_fisicos_a_eliminar: testsToDelete,
            p_records_a_agregar: records.filter(r => !r.id),
            p_records_a_actualizar: recordsToUpdate,
            p_records_a_eliminar: recordsToDelete
        });
        error = result.error;
      } else {
        const result = await supabase.rpc('create_full_student', {
            p_cedula: estudiante.cedula,
            p_nombres_apellidos: estudiante.nombres_apellidos,
            p_fecha_nacimiento: estudiante.fecha_nacimiento,
            p_direccion: estudiante.direccion,
            p_correo: estudiante.correo,
            p_carrera_id: estudiante.carrera_id === '' ? null : estudiante.carrera_id,
            p_facultad_id: estudiante.facultad_id === '' ? null : estudiante.facultad_id,
            p_deporte_nombre: selectedSport,
            p_cinta_color: selectedCinta,
            p_ficha_medica: fichaMedicaPayload,
            p_tests_fisicos: testsFisicos,
            p_records_deportivos: recordsDeportivosPayload,
        });
        error = result.error;
      }

      if (error) throw error;
      toast.success(`¡Estudiante ${isEditMode ? 'actualizado' : 'registrado'} con éxito!`);
      navigate(`/students/${estudiante.cedula}`);

    } catch (error: any) {
      console.error('Error al registrar:', error);
      if (error.message.includes('duplicate key value violates unique constraint "estudiantes_cedula_key"')) {
        setError('Error: La cédula ingresada ya existe.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO (DISEÑO MEJORADO) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-24">
      
      {/* 1. Header Sticky con Navegación */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/students')} 
                    className="p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all group"
                    title="Regresar a la lista"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                        {isEditMode ? 'Editar Expediente' : 'Nuevo Registro'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium hidden sm:block">
                        Sistema de Gestión Deportiva
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <button 
                    type="button"
                    onClick={() => navigate('/students')}
                    className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                 >
                    Cancelar
                 </button>
                 <Button 
                    type="submit" 
                    form="student-form" // Conecta este botón externo al formulario
                    disabled={loading}
                    className="px-5 py-2 text-sm shadow-md hover:shadow-lg shadow-indigo-500/20"
                 >
                     {loading ? 'Guardando...' : 'Guardar'}
                 </Button>
            </div>
        </div>
      </header>

      {/* 2. Contenedor Principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <form id="student-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Mensaje de Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold block">Error al procesar la solicitud</span>
                    <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* SECCIÓN 1: DATOS PERSONALES */}
            <FormSection 
              title="Información Personal" 
              subtitle="Datos básicos del estudiante" 
              icon={<User className="w-5 h-5" />}
            >
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Cédula de Identidad" id="cedula" name="cedula" value={estudiante.cedula} onChange={handleEstudianteChange} required disabled={isEditMode} placeholder="Ingrese número de cédula" />
                    <Input label="Fecha de Nacimiento" id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={estudiante.fecha_nacimiento} onChange={handleEstudianteChange} required />
                </div>
                
                <div className="md:col-span-2">
                     <Input label="Nombres Completos" id="nombres_apellidos" name="nombres_apellidos" value={estudiante.nombres_apellidos} onChange={handleEstudianteChange} required placeholder="Ej: Juan Sebastián Pérez..." />
                </div>
                
                <Input label="Correo Institucional" id="correo" name="correo" type="email" value={estudiante.correo} onChange={handleEstudianteChange} required placeholder="@unach.edu.ec" />
                <Input label="Dirección Domiciliaria" id="direccion" name="direccion" value={estudiante.direccion} onChange={handleEstudianteChange} required />
                
                <Select label="Facultad" id="facultad_id" name="facultad_id" value={estudiante.facultad_id} onChange={handleEstudianteChange} required>
                    <option value="" disabled>Seleccione Facultad...</option>
                    {availableFacultades.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </Select>
                
                <Select label="Carrera" id="carrera_id" name="carrera_id" value={estudiante.carrera_id} onChange={handleEstudianteChange} required disabled={!estudiante.facultad_id}>
                    <option value="" disabled>Seleccione Carrera...</option>
                    {filteredCarreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
            </FormSection>

            {/* Layout Grid para Deportes y Salud */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECCIÓN 2: DEPORTE */}
                <FormSection 
                    title="Disciplina Deportiva" 
                    subtitle="Actividad principal" 
                    icon={<Dumbbell className="w-5 h-5" />}
                >
                    <div className="md:col-span-2 space-y-6">
                        <Select
                            label="Deporte Seleccionado"
                            id="deporte"
                            name="deporte"
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value as DeporteName)}
                            required
                            >
                            <option value="" disabled>Seleccione...</option>
                            {availableSports.map(sport => <option key={sport} value={sport}>{sport}</option>)}
                        </Select>
                        <Select
                            label="Grado / Cinta (Opcional)"
                            id="cinta"
                            name="cinta"
                            value={selectedCinta}
                            onChange={(e) => setSelectedCinta(e.target.value)}
                            >
                            <option value="">Ninguna</option>
                            {availableCintas.map(cinta => <option key={cinta} value={cinta}>{cinta}</option>)}
                        </Select>
                    </div>
                </FormSection>

                {/* SECCIÓN 3: SALUD */}
                <FormSection 
                    title="Ficha Médica" 
                    subtitle="Información de salud" 
                    icon={<HeartPulse className="w-5 h-5" />}
                >
                     <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Tipo de Sangre" id="tipo_sangre" name="tipo_sangre" value={fichaMedica.tipo_sangre} onChange={handleFichaMedicaChange}>
                            {['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                            </Select>
                            <Input label="Última Consulta" id="ultima_consulta_medica" name="ultima_consulta_medica" type="date" value={fichaMedica.ultima_consulta_medica || ''} onChange={handleFichaMedicaChange} />
                        </div>
                        <Input label="Patologías / Alergias" id="patologias" name="patologias" value={fichaMedica.patologias || ''} onChange={handleFichaMedicaChange} placeholder="Describa alergias o condiciones..." />
                     </div>
                </FormSection>
            </div>

            {/* SECCIÓN 4: TESTS FÍSICOS */}
            <FormSection 
              title="Evaluación Física" 
              subtitle="Tests de rendimiento y mediciones" 
              icon={<FileText className="w-5 h-5" />}
              actionButton={
                <button type="button" onClick={addTestFisico} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium border border-indigo-200 shadow-sm">
                  <Plus className="w-4 h-4" /> Añadir Test
                </button>
              }
            >
              {testsFisicos.length === 0 ? (
                <div className="md:col-span-2 py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">No se han registrado tests físicos.</p>
                </div>
              ) : (
                testsFisicos.map((test, index) => (
                  <div key={index} className="col-span-1 md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 relative hover:border-indigo-300 hover:shadow-md transition-all group shadow-sm">
                    <button type="button" onClick={() => removeTestFisico(index)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <Select label="Categoría" id={`cat-${index}`} name="categoria" value={test.categoria} onChange={e => handleTestFisicoChange(index, e)}>
                           {CATEGORIAS_PRUEBA.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <Input label="Prueba" id={`prueba-${index}`} name="prueba" value={test.prueba} onChange={e => handleTestFisicoChange(index, e)} placeholder="Ej: Flexiones" />
                        <Input label="Unidad" id={`unidad-${index}`} name="unidad" value={test.unidad} onChange={e => handleTestFisicoChange(index, e)} placeholder="Ej: Repeticiones" />
                        <Input label="Resultado" id={`resultado-${index}`} name="resultado" value={test.resultado} onChange={e => handleTestFisicoChange(index, e)} placeholder="Valor" />
                    </div>
                  </div>
                ))
              )}
            </FormSection>

            {/* SECCIÓN 5: RÉCORDS */}
            <FormSection 
              title="Historial Competitivo" 
              subtitle="Logros y participaciones destacadas" 
              icon={<Medal className="w-5 h-5" />}
              actionButton={
                <button type="button" onClick={addRecord} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium border border-indigo-200 shadow-sm">
                  <Plus className="w-4 h-4" /> Añadir Récord
                </button>
              }
            >
              {records.length === 0 ? (
                <div className="md:col-span-2 py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Medal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">No hay competencias registradas.</p>
                </div>
              ) : (
                records.map((record, index) => (
                  <div key={index} className="col-span-1 md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 relative hover:border-indigo-300 hover:shadow-md transition-all group shadow-sm">
                    <button type="button" onClick={() => removeRecord(index)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                        <div className="md:col-span-4">
                            <Input label="Nombre Competencia" id={`comp-${index}`} name="nombre_competencia" value={record.nombre_competencia} onChange={e => handleRecordChange(index, e)} placeholder="Ej: Campeonato Nacional" />
                        </div>
                        <div className="md:col-span-3">
                            <Input label="Fecha" id={`fecha-${index}`} name="fecha_competencia" type="date" value={record.fecha_competencia} onChange={e => handleRecordChange(index, e)} />
                        </div>
                        <div className="md:col-span-2">
                            <Input label="Puesto" id={`puesto-${index}`} name="puesto" type="number" value={record.puesto} onChange={e => handleRecordChange(index, e)} placeholder="#" />
                        </div>
                        <div className="md:col-span-3">
                            <Select label="Resultado Final" id={`res-${index}`} name="resultado" value={record.resultado} onChange={e => handleRecordChange(index, e)}>
                            {RESULTADOS_COMPETENCIA.map(r => <option key={r} value={r}>{r}</option>)}
                            </Select>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </FormSection>

            {/* BOTÓN FINAL DE PÁGINA */}
            <div className="pt-8 flex justify-end items-center gap-4 border-t border-slate-200 mt-8">
                <button 
                    type="button" 
                    onClick={() => navigate('/students')}
                    className="px-6 py-3 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium shadow-sm"
                >
                    Cancelar
                </button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    'Guardando...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {isEditMode ? 'Guardar Cambios' : 'Registrar Estudiante'}
                    </>
                  )}
                </Button>
            </div>

        </form>
      </main>
    </div>
  );
};

export default StudentForm;
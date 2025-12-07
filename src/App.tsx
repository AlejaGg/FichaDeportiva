import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import StudentList from './pages/StudentList'; // Asumo que tienes esta página
import StudentForm from './pages/StudentForm'; // Asumo que tienes el formulario de registro/edición
import StudentDetail from './pages/StudentDetail'; // La página de detalles que creamos

function App() {
  return (      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md p-4 mb-8">
          <Link to="/" className="text-xl font-bold text-blue-800 hover:text-blue-600">
            Ficha Deportiva ESPOCH
          </Link>
        </nav>
        <main className="container mx-auto px-4">
          <Routes>
            {/* Ruta principal */}
            <Route path="/" element={<Home />} />
            
            {/* Ruta para ver la lista de todos los estudiantes */}
            <Route path="/students" element={<StudentList />} />
            
            {/* Ruta para el formulario de un nuevo estudiante */}
            <Route path="/students/new" element={<StudentForm />} />

            {/* Ruta DINÁMICA para ver los detalles de UN estudiante específico. ¡Esta es la que necesitamos! */}
            <Route path="/students/:cedula" element={<StudentDetail />} />

            {/* Ruta DINÁMICA para EDITAR un estudiante. Reutiliza el mismo formulario. */}
            <Route path="/students/edit/:cedula" element={<StudentForm />} />
          </Routes>
        </main>
      </div>    
  );
}

export default App;
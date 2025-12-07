import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import NewStudent from './pages/NewStudent';
import StudentDetails from './pages/StudentDetails';
import StudentList from './pages/StudentList';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow">
        <nav className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-semibold text-gray-700">Ficha Deportiva ESPOCH</Link>
            <div className="flex space-x-4">
              <Link to="/" className="py-2 px-3 text-gray-600 hover:text-gray-900">Inicio</Link>
              <Link to="/new-student" className="py-2 px-3 text-gray-600 hover:text-gray-900">Registrar Estudiante</Link>
              <Link to="/students" className="py-2 px-3 text-gray-600 hover:text-gray-900">Lista de Estudiantes</Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new-student" element={<NewStudent />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/student/:cedula" element={<StudentDetails />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

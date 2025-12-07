# Ficha Deportiva ESPOCH

Este proyecto es un sistema para registrar y consultar información médica, física y deportiva de estudiantes de artes marciales de la ESPOCH.

## Configuración

### 1. Clonar el repositorio

```bash
git clone <URL-DEL-REPOSITORIO>
cd ficha-deportiva-frontend
```

### 2. Instalar dependencias

Asegúrate de tener [Node.js](https://nodejs.org/) instalado. Luego, instala las dependencias del proyecto:

```bash
npm install
```

### 3. Configurar las variables de entorno de Supabase

Crea un archivo `.env` en la raíz del proyecto y agrega las siguientes variables de entorno con tus credenciales de Supabase:

```
VITE_SUPABASE_URL="https://xunuqwuhsbprhydodgil.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1bnVxd3Voc2Jwcmh5ZG9kZ2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjA1MjYsImV4cCI6MjA4MDI5NjUyNn0.ldvGApVJCZjDqFPseWQ-utCbdJMZyyoA3-zqNg4EZtM"
```

**Importante:**
- El archivo `.env` ya está incluido en `.gitignore` para evitar que las claves se suban a un repositorio público.
- La `VITE_SUPABASE_ANON_KEY` es segura para ser usada en el frontend si tienes habilitado Row Level Security (RLS) en tus tablas.

### 4. Configurar la Base de Datos en Supabase

Usa los archivos `schema.sql` y `functions.sql` proporcionados en el repositorio para configurar tu base de datos en el editor de SQL de Supabase.

1.  Ve a tu proyecto de Supabase.
2.  En el menú lateral, ve a `SQL Editor`.
3.  Copia y pega el contenido de `schema.sql` y ejecútalo para crear las tablas y relaciones.
4.  Copia y pega el contenido de `functions.sql` y ejecútalo para crear las funciones RPC.

## Cómo iniciar el proyecto

Una vez completada la configuración, puedes iniciar la aplicación en modo de desarrollo:

```bash
npm run dev
```

Esto iniciará un servidor de desarrollo local. Abre tu navegador y visita `http://localhost:5173` (o la URL que indique la consola) para ver la aplicación.

## Flujo de uso

### Registro de un nuevo estudiante

1.  Ve a la página de "Nuevo Estudiante".
2.  Selecciona el deporte principal.
3.  Completa los datos personales, la ficha médica y los tests físicos.
4.  Agrega uno o más récords deportivos si es necesario.
5.  Guarda la ficha.

### Consultar y filtrar estudiantes

1.  Ve a la página "Lista de Estudiantes".
2.  Usa los filtros para buscar por deporte, facultad, carrera o rango de edad.
3.  También puedes buscar a un estudiante por su cédula en la página principal.

### Ver e imprimir la ficha

1.  Desde la lista de estudiantes o la búsqueda por cédula, haz clic en un estudiante para ver su detalle.
2.  En la página de detalles, haz clic en el botón "Imprimir Ficha" para generar una vista optimizada para impresión.

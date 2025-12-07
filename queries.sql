-- ####################################################################
-- # EJEMPLOS DE CONSULTAS SQL PARA FILTRADO DE ESTUDIANTES
-- ####################################################################

-- 1. Listar estudiantes filtrando por DEPORTE
--    (Ejemplo: Estudiantes que practican 'Taekwondo')
SELECT
    e.cedula,
    e.nombres_apellidos,
    e.carrera,
    e.facultad,
    v.edad,
    array_agg(d.nombre) AS deportes_que_practica
FROM
    public.estudiantes e
JOIN
    public.v_estudiantes_con_edad v ON e.id = v.id
JOIN
    public.estudiante_deportes ed ON e.id = ed.estudiante_id
JOIN
    public.deportes d ON ed.deporte_id = d.id
WHERE
    d.nombre = 'Taekwondo' -- Cambiar 'Taekwondo' por el deporte deseado
GROUP BY
    e.cedula, e.nombres_apellidos, e.carrera, e.facultad, v.edad;


-- 2. Listar estudiantes filtrando por FACULTAD y CARRERA
--    (Ejemplo: Estudiantes de la facultad 'FIE' y carrera 'Sistemas')
SELECT
    e.cedula,
    e.nombres_apellidos,
    e.carrera,
    e.facultad,
    v.edad
FROM
    public.estudiantes e
JOIN
    public.v_estudiantes_con_edad v ON e.id = v.id
WHERE
    e.facultad = 'FIE' -- Cambiar 'FIE' por la facultad deseada
    AND e.carrera = 'Sistemas'; -- Cambiar 'Sistemas' por la carrera deseada


-- 3. Listar estudiantes filtrando por RANGO DE EDAD
--    (Ejemplo: Estudiantes entre 18 y 25 años)
SELECT
    e.cedula,
    e.nombres_apellidos,
    e.carrera,
    e.facultad,
    v.edad
FROM
    public.estudiantes e
JOIN
    public.v_estudiantes_con_edad v ON e.id = v.id
WHERE
    v.edad >= 18 AND v.edad <= 25; -- Cambiar el rango de edad según sea necesario


-- 4. Listar estudiantes filtrando por si tienen o no RECORD DEPORTIVO registrado
--    (Ejemplo: Estudiantes CON records deportivos)
SELECT
    e.cedula,
    e.nombres_apellidos,
    e.carrera,
    e.facultad,
    v.edad
FROM
    public.estudiantes e
JOIN
    public.v_estudiantes_con_edad v ON e.id = v.id
WHERE
    EXISTS (SELECT 1 FROM public.records_deportivos rd WHERE rd.estudiante_id = e.id);

--    (Ejemplo: Estudiantes SIN records deportivos)
SELECT
    e.cedula,
    e.nombres_apellidos,
    e.carrera,
    e.facultad,
    v.edad
FROM
    public.estudiantes e
JOIN
    public.v_estudiantes_con_edad v ON e.id = v.id
WHERE
    NOT EXISTS (SELECT 1 FROM public.records_deportivos rd WHERE rd.estudiante_id = e.id);

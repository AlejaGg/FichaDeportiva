-- ####################################################################
-- # 5. FUNCIÓN RPC PARA CREACIÓN TRANSACCIONAL DE ESTUDIANTE
-- ####################################################################
-- Esta función maneja la creación de un estudiante y todos sus datos
-- relacionados dentro de una única transacción para garantizar la consistencia.

CREATE OR REPLACE FUNCTION create_full_student(
    p_cedula VARCHAR(10),
    p_nombres_apellidos TEXT,
    p_fecha_nacimiento DATE,
    p_direccion TEXT,
    p_correo TEXT,
    p_carrera_id BIGINT,
    p_deporte_nombre TEXT,
    p_cinta_color TEXT,
    p_ficha_medica JSONB,
    p_tests_fisicos JSONB, -- Renombrado para mayor claridad
    p_records_deportivos JSONB
)
RETURNS UUID AS $
DECLARE
    new_student_id UUID;
    selected_deporte_id BIGINT;
    selected_cinta_id BIGINT;
    record_item JSONB;
    test_item JSONB;
BEGIN
    -- 1. Insertar el estudiante y obtener su ID
    INSERT INTO public.estudiantes (cedula, nombres_apellidos, fecha_nacimiento, direccion, correo, carrera_id)
    VALUES (trim(p_cedula), p_nombres_apellidos, p_fecha_nacimiento, p_direccion, p_correo, p_carrera_id)
    RETURNING id INTO new_student_id;

    -- 2. Asociar estudiante con un deporte
    IF p_deporte_nombre IS NOT NULL AND p_deporte_nombre <> '' THEN
        SELECT id INTO selected_deporte_id FROM public.deportes WHERE nombre = p_deporte_nombre;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Deporte no encontrado: %', p_deporte_nombre;
        END IF;
        INSERT INTO public.estudiante_deportes (estudiante_id, deporte_id)
        VALUES (new_student_id, selected_deporte_id);
    END IF;

    -- 2.5. Asociar estudiante con una cinta
    IF p_cinta_color IS NOT NULL AND p_cinta_color <> '' THEN
        SELECT id INTO selected_cinta_id FROM public.cinta_tipos WHERE color = p_cinta_color;
        IF FOUND THEN
            INSERT INTO public.estudiante_cintas (estudiante_id, cinta_tipo_id)
            VALUES (new_student_id, selected_cinta_id);
        END IF;
    END IF;

    -- 3. Insertar ficha médica
    IF p_ficha_medica IS NOT NULL AND p_ficha_medica ? 'tipo_sangre' THEN
        INSERT INTO public.fichas_medicas (estudiante_id, tipo_sangre, patologias, ultima_consulta_medica)
        VALUES (
            new_student_id,
            (p_ficha_medica->>'tipo_sangre')::public.tipo_sangre_enum, -- Cast a ENUM
            p_ficha_medica->>'patologias',
            (p_ficha_medica->>'ultima_consulta_medica')::DATE
        );
    END IF;

    -- 4. Insertar tests físicos (como un array de objetos)
    IF jsonb_typeof(p_tests_fisicos) = 'array' AND jsonb_array_length(p_tests_fisicos) > 0 THEN
        FOR test_item IN SELECT * FROM jsonb_array_elements(p_tests_fisicos)
        LOOP
            INSERT INTO public.tests_fisicos (estudiante_id, categoria, prueba, unidad, resultado)
            VALUES (
                new_student_id,
                initcap(test_item->>'categoria')::public.categoria_prueba_enum, -- Normaliza y convierte a ENUM
                test_item->>'prueba',
                test_item->>'unidad',
                test_item->>'resultado' -- Corregido: Se elimina el cast a NUMERIC para que coincida con el tipo TEXT de la columna
            );
        END LOOP;
    END IF;

    -- 5. Insertar records deportivos (si existen)
    IF p_records_deportivos IS NOT NULL AND jsonb_array_length(p_records_deportivos) > 0 THEN
        FOR record_item IN SELECT * FROM jsonb_array_elements(p_records_deportivos)
        LOOP
            INSERT INTO public.records_deportivos (estudiante_id, nombre_competencia, fecha_competencia, resultado, puesto)
            VALUES (
                new_student_id,
                record_item->>'nombre_competencia',
                (record_item->>'fecha_competencia')::DATE,
                (record_item->>'resultado')::public.resultado_competencia, -- Corregido: Se añade el cast al tipo ENUM
                (record_item->>'puesto')::INT
            );
        END LOOP;
    END IF;

    -- 6. Devolver el ID del estudiante creado
    RETURN new_student_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_student_full_details(p_cedula VARCHAR(10))
RETURNS JSONB AS $
DECLARE
    student_details JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', e.id,
        'cedula', e.cedula,
        'nombres_apellidos', e.nombres_apellidos,
        'fecha_nacimiento', e.fecha_nacimiento,
        'direccion', e.direccion,
        'correo', e.correo,
        'carrera', c.nombre,
        'facultad', f.nombre,
        'edad', date_part('year', age(e.fecha_nacimiento)),
        'ficha_medica', (
            SELECT jsonb_build_object(
                'tipo_sangre', fm.tipo_sangre,
                'patologias', fm.patologias,
                'ultima_consulta_medica', fm.ultima_consulta_medica
            )
            FROM public.fichas_medicas fm
            WHERE fm.estudiante_id = e.id
        ), -- Añadido COALESCE para manejar estudiantes sin ficha médica
        'tests_fisicos', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', tf.id,
                    'categoria', tf.categoria,
                    'prueba', tf.prueba,
                    'unidad', tf.unidad,
                    'resultado', tf.resultado, -- El resultado ahora es TEXT
                    'created_at', tf.created_at
                ) ORDER BY tf.created_at DESC
            )
            FROM public.tests_fisicos tf
            WHERE tf.estudiante_id = e.id),
            '[]'::jsonb
        ),
        'deportes', COALESCE(
            (
                SELECT jsonb_agg(d.nombre)
                FROM public.estudiante_deportes ed
                JOIN public.deportes d ON ed.deporte_id = d.id
                WHERE ed.estudiante_id = e.id
            ),
            '[]'::jsonb
        ),
        'cintas', COALESCE(
            (
                SELECT jsonb_agg(ct.color)
                FROM public.estudiante_cintas ec
                JOIN public.cinta_tipos ct ON ec.cinta_tipo_id = ct.id
                WHERE ec.estudiante_id = e.id
            ),
            '[]'::jsonb
        ),
        'records_deportivos', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'nombre_competencia', rd.nombre_competencia,
                        'fecha_competencia', rd.fecha_competencia,
                        'resultado', rd.resultado,
                        'puesto', rd.puesto
                    )
                )
                FROM public.records_deportivos rd
                WHERE rd.estudiante_id = e.id
            ),
            '[]'::jsonb
        )
    )
    INTO student_details
    FROM public.estudiantes e
    LEFT JOIN public.carreras c ON e.carrera_id = c.id
    LEFT JOIN public.facultades f ON c.facultad_id = f.id
    WHERE trim(e.cedula) = trim(p_cedula); -- Usar TRIM para evitar problemas con espacios

    -- Devolver un objeto JSON vacío si no se encuentra el estudiante,
    -- en lugar de NULL, para que sea más fácil de manejar en el frontend.
    IF student_details IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;

    RETURN student_details; 
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
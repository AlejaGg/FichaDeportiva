-- ####################################################################
-- # FUNCIONES CRUD ADICIONALES PARA ESTUDIANTES
-- ####################################################################

-- ####################################################################
-- # 1. FUNCIÓN RPC PARA ACTUALIZACIÓN TRANSACCIONAL DE ESTUDIANTE
-- ####################################################################
CREATE OR REPLACE FUNCTION update_full_student(
    p_student_id UUID,
    p_nombres_apellidos TEXT,
    p_fecha_nacimiento DATE,
    p_direccion TEXT,
    p_correo TEXT,
    p_carrera_id BIGINT,
    p_deporte_nombre TEXT,
    p_cinta_color TEXT,
    p_ficha_medica JSONB,
    p_tests_fisicos_a_agregar JSONB,
    p_tests_fisicos_a_eliminar BIGINT[],
    p_records_a_agregar JSONB,
    p_records_a_eliminar BIGINT[]
)
RETURNS VOID AS $$
DECLARE
    selected_deporte_id BIGINT;
    selected_cinta_id BIGINT;
    test_item JSONB;
    record_item JSONB;
BEGIN
    -- 1. Actualizar datos principales del estudiante
    UPDATE public.estudiantes
    SET
        nombres_apellidos = p_nombres_apellidos,
        fecha_nacimiento = p_fecha_nacimiento,
        direccion = p_direccion,
        correo = p_correo,
        carrera_id = p_carrera_id
    WHERE id = p_student_id;

    -- 2. Actualizar deporte (eliminar anterior e insertar nuevo)
    DELETE FROM public.estudiante_deportes WHERE estudiante_id = p_student_id;
    IF p_deporte_nombre IS NOT NULL AND p_deporte_nombre <> '' THEN
        SELECT id INTO selected_deporte_id FROM public.deportes WHERE nombre = p_deporte_nombre;
        IF FOUND THEN
            INSERT INTO public.estudiante_deportes (estudiante_id, deporte_id)
            VALUES (p_student_id, selected_deporte_id);
        END IF;
    END IF;

    -- 2.5. Actualizar cinta (eliminar anterior e insertar nueva)
    DELETE FROM public.estudiante_cintas WHERE estudiante_id = p_student_id;
    IF p_cinta_color IS NOT NULL AND p_cinta_color <> '' THEN
        SELECT id INTO selected_cinta_id FROM public.cinta_tipos WHERE color = p_cinta_color;
        IF FOUND THEN
            INSERT INTO public.estudiante_cintas (estudiante_id, cinta_tipo_id)
            VALUES (p_student_id, selected_cinta_id);
        END IF;
    END IF;

    -- 3. Actualizar o insertar (UPSERT) ficha médica
    IF p_ficha_medica IS NOT NULL THEN
        INSERT INTO public.fichas_medicas (estudiante_id, tipo_sangre, patologias, ultima_consulta_medica)
        VALUES (
            p_student_id,
            (p_ficha_medica->>'tipo_sangre')::public.tipo_sangre_enum,
            p_ficha_medica->>'patologias',
            (p_ficha_medica->>'ultima_consulta_medica')::DATE
        )
        ON CONFLICT (estudiante_id) DO UPDATE SET
            tipo_sangre = EXCLUDED.tipo_sangre,
            patologias = EXCLUDED.patologias,
            ultima_consulta_medica = EXCLUDED.ultima_consulta_medica;
    END IF;

    -- 4. Gestionar Tests Físicos
    -- Eliminar los marcados para borrado
    IF array_length(p_tests_fisicos_a_eliminar, 1) > 0 THEN
        DELETE FROM public.tests_fisicos WHERE id = ANY(p_tests_fisicos_a_eliminar) AND estudiante_id = p_student_id;
    END IF;
    -- Agregar los nuevos
    FOR test_item IN SELECT * FROM jsonb_array_elements(p_tests_fisicos_a_agregar) LOOP
        INSERT INTO public.tests_fisicos (estudiante_id, categoria, prueba, unidad, resultado)
        VALUES (p_student_id, initcap(test_item->>'categoria')::public.categoria_prueba_enum, test_item->>'prueba', test_item->>'unidad', test_item->>'resultado');
    END LOOP;

    -- 5. Gestionar Récords Deportivos
    -- Eliminar los marcados para borrado
    IF array_length(p_records_a_eliminar, 1) > 0 THEN
        DELETE FROM public.records_deportivos WHERE id = ANY(p_records_a_eliminar) AND estudiante_id = p_student_id;
    END IF;
    -- Agregar los nuevos
    FOR record_item IN SELECT * FROM jsonb_array_elements(p_records_a_agregar) LOOP
        INSERT INTO public.records_deportivos (estudiante_id, nombre_competencia, fecha_competencia, resultado, puesto)
        VALUES (p_student_id, record_item->>'nombre_competencia', (record_item->>'fecha_competencia')::DATE, (record_item->>'resultado')::public.resultado_competencia, (record_item->>'puesto')::INT);
    END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ####################################################################
-- # 2. FUNCIÓN RPC PARA ELIMINAR ESTUDIANTE
-- ####################################################################
CREATE OR REPLACE FUNCTION delete_student(p_student_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Gracias a 'ON DELETE CASCADE', esto eliminará al estudiante y todos sus registros asociados.
    DELETE FROM public.estudiantes WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ####################################################################
-- # 3. FUNCIÓN RPC PARA CREACIÓN TRANSACCIONAL DE ESTUDIANTE
-- ####################################################################
CREATE OR REPLACE FUNCTION create_full_student(
    p_nombres_apellidos TEXT,
    p_cedula TEXT,
    p_fecha_nacimiento DATE,
    p_direccion TEXT,
    p_correo TEXT,
    p_facultad_id BIGINT,
    p_carrera_id BIGINT,
    p_deporte_nombre TEXT,
    p_cinta_color TEXT,
    p_ficha_medica JSONB,
    p_tests_fisicos JSONB,
    p_records_deportivos JSONB -- Corregido para coincidir con la llamada del cliente
)
RETURNS UUID AS $$
DECLARE
    new_student_id UUID;
    selected_deporte_id BIGINT;
    selected_cinta_id BIGINT;
    test_item JSONB;
    record_item JSONB;
BEGIN
    -- 1. Insertar datos principales del estudiante y obtener el nuevo ID
    INSERT INTO public.estudiantes (nombres_apellidos, cedula, fecha_nacimiento, direccion, correo, facultad_id, carrera_id)
    VALUES (p_nombres_apellidos, p_cedula, p_fecha_nacimiento, p_direccion, p_correo, p_facultad_id, p_carrera_id)
    RETURNING id INTO new_student_id;

    -- 2. Insertar deporte si se proporciona
    IF p_deporte_nombre IS NOT NULL AND p_deporte_nombre <> '' THEN
        SELECT id INTO selected_deporte_id FROM public.deportes WHERE nombre = p_deporte_nombre;
        IF FOUND THEN
            INSERT INTO public.estudiante_deportes (estudiante_id, deporte_id)
            VALUES (new_student_id, selected_deporte_id);
        END IF;
    END IF;

    -- 3. Insertar cinta si se proporciona
    IF p_cinta_color IS NOT NULL AND p_cinta_color <> '' THEN
        SELECT id INTO selected_cinta_id FROM public.cinta_tipos WHERE color = p_cinta_color;
        IF FOUND THEN
            INSERT INTO public.estudiante_cintas (estudiante_id, cinta_tipo_id)
            VALUES (new_student_id, selected_cinta_id);
        END IF;
    END IF;

    -- 4. Insertar ficha médica si se proporciona
    IF p_ficha_medica IS NOT NULL THEN
        INSERT INTO public.fichas_medicas (estudiante_id, tipo_sangre, patologias, ultima_consulta_medica)
        VALUES (new_student_id, (p_ficha_medica->>'tipo_sangre')::public.tipo_sangre_enum, p_ficha_medica->>'patologias', (p_ficha_medica->>'ultima_consulta_medica')::DATE);
    END IF;

    -- 5. Insertar Tests Físicos
    FOR test_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_tests_fisicos, '[]'::jsonb)) LOOP
        INSERT INTO public.tests_fisicos (estudiante_id, categoria, prueba, unidad, resultado)
        VALUES (new_student_id, initcap(test_item->>'categoria')::public.categoria_prueba_enum, test_item->>'prueba', test_item->>'unidad', test_item->>'resultado');
    END LOOP;

    -- 6. Insertar Récords Deportivos
    FOR record_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_records_deportivos, '[]'::jsonb)) LOOP
        INSERT INTO public.records_deportivos (estudiante_id, nombre_competencia, fecha_competencia, resultado, puesto)
        VALUES (new_student_id, record_item->>'nombre_competencia', (record_item->>'fecha_competencia')::DATE, (record_item->>'resultado')::public.resultado_competencia, (record_item->>'puesto')::INT);
    END LOOP;

    RETURN new_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ####################################################################
-- # 5. RESTRICCIÓN DE UNICIDAD PARA CÉDULA
-- ####################################################################
-- Esto previene que se inserten cédulas duplicadas en el futuro.
ALTER TABLE public.estudiantes
ADD CONSTRAINT estudiantes_cedula_key UNIQUE (cedula);

-- ####################################################################
-- # 4. FUNCIÓN RPC DEFINITIVA PARA OBTENER DETALLES COMPLETOS POR CÉDULA
-- ####################################################################
CREATE OR REPLACE FUNCTION public.get_student_full_details(p_cedula text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id uuid;
    v_result jsonb;
BEGIN
    -- 1. Encontrar el ID del estudiante usando la cédula.
    SELECT id INTO v_student_id
    FROM public.estudiantes
    WHERE cedula = p_cedula
    LIMIT 1;

    -- 2. Si no se encuentra el ID, devolver un objeto de error claro.
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Estudiante no encontrado');
    END IF;

    -- 3. Construir el objeto JSON con todos los detalles en una sola consulta.
    SELECT jsonb_build_object(
        'estudiante', jsonb_build_object(
            'id', e.id,
            'cedula', e.cedula,
            'nombres_apellidos', e.nombres_apellidos,
            'direccion', e.direccion,
            'correo', e.correo,
            'fecha_nacimiento', e.fecha_nacimiento,
            'created_at', e.created_at,
            'facultad_id', f.id,
            'facultad_nombre', f.nombre,
            'carrera_id', e.carrera_id,
            'carrera_nombre', car.nombre
        ),
        'deporte', (
            SELECT jsonb_build_object('id', d.id, 'nombre', d.nombre)
            FROM public.estudiante_deportes ed
            JOIN public.deportes d ON ed.deporte_id = d.id
            WHERE ed.estudiante_id = v_student_id
            LIMIT 1
        ),
        'cinta', (
            SELECT jsonb_build_object('id', ct.id, 'color', ct.color)
            FROM public.estudiante_cintas ec
            JOIN public.cinta_tipos ct ON ec.cinta_tipo_id = ct.id
            WHERE ec.estudiante_id = v_student_id
            LIMIT 1
        ),
        -- ficha_medica: un solo objeto o null
        'ficha_medica', (
            SELECT to_jsonb(fm)
            FROM public.fichas_medicas fm
            WHERE fm.estudiante_id = v_student_id
            LIMIT 1
        ),
        -- tests_fisicos: array ordenada por fecha_prueba desc
        'tests_fisicos', COALESCE((
            SELECT jsonb_agg(to_jsonb(tf) ORDER BY tf.fecha_prueba DESC, tf.id)
            FROM public.tests_fisicos tf
            WHERE tf.estudiante_id = v_student_id
        ), '[]'::jsonb),
        -- records_deportivos: array ordenada por fecha_competencia desc
        'records_deportivos', COALESCE((
            SELECT jsonb_agg(to_jsonb(rd) ORDER BY rd.fecha_competencia DESC, rd.id)
            FROM public.records_deportivos rd
            WHERE rd.estudiante_id = v_student_id
        ), '[]'::jsonb)
    ) INTO v_result
    FROM public.estudiantes e
    LEFT JOIN public.carreras car ON e.carrera_id = car.id
    LEFT JOIN public.facultades f ON car.facultad_id = f.id
    WHERE e.id = v_student_id
    LIMIT 1;

    -- Si por alguna razón no se obtuvo resultado, devolver error
    IF v_result IS NULL THEN
        RETURN jsonb_build_object('error', 'No se pudo construir el objeto de respuesta');
    END IF;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Captura errores inesperados y devuelve un JSON con el mensaje.
        RETURN jsonb_build_object(
            'error', 'Excepción al obtener detalles del estudiante',
            'detail', SQLERRM
        );
END;
$$;
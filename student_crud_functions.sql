-- ####################################################################
-- # FUNCIONES CRUD PARA GESTIÓN COMPLETA DE ESTUDIANTES
-- ####################################################################

-- ####################################################################
-- # 1. FUNCIÓN RPC PARA CREACIÓN TRANSACCIONAL DE ESTUDIANTE
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
    p_records_deportivos JSONB
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

    -- 2. Insertar deporte y cinta si se proporcionan
    IF p_deporte_nombre IS NOT NULL AND p_deporte_nombre <> '' THEN
        SELECT id INTO selected_deporte_id FROM public.deportes WHERE nombre = p_deporte_nombre;

        -- Obtener el ID de la cinta si se proporcionó
        IF p_cinta_color IS NOT NULL AND p_cinta_color <> '' THEN
            SELECT id INTO selected_cinta_id FROM public.cinta_tipos WHERE color = p_cinta_color;
        END IF;

        IF FOUND THEN
            -- Insertar la relación con el deporte y la cinta (si existe)
            INSERT INTO public.estudiante_deportes (estudiante_id, deporte_id, cinta_tipo_id)
            VALUES (new_student_id, selected_deporte_id, selected_cinta_id);
        END IF;
    END IF;

    -- 3. Insertar ficha médica si se proporciona
    IF p_ficha_medica IS NOT NULL THEN
        INSERT INTO public.fichas_medicas (estudiante_id, tipo_sangre, patologias, ultima_consulta_medica)
        VALUES (
            new_student_id,
            (p_ficha_medica->>'tipo_sangre')::public.tipo_sangre_enum,
            p_ficha_medica->>'patologias',
            (p_ficha_medica->>'ultima_consulta_medica')::DATE
        );
    END IF;

    -- 4. Insertar Tests Físicos
    FOR test_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_tests_fisicos, '[]'::jsonb)) LOOP
        INSERT INTO public.tests_fisicos (estudiante_id, categoria, prueba, unidad, resultado)
        VALUES (new_student_id, (test_item->>'categoria')::public.categoria_prueba_enum, test_item->>'prueba', test_item->>'unidad', test_item->>'resultado');
    END LOOP;

    -- 5. Insertar Récords Deportivos
    FOR record_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_records_deportivos, '[]'::jsonb)) LOOP
        INSERT INTO public.records_deportivos (estudiante_id, nombre_competencia, fecha_competencia, resultado, puesto)
        VALUES (
            new_student_id,
            record_item->>'nombre_competencia',
            (record_item->>'fecha_competencia')::DATE,
            (record_item->>'resultado')::public.resultado_competencia,
            (record_item->>'puesto')::INT
        );
    END LOOP;

    RETURN new_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ####################################################################
-- # 2. FUNCIÓN RPC PARA ACTUALIZACIÓN TRANSACCIONAL DE ESTUDIANTE
-- ####################################################################
CREATE OR REPLACE FUNCTION update_full_student_details(p_update_data JSONB)
RETURNS VOID AS $$
DECLARE
    v_student_id UUID := (p_update_data->>'student_id')::UUID;
    v_deporte_id BIGINT;
    v_cinta_id BIGINT;
    v_test_item JSONB;
    v_record_item JSONB;
    v_tests_to_delete BIGINT[] := ARRAY(SELECT jsonb_array_elements_text(p_update_data->'tests_fisicos_a_eliminar')::BIGINT);
    v_records_to_delete BIGINT[] := ARRAY(SELECT jsonb_array_elements_text(p_update_data->'records_a_eliminar')::BIGINT);
BEGIN
    -- 1. Actualizar datos principales del estudiante
    UPDATE public.estudiantes
    SET
        nombres_apellidos = p_update_data->>'nombres_apellidos',
        fecha_nacimiento = (p_update_data->>'fecha_nacimiento')::DATE,
        direccion = p_update_data->>'direccion',
        correo = p_update_data->>'correo',
        carrera_id = (p_update_data->>'carrera_id')::BIGINT
    WHERE id = v_student_id;

    -- 2. Actualizar deporte y cinta (eliminar anterior e insertar nuevo)
    DELETE FROM public.estudiante_deportes WHERE estudiante_id = v_student_id;
    IF p_update_data->>'deporte_nombre' IS NOT NULL THEN
        SELECT id INTO v_deporte_id FROM public.deportes WHERE nombre = p_update_data->>'deporte_nombre';
        IF p_update_data->>'cinta_color' IS NOT NULL THEN
            SELECT id INTO v_cinta_id FROM public.cinta_tipos WHERE color = p_update_data->>'cinta_color';
        END IF;
        IF v_deporte_id IS NOT NULL THEN
            INSERT INTO public.estudiante_deportes (estudiante_id, deporte_id, cinta_tipo_id)
            VALUES (v_student_id, v_deporte_id, v_cinta_id);
        END IF;
    END IF;

    -- 3. Actualizar o insertar (UPSERT) ficha médica
    IF p_update_data->'ficha_medica' IS NOT NULL THEN
        INSERT INTO public.fichas_medicas (estudiante_id, tipo_sangre, patologias, ultima_consulta_medica)
        VALUES (v_student_id, (p_update_data->'ficha_medica'->>'tipo_sangre')::public.tipo_sangre_enum, p_update_data->'ficha_medica'->>'patologias', (p_update_data->'ficha_medica'->>'ultima_consulta_medica')::DATE)
        ON CONFLICT (estudiante_id) DO UPDATE SET
            tipo_sangre = EXCLUDED.tipo_sangre,
            patologias = EXCLUDED.patologias,
            ultima_consulta_medica = EXCLUDED.ultima_consulta_medica;
    END IF;

    -- 4. Gestionar Tests Físicos
    IF array_length(v_tests_to_delete, 1) > 0 THEN
        DELETE FROM public.tests_fisicos WHERE id = ANY(v_tests_to_delete) AND estudiante_id = v_student_id;
    END IF;
    FOR v_test_item IN SELECT * FROM jsonb_array_elements(p_update_data->'tests_fisicos_a_agregar') LOOP
        INSERT INTO public.tests_fisicos (estudiante_id, categoria, prueba, unidad, resultado)
        VALUES (v_student_id, (v_test_item->>'categoria')::public.categoria_prueba_enum, v_test_item->>'prueba', v_test_item->>'unidad', v_test_item->>'resultado');
    END LOOP;

    -- 5. Gestionar Récords Deportivos
    IF array_length(v_records_to_delete, 1) > 0 THEN
        DELETE FROM public.records_deportivos WHERE id = ANY(v_records_to_delete) AND estudiante_id = v_student_id;
    END IF;
    FOR v_record_item IN SELECT * FROM jsonb_array_elements(p_update_data->'records_a_agregar') LOOP
        INSERT INTO public.records_deportivos (estudiante_id, nombre_competencia, fecha_competencia, resultado, puesto)
        VALUES (v_student_id, v_record_item->>'nombre_competencia', (v_record_item->>'fecha_competencia')::DATE, (v_record_item->>'resultado')::public.resultado_competencia, (v_record_item->>'puesto')::INT);
    END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ####################################################################
-- # 3. FUNCIÓN RPC PARA ELIMINAR ESTUDIANTE
-- ####################################################################
CREATE OR REPLACE FUNCTION delete_student(p_student_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Gracias a 'ON DELETE CASCADE', esto eliminará al estudiante y todos sus registros asociados.
    DELETE FROM public.estudiantes WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ####################################################################
-- # 4. FUNCIÓN RPC DEFINITIVA PARA OBTENER DETALLES COMPLETOS POR CÉDULA
-- ####################################################################
CREATE OR REPLACE FUNCTION public.get_student_full_details(p_cedula text)
RETURNS jsonb
LANGUAGE plpgsql
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
        RETURN jsonb_build_object(
            'data', NULL,
            'error', jsonb_build_object('message', 'Estudiante no encontrado')
        );
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
        'deportes', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'estudiante_deporte', to_jsonb(ed.*),
                    'deporte', to_jsonb(d.*),
                    'cinta_tipo', CASE WHEN ct.id IS NOT NULL THEN to_jsonb(ct.*) ELSE NULL END
                ) ORDER BY d.nombre
            )
            FROM public.estudiante_deportes ed
            JOIN public.deportes d ON ed.deporte_id = d.id
            LEFT JOIN public.cinta_tipos ct ON ed.cinta_tipo_id = ct.id
            WHERE ed.estudiante_id = v_student_id
        ), '[]'::jsonb),
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
        RETURN jsonb_build_object(
            'data', NULL,
            'error', jsonb_build_object('message', 'No se pudo construir el objeto de respuesta')
        );
    END IF;

    RETURN jsonb_build_object(
        'data', v_result,
        'error', NULL
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Captura errores inesperados y devuelve un JSON con el mensaje.
        RETURN jsonb_build_object(
            'data', NULL,
            'error', 'Excepción al obtener detalles del estudiante',
            'detail', SQLERRM
        );
END;
$$ SECURITY DEFINER;
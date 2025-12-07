-- ####################################################################
-- # FUNCIONES CRUD ADICIONALES PARA ESTUDIANTES
-- ####################################################################

-- ####################################################################
-- # 1. FUNCIÓN RPC PARA ACTUALIZACIÓN TRANSACCIONAL DE ESTUDIANTE
-- ####################################################################
CREATE OR REPLACE FUNCTION update_full_student(
    p_student_id UUID,
    p_cedula VARCHAR(10),
    p_nombres_apellidos TEXT,
    p_fecha_nacimiento DATE,
    p_direccion TEXT,
    p_correo TEXT,
    p_carrera_id BIGINT,
    p_deporte_nombre TEXT,
    p_ficha_medica JSONB,
    p_tests_fisicos_a_agregar JSONB,
    p_tests_fisicos_a_eliminar BIGINT[],
    p_records_a_agregar JSONB,
    p_records_a_eliminar BIGINT[]
)
RETURNS VOID AS $$
DECLARE
    selected_deporte_id BIGINT;
    test_item JSONB;
    record_item JSONB;
BEGIN
    -- 1. Actualizar datos principales del estudiante
    UPDATE public.estudiantes
    SET
        cedula = trim(p_cedula),
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
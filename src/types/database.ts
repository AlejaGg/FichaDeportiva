// =================================================================================
// ADVERTENCIA: ESTE ARCHIVO FUE GENERADO MANUALMENTE.
// Lo ideal es utilizar el CLI de Supabase para generar estos tipos automáticamente
// ejecutando el comando: npx supabase gen types typescript --project-id <tu-project-id> > src/types/database.ts
// Esto asegura que los tipos del frontend estén siempre sincronizados con el esquema de la base de datos.
// =================================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ResultadoCompetencia = "ORO" | "PLATA" | "BRONCE" | "OTRO";

export const RESULTADOS_COMPETENCIA: ResultadoCompetencia[] = ["ORO", "PLATA", "BRONCE", "OTRO"];

// Nuevo tipo para el ENUM de tipo de sangre
export type TipoSangreEnum = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type DeporteName = "Taekwondo" | "Judo" | "Wushu" | "Karate Do";



export type CategoriaPruebaEnum = "velocidad" | "fuerza" | "resistencia";



export const CATEGORIAS_PRUEBA: CategoriaPruebaEnum[] = ["velocidad", "fuerza", "resistencia"];



// Nuevas interfaces para tipos de datos de inserción específicos del frontend

export type FichaMedicaInsert = {

  tipo_sangre?: TipoSangreEnum | "";

  patologias?: string;

  ultima_consulta_medica?: string;

};



export type TestFisicoInsert = {

  categoria: CategoriaPruebaEnum;

  prueba: string;

  unidad: string;

  resultado: string;

};



export type RecordDeportivoInsert = {

  nombre_competencia: string;

  fecha_competencia: string;

  resultado?: ResultadoCompetencia;

  puesto?: number | "";

};





export interface Database {

  public: {

    Tables: {

      deportes: {

        Row: {

          id: number

          nombre: string

        }

        Insert: {

          id?: number

          nombre: string

        }

        Update: {

          id?: number

          nombre?: string

        }

        Relationships: []

      }
      
      cinta_tipos: {

        Row: {

          id: number

          color: string

        }

        Insert: {

          id?: number

          color: string

        }

        Update: {

          id?: number

          color?: string

        }

        Relationships: []

      }
      
      vista_lista_estudiantes_completa: {

        Row: {

          id: string

          cedula: string

          nombres_apellidos: string

          edad: number | null

          carrera: string | null

          deportes: string[] | null

          cintas: string[] | null

        }

        Insert: never

        Update: never

        Relationships: []

      }

      estudiante_deportes: {

        Row: {

          deporte_id: number

          estudiante_id: string

        }

        Insert: {

          deporte_id: number

          estudiante_id: string

        }

        Update: {

          deporte_id?: number

          estudiante_id?: string

        }

        Relationships: [

          {

            foreignKeyName: "estudiante_deportes_deporte_id_fkey"

            columns: ["deporte_id"]

            referencedRelation: "deportes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "estudiante_deportes_estudiante_id_fkey"

            columns: ["estudiante_id"]

            referencedRelation: "estudiantes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "estudiante_deportes_estudiante_id_fkey"

            columns: ["estudiante_id"]

            referencedRelation: "v_estudiantes_con_edad"

            referencedColumns: ["id"]

          }

        ]

      }

      estudiantes: {

        Row: {

          carrera: string | null

          cedula: string

          correo: string | null

          created_at: string

          direccion: string | null

          facultad: string | null

          fecha_nacimiento: string

          id: string

          nombres_apellidos: string

        }

        Insert: {

          carrera?: string | null

          cedula: string

          correo?: string | null

          created_at?: string

          direccion?: string | null

          facultad?: string | null

          fecha_nacimiento: string

          id?: string

          nombres_apellidos: string

        }

        Update: {

          carrera?: string | null

          cedula?: string

          correo?: string | null

          created_at?: string

          direccion?: string | null

          facultad?: string | null

          fecha_nacimiento?: string

          id?: string

          nombres_apellidos?: string

        }

        Relationships: []

      }

      fichas_medicas: {

        Row: {

          estudiante_id: string

          patologias: string | null

          tipo_sangre: TipoSangreEnum | null

          ultima_consulta_medica: string | null

        }

        Insert: {

          estudiante_id: string

          patologias?: string | null

          tipo_sangre?: TipoSangreEnum | null

          ultima_consulta_medica?: string | null

        }

        Update: {

          estudiante_id?: string

          patologias?: string | null

          tipo_sangre?: TipoSangreEnum | null

          ultima_consulta_medica?: string | null

        }

        Relationships: [

          {

            foreignKeyName: "fichas_medicas_estudiante_id_fkey"

            columns: ["estudiante_id"]

            referencedRelation: "estudiantes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "fichas_medicas_estudiante_id_fkey"

            columns: ["estudiante_id"]

            referencedRelation: "v_estudiantes_con_edad"

            referencedColumns: ["id"]

          }

        ]

      }

      records_deportivos: {

        Row: {

          estudiante_id: string

          fecha_competencia: string

          id: number

          nombre_competencia: string

          puesto: number | null

          resultado: ResultadoCompetencia | null

        }

        Insert: {

          estudiante_id: string

          fecha_competencia: string

          id?: number

          nombre_competencia: string

          puesto?: number | null

          resultado?: ResultadoCompetencia | null

        }

        Update: {

          estudiante_id?: string

          fecha_competencia?: string

          id?: number

          nombre_competencia?: string

          puesto?: number | null

          resultado?: ResultadoCompetencia | null

        }

        Relationships: [

          {

            foreignKeyName: "records_deportivos_estudiante_id_fkey"

            columns: ["estudiante_id"]

            referencedRelation: "estudiantes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "records_deportivos_estudiante_id_fkey"

            columns: ["estudiante_id"]

            referencedRelation: "v_estudiantes_con_edad"

            referencedColumns: ["id"]

          }

        ]

      }

      tests_fisicos: {

        Row: {

          id: string;

          estudiante_id: string;

          categoria: CategoriaPruebaEnum;

          prueba: string;

          unidad: string | null;

          resultado: string;

          created_at: string;

        };

        Insert: {

          id?: string;

          estudiante_id: string;

          categoria: CategoriaPruebaEnum;

          prueba: string;

          unidad?: string | null;

          resultado: string;

          created_at?: string;

        };

        Update: {

          id?: string;

          estudiante_id?: string;

          categoria?: CategoriaPruebaEnum;

          prueba?: string;

          unidad?: string | null;

          resultado?: string;

          created_at?: string;

        };

        Relationships: [

          {

            foreignKeyName: "fk_estudiante";

            columns: ["estudiante_id"];

            referencedRelation: "estudiantes";

            referencedColumns: ["id"];

          }

        ];

      }

    }

    Views: {

      v_estudiantes_con_edad: {

        Row: {

          carrera: string | null

          cedula: string | null

          correo: string | null

          created_at: string | null

          direccion: string | null

          edad: number | null

          facultad: string | null

          fecha_nacimiento: string | null

          id: string | null

          nombres_apellidos: string | null

        }

        Relationships: []

      }

    }

    Functions: {

      create_full_student: {

        Args: {

          p_cedula: string

          p_nombres_apellidos: string

          p_fecha_nacimiento: string

          p_direccion: string

          p_correo: string

          p_carrera_id?: number | null

          p_facultad_id?: number | null

          p_deporte_nombre: string

          p_cinta_color?: string

          p_ficha_medica: FichaMedicaInsert

          p_tests_fisicos: TestFisicoInsert[]

          p_records_deportivos: RecordDeportivoInsert[]

        }

        Returns: string

      }

      get_student_full_details: {

        Args: {

          p_cedula: string

        }

        Returns: {

            id: string

            cedula: string

            nombres_apellidos: string

            direccion: string | null

            correo: string | null

            carrera: string | null

            facultad: string | null

            fecha_nacimiento: string

            edad: number

            ficha_medica: {

                estudiante_id: string

                patologias: string | null

                tipo_sangre: TipoSangreEnum | null

                ultima_consulta_medica: string | null

            } | null

            tests_fisicos: {

                id: string;

                categoria: CategoriaPruebaEnum;

                prueba: string;

                unidad: string | null;

                resultado: string;

                fecha_prueba: string;

            }[]

            deportes: string[]

            records_deportivos: {

                estudiante_id: string

                fecha_competencia: string

                id: number

                nombre_competencia: string

                puesto: number | null

                resultado: ResultadoCompetencia | null

            }[]

        } | null

      }

      get_facultades: {

        Args: Record<string, never>

        Returns: Array<{ id: number; nombre: string }>

      }

      get_carreras_con_facultad: {

        Args: Record<string, never>

        Returns: Array<{ id: number; nombre: string; facultad_id: number; facultad_nombre: string }>

      }

      update_full_student: {

        Args: {

          p_student_id: string | null

          p_nombres_apellidos: string

          p_fecha_nacimiento: string

          p_direccion: string

          p_correo: string

          p_carrera_id?: number | null

          p_deporte_nombre: string

          p_cinta_color?: string

          p_ficha_medica: FichaMedicaInsert

          p_tests_fisicos_a_agregar: TestFisicoInsert[]

          p_tests_fisicos_a_actualizar: TestFisicoInsert[]

          p_tests_fisicos_a_eliminar: number[]

          p_records_a_agregar: RecordDeportivoInsert[]

          p_records_a_actualizar: RecordDeportivoInsert[]

          p_records_a_eliminar: number[]

        }

        Returns: void

      }

      delete_student: {

        Args: {

          p_student_id: string

        }

        Returns: void

      }

    }

    Enums: {

        resultado_competencia: "ORO" | "PLATA" | "BRONCE" | "OTRO";

        tipo_sangre_enum: TipoSangreEnum;

        categoria_prueba_enum: CategoriaPruebaEnum;

    }

    CompositeTypes: {

      [_ in never]: never

    }

  }

}

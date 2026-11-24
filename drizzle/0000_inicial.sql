CREATE TABLE "acceso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cuenta_id" text NOT NULL,
	"producto_sku" varchar(40),
	"orden_id" uuid,
	"origen" varchar(10) NOT NULL,
	"desde" timestamp with time zone NOT NULL,
	"hasta" timestamp with time zone NOT NULL,
	"revocado_en" timestamp with time zone,
	CONSTRAINT "acceso_orden_id_unique" UNIQUE("orden_id"),
	CONSTRAINT "acceso_rango_ck" CHECK ("acceso"."desde" <= "acceso"."hasta"),
	CONSTRAINT "acceso_origen_ck" CHECK ("acceso"."origen" in ('orden','cortesia','prueba')),
	CONSTRAINT "acceso_prueba_ck" CHECK ("acceso"."origen" <> 'prueba' or ("acceso"."orden_id" is null and "acceso"."hasta" <= "acceso"."desde" + interval '3 days'))
);
--> statement-breakpoint
CREATE TABLE "area" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"examen_id" varchar(20) NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"tipo" varchar(12) NOT NULL,
	"cuenta_puntaje" boolean DEFAULT true NOT NULL,
	"orden" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "area_tipo_ck" CHECK ("area"."tipo" in ('transversal','modulo'))
);
--> statement-breakpoint
CREATE TABLE "auditoria" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" text,
	"accion" varchar(60) NOT NULL,
	"entidad" varchar(40) NOT NULL,
	"entidad_id" varchar(120) NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ciclo_admision" (
	"examen_id" varchar(20) NOT NULL,
	"anio" smallint NOT NULL,
	"fecha_examen" date,
	"convocatoria_en" date,
	CONSTRAINT "ciclo_admision_examen_id_anio_pk" PRIMARY KEY("examen_id","anio")
);
--> statement-breakpoint
CREATE TABLE "clasificacion_semanal" (
	"semana" date NOT NULL,
	"cuenta_id" text NOT NULL,
	"division" varchar(8) DEFAULT 'bronce' NOT NULL,
	"grupo" smallint DEFAULT 1 NOT NULL,
	"puntos" integer DEFAULT 0 NOT NULL,
	"posicion" smallint,
	CONSTRAINT "clasificacion_semanal_semana_cuenta_id_pk" PRIMARY KEY("semana","cuenta_id"),
	CONSTRAINT "clasif_div_ck" CHECK ("clasificacion_semanal"."division" in ('bronce','plata','oro'))
);
--> statement-breakpoint
CREATE TABLE "codigo_referido" (
	"codigo" varchar(16) PRIMARY KEY NOT NULL,
	"cuenta_id" text NOT NULL,
	"descuento_pct" smallint DEFAULT 15 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codigo_referido_cuenta_id_unique" UNIQUE("cuenta_id"),
	CONSTRAINT "referido_pct_ck" CHECK ("codigo_referido"."descuento_pct" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "cuenta" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre_pila" text DEFAULT '' NOT NULL,
	"correo" text NOT NULL,
	"correo_verificado" boolean DEFAULT false NOT NULL,
	"imagen" text,
	"estado" varchar(12) DEFAULT 'activa' NOT NULL,
	"aviso_version_aceptada" varchar(16),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cuenta_estado_ck" CHECK ("cuenta"."estado" in ('activa','suspendida','borrada'))
);
--> statement-breakpoint
CREATE TABLE "cuenta_insignia" (
	"cuenta_id" text NOT NULL,
	"insignia_id" varchar(40) NOT NULL,
	"obtenida_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cuenta_insignia_cuenta_id_insignia_id_pk" PRIMARY KEY("cuenta_id","insignia_id")
);
--> statement-breakpoint
CREATE TABLE "cuenta_rol" (
	"cuenta_id" text NOT NULL,
	"rol" varchar(10) NOT NULL,
	CONSTRAINT "cuenta_rol_cuenta_id_rol_pk" PRIMARY KEY("cuenta_id","rol"),
	CONSTRAINT "cuenta_rol_ck" CHECK ("cuenta_rol"."rol" in ('alumno','admin'))
);
--> statement-breakpoint
CREATE TABLE "cupon" (
	"codigo" varchar(30) PRIMARY KEY NOT NULL,
	"descuento_pct" smallint NOT NULL,
	"vigente_hasta" date NOT NULL,
	"usos_max" integer NOT NULL,
	"usos" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "cupon_pct_ck" CHECK ("cupon"."descuento_pct" between 1 and 100),
	CONSTRAINT "cupon_usos_ck" CHECK ("cupon"."usos" <= "cupon"."usos_max")
);
--> statement-breakpoint
CREATE TABLE "enlace_compartido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cuenta_id" text NOT NULL,
	"token_hash" char(64) NOT NULL,
	"tipo" varchar(8) NOT NULL,
	"canal" varchar(10) DEFAULT 'copiar' NOT NULL,
	"imagen_url" varchar(500),
	"datos" jsonb,
	"producto_sku" varchar(40),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"vence_en" timestamp with time zone NOT NULL,
	"usado_en" timestamp with time zone,
	"revocado_en" timestamp with time zone,
	CONSTRAINT "enlace_compartido_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "enlace_tipo_ck" CHECK ("enlace_compartido"."tipo" in ('avance','pago')),
	CONSTRAINT "enlace_vence_ck" CHECK (("enlace_compartido"."tipo" = 'avance' and "enlace_compartido"."vence_en" <= "enlace_compartido"."creado_en" + interval '30 days') or ("enlace_compartido"."tipo" = 'pago' and "enlace_compartido"."vence_en" <= "enlace_compartido"."creado_en" + interval '7 days'))
);
--> statement-breakpoint
CREATE TABLE "error_catalogo" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"area_id" varchar(20),
	"descripcion" text NOT NULL,
	"recomendacion" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_frecuente" (
	"intento_id" uuid NOT NULL,
	"error_id" varchar(60) NOT NULL,
	"veces" smallint NOT NULL,
	"lugar" smallint NOT NULL,
	CONSTRAINT "error_frecuente_intento_id_error_id_pk" PRIMARY KEY("intento_id","error_id"),
	CONSTRAINT "ef_veces_ck" CHECK ("error_frecuente"."veces" >= 2 and "error_frecuente"."lugar" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "estadistica_opcion" (
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"opcion_id" char(1) NOT NULL,
	"veces_elegida" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "estadistica_opcion_reactivo_id_version_opcion_id_pk" PRIMARY KEY("reactivo_id","version","opcion_id")
);
--> statement-breakpoint
CREATE TABLE "estadistica_reactivo" (
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"n" integer DEFAULT 0 NOT NULL,
	"p" numeric(5, 4),
	"discriminacion" numeric(5, 4),
	"bandera_revision" boolean DEFAULT false NOT NULL,
	"motivo_bandera" varchar(200),
	"calculado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estadistica_reactivo_reactivo_id_version_pk" PRIMARY KEY("reactivo_id","version")
);
--> statement-breakpoint
CREATE TABLE "evento_puntos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cuenta_id" text NOT NULL,
	"intento_id" uuid,
	"motivo" varchar(14) NOT NULL,
	"puntos" integer NOT NULL,
	"id_idempotencia" varchar(120) NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evento_puntos_id_idempotencia_unique" UNIQUE("id_idempotencia"),
	CONSTRAINT "evento_motivo_ck" CHECK ("evento_puntos"."motivo" in ('acierto','seccion','insignia','racha','dia'))
);
--> statement-breakpoint
CREATE TABLE "examen" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"nivel" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "importacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ejecutada_por" text,
	"banco" varchar(200) NOT NULL,
	"archivo" varchar(200) NOT NULL,
	"checksum" char(64) NOT NULL,
	"estado" varchar(12) NOT NULL,
	"versiones_nuevas" integer DEFAULT 0 NOT NULL,
	"errores" text,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "importacion_estado_ck" CHECK ("importacion"."estado" in ('aceptada','rechazada'))
);
--> statement-breakpoint
CREATE TABLE "insignia" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"nombre" varchar(80) NOT NULL,
	"descripcion" text NOT NULL,
	"condicion" text NOT NULL,
	"icono" varchar(40) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cuenta_id" text,
	"sesion_anonima_id" uuid,
	"plantilla_id" varchar(60),
	"release_version" varchar(20) NOT NULL,
	"modo" varchar(14) NOT NULL,
	"estado" varchar(12) DEFAULT 'en_curso' NOT NULL,
	"semilla" bigint NOT NULL,
	"filtro" varchar(60),
	"inicia_en" timestamp with time zone DEFAULT now() NOT NULL,
	"vence_en" timestamp with time zone NOT NULL,
	"enviado_en" timestamp with time zone,
	"ultima_actividad_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intento_dueno_ck" CHECK ("intento"."sesion_anonima_id" is null or ("intento"."cuenta_id" is null and "intento"."modo" = 'mini')),
	CONSTRAINT "intento_estado_ck" CHECK ("intento"."estado" in ('en_curso','enviado','abandonado'))
);
--> statement-breakpoint
CREATE TABLE "item_intento" (
	"intento_id" uuid NOT NULL,
	"orden" smallint NOT NULL,
	"seccion" smallint NOT NULL,
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"orden_opciones" char(3) NOT NULL,
	CONSTRAINT "item_intento_intento_id_orden_pk" PRIMARY KEY("intento_id","orden")
);
--> statement-breakpoint
CREATE TABLE "limite_plan" (
	"plan" varchar(10) NOT NULL,
	"recurso" varchar(20) NOT NULL,
	"cantidad" integer,
	"periodo" varchar(10) NOT NULL,
	"texto_muro" text,
	CONSTRAINT "limite_plan_plan_recurso_pk" PRIMARY KEY("plan","recurso"),
	CONSTRAINT "limite_plan_ck" CHECK ("limite_plan"."plan" in ('anonimo','gratis','prueba','pase')),
	CONSTRAINT "limite_periodo_ck" CHECK ("limite_plan"."periodo" in ('dia','semana','mes','temporada'))
);
--> statement-breakpoint
CREATE TABLE "opcion" (
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"opcion_id" char(1) NOT NULL,
	"texto" text NOT NULL,
	"correcta" boolean NOT NULL,
	"argumentacion" text NOT NULL,
	"error_id" varchar(60),
	CONSTRAINT "opcion_reactivo_id_version_opcion_id_pk" PRIMARY KEY("reactivo_id","version","opcion_id"),
	CONSTRAINT "opcion_id_ck" CHECK ("opcion"."opcion_id" in ('A','B','C')),
	CONSTRAINT "opcion_error_ck" CHECK (("opcion"."correcta" and "opcion"."error_id" is null) or (not "opcion"."correcta" and "opcion"."error_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "orden" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiario_id" text,
	"enlace_id" uuid,
	"producto_sku" varchar(40) NOT NULL,
	"cupon_codigo" varchar(30),
	"referido_codigo" varchar(16),
	"promocion_id" varchar(40),
	"quien_paga" varchar(10) NOT NULL,
	"precio_lista" numeric(8, 2) NOT NULL,
	"total" numeric(8, 2) NOT NULL,
	"estado" varchar(12) DEFAULT 'pendiente' NOT NULL,
	"proveedor" varchar(20) NOT NULL,
	"referencia_checkout" varchar(200),
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orden_enlace_id_unique" UNIQUE("enlace_id"),
	CONSTRAINT "orden_descuento_ck" CHECK ((("orden"."cupon_codigo" is not null)::int + ("orden"."referido_codigo" is not null)::int + ("orden"."promocion_id" is not null)::int) <= 1),
	CONSTRAINT "orden_quien_ck" CHECK ("orden"."quien_paga" in ('alumno','familiar','otro')),
	CONSTRAINT "orden_estado_ck" CHECK ("orden"."estado" in ('pendiente','pagada','expirada','reembolsada'))
);
--> statement-breakpoint
CREATE TABLE "pago" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orden_id" uuid NOT NULL,
	"proveedor" varchar(20) NOT NULL,
	"referencia_externa" varchar(120) NOT NULL,
	"metodo" varchar(14) NOT NULL,
	"estado" varchar(20) NOT NULL,
	"monto_mxn" numeric(8, 2) NOT NULL,
	"confirmado_en" timestamp with time zone,
	CONSTRAINT "pago_referencia_externa_unique" UNIQUE("referencia_externa")
);
--> statement-breakpoint
CREATE TABLE "perfil_alumno" (
	"cuenta_id" text PRIMARY KEY NOT NULL,
	"nivel" varchar(14) NOT NULL,
	"carrera_objetivo" varchar(120) NOT NULL,
	"ruta_id" varchar(40) NOT NULL,
	"examen_id" varchar(20) NOT NULL,
	"ciclo_anio" smallint NOT NULL,
	"alias" varchar(24) NOT NULL,
	"visible_en_ranking" boolean DEFAULT true NOT NULL,
	"tema_interfaz" varchar(8) DEFAULT 'sistema' NOT NULL,
	"repaso_espaciado" boolean DEFAULT true NOT NULL,
	"llego_con_referido" varchar(16),
	CONSTRAINT "perfil_tema_ck" CHECK ("perfil_alumno"."tema_interfaz" in ('claro','oscuro','sistema'))
);
--> statement-breakpoint
CREATE TABLE "plantilla" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"ruta_id" varchar(40) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"modo" varchar(14) NOT NULL,
	"tiempo_limite_min" smallint NOT NULL,
	"umbral_domina" numeric(3, 2) DEFAULT '0.80' NOT NULL,
	"umbral_desarrollo" numeric(3, 2) DEFAULT '0.50' NOT NULL,
	"minimo_reportar" smallint DEFAULT 3 NOT NULL,
	"familia_equivalencia" varchar(60),
	"cronometro_global" boolean DEFAULT false NOT NULL,
	"notas" text,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "plantilla_umbral_ck" CHECK (0 < "plantilla"."umbral_desarrollo" and "plantilla"."umbral_desarrollo" < "plantilla"."umbral_domina" and "plantilla"."umbral_domina" <= 1),
	CONSTRAINT "plantilla_min_ck" CHECK ("plantilla"."minimo_reportar" >= 1),
	CONSTRAINT "plantilla_modo_ck" CHECK ("plantilla"."modo" in ('mini','diagnostico','simulacro','muestra'))
);
--> statement-breakpoint
CREATE TABLE "plantilla_reactivo" (
	"plantilla_id" varchar(60) NOT NULL,
	"reactivo_id" varchar(30) NOT NULL,
	"seccion" smallint NOT NULL,
	"orden" smallint NOT NULL,
	CONSTRAINT "plantilla_reactivo_plantilla_id_reactivo_id_pk" PRIMARY KEY("plantilla_id","reactivo_id")
);
--> statement-breakpoint
CREATE TABLE "plantilla_seccion" (
	"plantilla_id" varchar(60) NOT NULL,
	"numero" smallint NOT NULL,
	"area_id" varchar(20) NOT NULL,
	"tiempo_limite_min" smallint NOT NULL,
	CONSTRAINT "plantilla_seccion_plantilla_id_numero_pk" PRIMARY KEY("plantilla_id","numero")
);
--> statement-breakpoint
CREATE TABLE "preferencia_contacto" (
	"cuenta_id" text NOT NULL,
	"canal" varchar(10) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"activo" boolean DEFAULT false NOT NULL,
	"destino" text,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preferencia_contacto_cuenta_id_canal_tipo_pk" PRIMARY KEY("cuenta_id","canal","tipo"),
	CONSTRAINT "pref_whatsapp_ck" CHECK ("preferencia_contacto"."canal" <> 'whatsapp' or "preferencia_contacto"."destino" is not null)
);
--> statement-breakpoint
CREATE TABLE "producto" (
	"sku" varchar(40) PRIMARY KEY NOT NULL,
	"examen_id" varchar(20) NOT NULL,
	"ciclo_anio" smallint NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"descripcion" text,
	"tipo" varchar(10) NOT NULL,
	"precio_mxn" numeric(8, 2) NOT NULL,
	"areas" text,
	"ruta_id" varchar(40),
	"vigente_desde" date NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"orden" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "producto_precio_ck" CHECK ("producto"."precio_mxn" > 0),
	CONSTRAINT "producto_tipo_ck" CHECK ("producto"."tipo" in ('pase','paquete'))
);
--> statement-breakpoint
CREATE TABLE "promocion" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"examen_id" varchar(20) NOT NULL,
	"ciclo_anio" smallint NOT NULL,
	"descuento_pct" smallint NOT NULL,
	"dias_antes_examen" smallint NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "promo_pct_ck" CHECK ("promocion"."descuento_pct" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "proveedor_cuenta" (
	"id" text PRIMARY KEY NOT NULL,
	"cuenta_externa_id" text NOT NULL,
	"proveedor" text NOT NULL,
	"cuenta_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_vence" timestamp with time zone,
	"refresh_token_vence" timestamp with time zone,
	"scope" text,
	"password" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "racha" (
	"cuenta_id" text PRIMARY KEY NOT NULL,
	"actual" smallint DEFAULT 0 NOT NULL,
	"mejor" smallint DEFAULT 0 NOT NULL,
	"ultimo_dia" date,
	"proteccion_usada" date,
	"dias" text DEFAULT '' NOT NULL,
	CONSTRAINT "racha_mejor_ck" CHECK ("racha"."mejor" >= "racha"."actual")
);
--> statement-breakpoint
CREATE TABLE "reactivo" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactivo_ruta" (
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"ruta_id" varchar(40) NOT NULL,
	CONSTRAINT "reactivo_ruta_reactivo_id_version_ruta_id_pk" PRIMARY KEY("reactivo_id","version","ruta_id")
);
--> statement-breakpoint
CREATE TABLE "reactivo_version" (
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"tema_id" varchar(40) NOT NULL,
	"texto_id" varchar(20),
	"importacion_id" uuid NOT NULL,
	"origen" varchar(10) DEFAULT 'humano' NOT NULL,
	"validado_por" varchar(200) NOT NULL,
	"validado_en" date NOT NULL,
	"habilidad" varchar(30) NOT NULL,
	"dificultad_estimada" smallint NOT NULL,
	"formato" varchar(40) NOT NULL,
	"enunciado" text NOT NULL,
	"explicacion" text NOT NULL,
	"tiempo_estimado_seg" smallint NOT NULL,
	"estado" varchar(14) NOT NULL,
	"revision" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactivo_version_reactivo_id_version_pk" PRIMARY KEY("reactivo_id","version"),
	CONSTRAINT "rv_dificultad_ck" CHECK ("reactivo_version"."dificultad_estimada" between 1 and 3),
	CONSTRAINT "rv_estado_ck" CHECK ("reactivo_version"."estado" in ('borrador','revisado_ia','validado','publicado','en_revision','retirado'))
);
--> statement-breakpoint
CREATE TABLE "referencia" (
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"orden" smallint NOT NULL,
	"fuente" varchar(300) NOT NULL,
	"ubicacion" varchar(300) NOT NULL,
	CONSTRAINT "referencia_reactivo_id_version_orden_pk" PRIMARY KEY("reactivo_id","version","orden")
);
--> statement-breakpoint
CREATE TABLE "release" (
	"version" varchar(20) PRIMARY KEY NOT NULL,
	"examen_id" varchar(20) NOT NULL,
	"publicado_por" text,
	"publicado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"checksum" char(64) NOT NULL,
	"notas" text,
	"vigente" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_item" (
	"release_version" varchar(20) NOT NULL,
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	CONSTRAINT "release_item_release_version_reactivo_id_pk" PRIMARY KEY("release_version","reactivo_id")
);
--> statement-breakpoint
CREATE TABLE "reporte_error" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"cuenta_id" text,
	"motivo" text NOT NULL,
	"estado" varchar(12) DEFAULT 'abierto' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reporte_estado_ck" CHECK ("reporte_error"."estado" in ('abierto','confirmado','descartado'))
);
--> statement-breakpoint
CREATE TABLE "respuesta" (
	"intento_id" uuid NOT NULL,
	"orden" smallint NOT NULL,
	"reactivo_id" varchar(30) NOT NULL,
	"version" smallint NOT NULL,
	"opcion_id" char(1),
	"correcta" boolean DEFAULT false NOT NULL,
	"error_id" varchar(60),
	"marcada_revisar" boolean DEFAULT false NOT NULL,
	"tiempo_ms" integer,
	"id_idempotencia" uuid NOT NULL,
	"respondida_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "respuesta_intento_id_orden_pk" PRIMARY KEY("intento_id","orden"),
	CONSTRAINT "respuesta_id_idempotencia_unique" UNIQUE("id_idempotencia")
);
--> statement-breakpoint
CREATE TABLE "resultado" (
	"intento_id" uuid PRIMARY KEY NOT NULL,
	"global" numeric(5, 2),
	"nivel" varchar(24),
	"cobertura" numeric(4, 3) NOT NULL,
	"descripcion" text NOT NULL,
	"version_algoritmo" varchar(12) NOT NULL,
	"version_textos" varchar(12) NOT NULL,
	"calculado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resultado_area" (
	"intento_id" uuid NOT NULL,
	"area_id" varchar(20) NOT NULL,
	"presentados" smallint NOT NULL,
	"aciertos" smallint NOT NULL,
	"dominio" numeric(5, 4),
	"nivel" varchar(24),
	CONSTRAINT "resultado_area_intento_id_area_id_pk" PRIMARY KEY("intento_id","area_id")
);
--> statement-breakpoint
CREATE TABLE "resultado_subarea" (
	"intento_id" uuid NOT NULL,
	"subarea_id" varchar(30) NOT NULL,
	"presentados" smallint NOT NULL,
	"aciertos" smallint NOT NULL,
	"dominio" numeric(5, 4),
	"nivel" varchar(24),
	"prioridad" numeric(7, 3),
	"lugar_prioridad" smallint,
	CONSTRAINT "resultado_subarea_intento_id_subarea_id_pk" PRIMARY KEY("intento_id","subarea_id")
);
--> statement-breakpoint
CREATE TABLE "resultado_tema" (
	"intento_id" uuid NOT NULL,
	"tema_id" varchar(40) NOT NULL,
	"presentados" smallint NOT NULL,
	"aciertos" smallint NOT NULL,
	"dominio" numeric(5, 4),
	"nivel" varchar(24),
	CONSTRAINT "resultado_tema_intento_id_tema_id_pk" PRIMARY KEY("intento_id","tema_id")
);
--> statement-breakpoint
CREATE TABLE "ruta" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"examen_id" varchar(20) NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"grupos" text DEFAULT 'todas' NOT NULL,
	"es_grupo" boolean DEFAULT false NOT NULL,
	"carrera" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "seccion_intento" (
	"intento_id" uuid NOT NULL,
	"numero" smallint NOT NULL,
	"area_id" varchar(20),
	"tiempo_limite_min" smallint NOT NULL,
	"estado" varchar(12) DEFAULT 'pendiente' NOT NULL,
	"inicia_en" timestamp with time zone,
	"vence_en" timestamp with time zone,
	"terminada_en" timestamp with time zone,
	CONSTRAINT "seccion_intento_intento_id_numero_pk" PRIMARY KEY("intento_id","numero"),
	CONSTRAINT "seccion_estado_ck" CHECK ("seccion_intento"."estado" in ('pendiente','en_curso','terminada'))
);
--> statement-breakpoint
CREATE TABLE "sesion" (
	"id" text PRIMARY KEY NOT NULL,
	"vence_en" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"agente" text,
	"cuenta_id" text NOT NULL,
	CONSTRAINT "sesion_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subarea" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"area_id" varchar(20) NOT NULL,
	"nombre" varchar(160) NOT NULL,
	"reactivos_examen" smallint NOT NULL,
	"orden" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "subarea_peso_ck" CHECK ("subarea"."reactivos_examen" > 0)
);
--> statement-breakpoint
CREATE TABLE "tema" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"subarea_id" varchar(30) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"orden" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "texto" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"ambito" varchar(60) NOT NULL,
	"tipo_texto" varchar(120) NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"cuerpo" text NOT NULL,
	"es_verso" boolean DEFAULT false NOT NULL,
	"autoria" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "verificacion" (
	"id" text PRIMARY KEY NOT NULL,
	"identificador" text NOT NULL,
	"valor" text NOT NULL,
	"vence_en" timestamp with time zone NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tema_id" varchar(40) NOT NULL,
	"reactivo_id" varchar(30),
	"url" varchar(400) NOT NULL,
	"duracion_seg" smallint NOT NULL,
	"plataforma" varchar(40) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acceso" ADD CONSTRAINT "acceso_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceso" ADD CONSTRAINT "acceso_producto_sku_producto_sku_fk" FOREIGN KEY ("producto_sku") REFERENCES "public"."producto"("sku") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceso" ADD CONSTRAINT "acceso_orden_id_orden_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."orden"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area" ADD CONSTRAINT "area_examen_id_examen_id_fk" FOREIGN KEY ("examen_id") REFERENCES "public"."examen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_actor_id_cuenta_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."cuenta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ciclo_admision" ADD CONSTRAINT "ciclo_admision_examen_id_examen_id_fk" FOREIGN KEY ("examen_id") REFERENCES "public"."examen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clasificacion_semanal" ADD CONSTRAINT "clasificacion_semanal_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codigo_referido" ADD CONSTRAINT "codigo_referido_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuenta_insignia" ADD CONSTRAINT "cuenta_insignia_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuenta_insignia" ADD CONSTRAINT "cuenta_insignia_insignia_id_insignia_id_fk" FOREIGN KEY ("insignia_id") REFERENCES "public"."insignia"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuenta_rol" ADD CONSTRAINT "cuenta_rol_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enlace_compartido" ADD CONSTRAINT "enlace_compartido_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_catalogo" ADD CONSTRAINT "error_catalogo_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_frecuente" ADD CONSTRAINT "error_frecuente_intento_id_resultado_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."resultado"("intento_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_frecuente" ADD CONSTRAINT "error_frecuente_error_id_error_catalogo_id_fk" FOREIGN KEY ("error_id") REFERENCES "public"."error_catalogo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estadistica_opcion" ADD CONSTRAINT "estadistica_opcion_reactivo_id_version_opcion_id_opcion_reactivo_id_version_opcion_id_fk" FOREIGN KEY ("reactivo_id","version","opcion_id") REFERENCES "public"."opcion"("reactivo_id","version","opcion_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estadistica_reactivo" ADD CONSTRAINT "estadistica_reactivo_reactivo_id_version_reactivo_version_reactivo_id_version_fk" FOREIGN KEY ("reactivo_id","version") REFERENCES "public"."reactivo_version"("reactivo_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento_puntos" ADD CONSTRAINT "evento_puntos_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento_puntos" ADD CONSTRAINT "evento_puntos_intento_id_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."intento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacion" ADD CONSTRAINT "importacion_ejecutada_por_cuenta_id_fk" FOREIGN KEY ("ejecutada_por") REFERENCES "public"."cuenta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intento" ADD CONSTRAINT "intento_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intento" ADD CONSTRAINT "intento_plantilla_id_plantilla_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantilla"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intento" ADD CONSTRAINT "intento_release_version_release_version_fk" FOREIGN KEY ("release_version") REFERENCES "public"."release"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_intento" ADD CONSTRAINT "item_intento_intento_id_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."intento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_intento" ADD CONSTRAINT "item_intento_intento_id_seccion_seccion_intento_intento_id_numero_fk" FOREIGN KEY ("intento_id","seccion") REFERENCES "public"."seccion_intento"("intento_id","numero") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_intento" ADD CONSTRAINT "item_intento_reactivo_id_version_reactivo_version_reactivo_id_version_fk" FOREIGN KEY ("reactivo_id","version") REFERENCES "public"."reactivo_version"("reactivo_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opcion" ADD CONSTRAINT "opcion_error_id_error_catalogo_id_fk" FOREIGN KEY ("error_id") REFERENCES "public"."error_catalogo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opcion" ADD CONSTRAINT "opcion_reactivo_id_version_reactivo_version_reactivo_id_version_fk" FOREIGN KEY ("reactivo_id","version") REFERENCES "public"."reactivo_version"("reactivo_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden" ADD CONSTRAINT "orden_beneficiario_id_cuenta_id_fk" FOREIGN KEY ("beneficiario_id") REFERENCES "public"."cuenta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden" ADD CONSTRAINT "orden_enlace_id_enlace_compartido_id_fk" FOREIGN KEY ("enlace_id") REFERENCES "public"."enlace_compartido"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden" ADD CONSTRAINT "orden_producto_sku_producto_sku_fk" FOREIGN KEY ("producto_sku") REFERENCES "public"."producto"("sku") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden" ADD CONSTRAINT "orden_cupon_codigo_cupon_codigo_fk" FOREIGN KEY ("cupon_codigo") REFERENCES "public"."cupon"("codigo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden" ADD CONSTRAINT "orden_referido_codigo_codigo_referido_codigo_fk" FOREIGN KEY ("referido_codigo") REFERENCES "public"."codigo_referido"("codigo") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden" ADD CONSTRAINT "orden_promocion_id_promocion_id_fk" FOREIGN KEY ("promocion_id") REFERENCES "public"."promocion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago" ADD CONSTRAINT "pago_orden_id_orden_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."orden"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_alumno" ADD CONSTRAINT "perfil_alumno_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_alumno" ADD CONSTRAINT "perfil_alumno_ruta_id_ruta_id_fk" FOREIGN KEY ("ruta_id") REFERENCES "public"."ruta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_alumno" ADD CONSTRAINT "perfil_alumno_examen_id_examen_id_fk" FOREIGN KEY ("examen_id") REFERENCES "public"."examen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_alumno" ADD CONSTRAINT "perfil_alumno_examen_id_ciclo_anio_ciclo_admision_examen_id_anio_fk" FOREIGN KEY ("examen_id","ciclo_anio") REFERENCES "public"."ciclo_admision"("examen_id","anio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla" ADD CONSTRAINT "plantilla_ruta_id_ruta_id_fk" FOREIGN KEY ("ruta_id") REFERENCES "public"."ruta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla_reactivo" ADD CONSTRAINT "plantilla_reactivo_plantilla_id_plantilla_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantilla"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla_reactivo" ADD CONSTRAINT "plantilla_reactivo_reactivo_id_reactivo_id_fk" FOREIGN KEY ("reactivo_id") REFERENCES "public"."reactivo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla_reactivo" ADD CONSTRAINT "plantilla_reactivo_plantilla_id_seccion_plantilla_seccion_plantilla_id_numero_fk" FOREIGN KEY ("plantilla_id","seccion") REFERENCES "public"."plantilla_seccion"("plantilla_id","numero") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla_seccion" ADD CONSTRAINT "plantilla_seccion_plantilla_id_plantilla_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantilla"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla_seccion" ADD CONSTRAINT "plantilla_seccion_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferencia_contacto" ADD CONSTRAINT "preferencia_contacto_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_ruta_id_ruta_id_fk" FOREIGN KEY ("ruta_id") REFERENCES "public"."ruta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_examen_id_ciclo_anio_ciclo_admision_examen_id_anio_fk" FOREIGN KEY ("examen_id","ciclo_anio") REFERENCES "public"."ciclo_admision"("examen_id","anio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promocion" ADD CONSTRAINT "promocion_examen_id_ciclo_anio_ciclo_admision_examen_id_anio_fk" FOREIGN KEY ("examen_id","ciclo_anio") REFERENCES "public"."ciclo_admision"("examen_id","anio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_cuenta" ADD CONSTRAINT "proveedor_cuenta_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racha" ADD CONSTRAINT "racha_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactivo_ruta" ADD CONSTRAINT "reactivo_ruta_ruta_id_ruta_id_fk" FOREIGN KEY ("ruta_id") REFERENCES "public"."ruta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactivo_ruta" ADD CONSTRAINT "reactivo_ruta_reactivo_id_version_reactivo_version_reactivo_id_version_fk" FOREIGN KEY ("reactivo_id","version") REFERENCES "public"."reactivo_version"("reactivo_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactivo_version" ADD CONSTRAINT "reactivo_version_reactivo_id_reactivo_id_fk" FOREIGN KEY ("reactivo_id") REFERENCES "public"."reactivo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactivo_version" ADD CONSTRAINT "reactivo_version_tema_id_tema_id_fk" FOREIGN KEY ("tema_id") REFERENCES "public"."tema"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactivo_version" ADD CONSTRAINT "reactivo_version_texto_id_texto_id_fk" FOREIGN KEY ("texto_id") REFERENCES "public"."texto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactivo_version" ADD CONSTRAINT "reactivo_version_importacion_id_importacion_id_fk" FOREIGN KEY ("importacion_id") REFERENCES "public"."importacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referencia" ADD CONSTRAINT "referencia_reactivo_id_version_reactivo_version_reactivo_id_version_fk" FOREIGN KEY ("reactivo_id","version") REFERENCES "public"."reactivo_version"("reactivo_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release" ADD CONSTRAINT "release_examen_id_examen_id_fk" FOREIGN KEY ("examen_id") REFERENCES "public"."examen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release" ADD CONSTRAINT "release_publicado_por_cuenta_id_fk" FOREIGN KEY ("publicado_por") REFERENCES "public"."cuenta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_item" ADD CONSTRAINT "release_item_release_version_release_version_fk" FOREIGN KEY ("release_version") REFERENCES "public"."release"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_item" ADD CONSTRAINT "release_item_reactivo_id_version_reactivo_version_reactivo_id_version_fk" FOREIGN KEY ("reactivo_id","version") REFERENCES "public"."reactivo_version"("reactivo_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporte_error" ADD CONSTRAINT "reporte_error_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporte_error" ADD CONSTRAINT "reporte_error_reactivo_id_version_reactivo_version_reactivo_id_version_fk" FOREIGN KEY ("reactivo_id","version") REFERENCES "public"."reactivo_version"("reactivo_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_error_id_error_catalogo_id_fk" FOREIGN KEY ("error_id") REFERENCES "public"."error_catalogo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_intento_id_orden_item_intento_intento_id_orden_fk" FOREIGN KEY ("intento_id","orden") REFERENCES "public"."item_intento"("intento_id","orden") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_reactivo_id_version_opcion_id_opcion_reactivo_id_version_opcion_id_fk" FOREIGN KEY ("reactivo_id","version","opcion_id") REFERENCES "public"."opcion"("reactivo_id","version","opcion_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado" ADD CONSTRAINT "resultado_intento_id_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."intento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado_area" ADD CONSTRAINT "resultado_area_intento_id_resultado_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."resultado"("intento_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado_area" ADD CONSTRAINT "resultado_area_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado_subarea" ADD CONSTRAINT "resultado_subarea_intento_id_resultado_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."resultado"("intento_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado_subarea" ADD CONSTRAINT "resultado_subarea_subarea_id_subarea_id_fk" FOREIGN KEY ("subarea_id") REFERENCES "public"."subarea"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado_tema" ADD CONSTRAINT "resultado_tema_intento_id_resultado_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."resultado"("intento_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado_tema" ADD CONSTRAINT "resultado_tema_tema_id_tema_id_fk" FOREIGN KEY ("tema_id") REFERENCES "public"."tema"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruta" ADD CONSTRAINT "ruta_examen_id_examen_id_fk" FOREIGN KEY ("examen_id") REFERENCES "public"."examen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seccion_intento" ADD CONSTRAINT "seccion_intento_intento_id_intento_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."intento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seccion_intento" ADD CONSTRAINT "seccion_intento_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_cuenta_id_cuenta_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuenta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subarea" ADD CONSTRAINT "subarea_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tema" ADD CONSTRAINT "tema_subarea_id_subarea_id_fk" FOREIGN KEY ("subarea_id") REFERENCES "public"."subarea"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_tema_id_tema_id_fk" FOREIGN KEY ("tema_id") REFERENCES "public"."tema"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_reactivo_id_reactivo_id_fk" FOREIGN KEY ("reactivo_id") REFERENCES "public"."reactivo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "acceso_prueba_uk" ON "acceso" USING btree ("cuenta_id") WHERE "acceso"."origen" = 'prueba';--> statement-breakpoint
CREATE UNIQUE INDEX "cuenta_correo_uk" ON "cuenta" USING btree (lower("correo"));--> statement-breakpoint
CREATE INDEX "evento_puntos_cuenta_ix" ON "evento_puntos" USING btree ("cuenta_id","fecha");--> statement-breakpoint
CREATE UNIQUE INDEX "importacion_checksum_uk" ON "importacion" USING btree ("checksum") WHERE "importacion"."estado" = 'aceptada';--> statement-breakpoint
CREATE INDEX "intento_cuenta_ix" ON "intento" USING btree ("cuenta_id","enviado_en");--> statement-breakpoint
CREATE INDEX "item_intento_reactivo_ix" ON "item_intento" USING btree ("reactivo_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "perfil_alias_uk" ON "perfil_alumno" USING btree (lower("alias"));--> statement-breakpoint
CREATE UNIQUE INDEX "plantilla_reactivo_orden_uk" ON "plantilla_reactivo" USING btree ("plantilla_id","orden");--> statement-breakpoint
CREATE INDEX "proveedor_cuenta_ix" ON "proveedor_cuenta" USING btree ("cuenta_id");--> statement-breakpoint
CREATE INDEX "reactivo_version_estado_ix" ON "reactivo_version" USING btree ("estado","tema_id");--> statement-breakpoint
CREATE INDEX "sesion_cuenta_ix" ON "sesion" USING btree ("cuenta_id");
ALTER TABLE "clasificacion_semanal" ADD COLUMN "mejor_racha_aciertos" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "racha" ADD COLUMN "aciertos_seguidos" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "racha" ADD COLUMN "mejor_aciertos" smallint DEFAULT 0 NOT NULL;
-- Insignias con nombres neutrales: sirven igual para Derecho que para Ingeniería.
UPDATE "insignia" SET "nombre" = 'Punto de partida', "descripcion" = 'Terminaste tu primer diagnóstico completo.', "icono" = 'flag' WHERE "id" = 'primer-diagnostico';
--> statement-breakpoint
UPDATE "insignia" SET "nombre" = 'Primer paso', "descripcion" = 'Cerraste tu primera sección de diagnóstico.', "icono" = 'footprints' WHERE "id" = 'primera-seccion';
--> statement-breakpoint
UPDATE "insignia" SET "nombre" = 'Meta del día', "descripcion" = 'Respondiste 10 preguntas de práctica en un día.', "icono" = 'target' WHERE "id" = 'dosis-completa';
--> statement-breakpoint
UPDATE "insignia" SET "nombre" = 'Subiendo de nivel', "descripcion" = 'Una subárea subió de nivel entre dos diagnósticos.', "icono" = 'trending-up' WHERE "id" = 'subarea-sube';
--> statement-breakpoint
UPDATE "insignia" SET "nombre" = 'Error superado', "descripcion" = 'Un error que se te repetía dejó de aparecer.', "icono" = 'badge-check' WHERE "id" = 'error-corregido';
--> statement-breakpoint
UPDATE "insignia" SET "nombre" = 'Tema dominado', "descripcion" = 'Acertaste 5 seguidas del mismo tema en práctica.', "icono" = 'award' WHERE "id" = 'tema-dominado';
--> statement-breakpoint
UPDATE "insignia" SET "nombre" = 'Semana completa', "descripcion" = 'Estudiaste 7 días seguidos.', "icono" = 'flame' WHERE "id" = 'racha-7';

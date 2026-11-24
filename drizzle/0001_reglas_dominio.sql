-- D3: cada versión tiene exactamente 3 opciones y exactamente una correcta.
-- Se verifica al confirmar la transacción (disparador diferido).
CREATE OR REPLACE FUNCTION verificar_opciones_d3() RETURNS trigger AS $$
DECLARE total int; correctas int;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE correcta)
    INTO total, correctas
    FROM opcion WHERE reactivo_id = NEW.reactivo_id AND version = NEW.version;
  IF total <> 3 OR correctas <> 1 THEN
    RAISE EXCEPTION 'D3: el reactivo % v% debe tener 3 opciones y una correcta (tiene % y %)',
      NEW.reactivo_id, NEW.version, total, correctas;
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER opcion_d3
  AFTER INSERT OR UPDATE ON opcion
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION verificar_opciones_d3();
--> statement-breakpoint
-- D18: los puntos son un registro de solo inserción; el acierto solo viene de práctica.
CREATE OR REPLACE FUNCTION evento_puntos_d18() RETURNS trigger AS $$
DECLARE m varchar;
BEGIN
  IF TG_OP <> 'INSERT' AND current_setting('app.arco', true) IS DISTINCT FROM 'si' THEN
    RAISE EXCEPTION 'D18: evento_puntos es de solo inserción';
  END IF;
  IF TG_OP = 'INSERT' AND NEW.motivo = 'acierto' THEN
    SELECT modo INTO m FROM intento WHERE id = NEW.intento_id;
    IF m IS DISTINCT FROM 'practica' THEN
      RAISE EXCEPTION 'D18: un acierto solo da puntos en modo práctica';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER evento_puntos_d18_ins BEFORE INSERT ON evento_puntos
  FOR EACH ROW EXECUTE FUNCTION evento_puntos_d18();
--> statement-breakpoint
CREATE TRIGGER evento_puntos_d18_upd BEFORE UPDATE ON evento_puntos
  FOR EACH ROW EXECUTE FUNCTION evento_puntos_d18();
--> statement-breakpoint
-- D8: no se aceptan respuestas en un intento enviado.
CREATE OR REPLACE FUNCTION respuesta_d8() RETURNS trigger AS $$
DECLARE e varchar;
BEGIN
  SELECT estado INTO e FROM intento WHERE id = NEW.intento_id;
  IF e <> 'en_curso' THEN
    RAISE EXCEPTION 'D8: el intento ya no acepta respuestas';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER respuesta_d8 BEFORE INSERT OR UPDATE ON respuesta
  FOR EACH ROW EXECUTE FUNCTION respuesta_d8();

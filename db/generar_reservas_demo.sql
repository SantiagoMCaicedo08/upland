-- Genera reservas de demostración sobre los alojamientos importados, para que el filtro por
-- fechas tenga contra qué trabajar y su medición sea realista. Son datos inventados: ni las
-- reservas ni los huéspedes vienen del dataset.
--
--   docker cp db/generar_reservas_demo.sql upland-postgres:/tmp/generar_reservas_demo.sql
--   docker exec upland-postgres psql -U upland -d upland -f /tmp/generar_reservas_demo.sql
--
-- Se ejecuta después de db/importar_bogota.sql. Si ya hay reservas de demostración no hace
-- nada, así que repetirlo no duplica.

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

BEGIN;

-- Con la misma semilla, random() produce siempre la misma secuencia: el resultado es
-- reproducible y las mediciones se pueden repetir sobre los mismos datos.
SELECT setseed(0.42);

-- 300 huéspedes ficticios. Como los anfitriones importados, no pueden iniciar sesión.
INSERT INTO usuarios (nombre, email, password_hash, rol)
SELECT 'Huésped de prueba ' || n, 'huesped.' || n || '@importado.upland.test', '!', 'HUESPED'
FROM generate_series(1, 300) AS n
ON CONFLICT DO NOTHING;

-- Para cada alojamiento importado se recorren 6 ventanas de 30 días a partir de hoy. En
-- cada ventana hay un 55 % de probabilidad de una estadía de 2 a 7 noches que empieza en
-- los primeros 20 días. Como 20 + 7 < 30, dos estadías del mismo alojamiento nunca se
-- cruzan; y si se cruzaran, la restricción ex_reservas_sin_solape rechazaría el INSERT.
INSERT INTO reservas (alojamiento_id, huesped_id, fecha_entrada, fecha_salida, valor_total, estado)
SELECT s.alojamiento_id,
       h.id,
       s.entrada,
       s.entrada + s.noches,
       s.precio_noche * s.noches,
       'CONFIRMADA'
FROM (
    SELECT a.id AS alojamiento_id,
           a.precio_noche,
           current_date + 3 + ventana * 30 + floor(random() * 20)::integer AS entrada,
           2 + floor(random() * 6)::integer AS noches,
           1 + floor(random() * 300)::integer AS numero_huesped,
           random() AS sorteo
    FROM alojamientos a
    CROSS JOIN generate_series(0, 5) AS ventana
    WHERE a.origen_id IS NOT NULL
) AS s
JOIN usuarios h ON h.email = 'huesped.' || s.numero_huesped || '@importado.upland.test'
WHERE s.sorteo < 0.55
  AND NOT EXISTS (
      SELECT 1 FROM reservas r
      JOIN usuarios u ON u.id = r.huesped_id
      WHERE u.email LIKE 'huesped.%@importado.upland.test');

COMMIT;

SELECT count(*) AS reservas, count(DISTINCT alojamiento_id) AS alojamientos_con_reservas,
       min(fecha_entrada) AS primera_entrada, max(fecha_salida) AS ultima_salida
FROM reservas;

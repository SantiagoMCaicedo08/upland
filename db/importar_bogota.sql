-- Importa a Upland los alojamientos reales de Bogotá publicados por Inside Airbnb
-- (https://insideairbnb.com, licencia Creative Commons Attribution 4.0), corte 2026-09-14.
--
-- No es una migración de Flyway: son datos, no esquema, y se cargan a mano.
--
--   1. Descargar listings.csv.gz de Bogotá desde https://insideairbnb.com/get-the-data/
--      y descomprimirlo como datos/insideairbnb/listings.csv
--   2. docker cp datos/insideairbnb/listings.csv upland-postgres:/tmp/listings.csv
--   3. docker cp db/importar_bogota.sql upland-postgres:/tmp/importar_bogota.sql
--   4. docker exec upland-postgres psql -U upland -d upland -f /tmp/importar_bogota.sql
--
-- Se puede repetir: los alojamientos llevan origen_id y los anfitriones un email derivado
-- del id de origen, así ON CONFLICT omite lo que ya existe.
--
-- Privacidad: los anfitriones del dataset son personas reales. No se importan sus nombres
-- ni sus fotos; cada uno se reemplaza por un usuario con nombre ficticio.

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

BEGIN;

-- Tabla de carga con las 90 columnas del CSV, todas como texto y en el mismo orden del
-- archivo. La limpieza y la conversión de tipos se hacen después, en el INSERT.
CREATE TEMP TABLE carga (
    id text, listing_url text, scrape_id text, last_scraped text, source text, name text,
    description text, neighborhood_overview text, picture_url text, host_id text,
    host_url text, host_profile_id text, host_profile_url text, host_name text,
    host_since text, hosts_time_as_user_years text, hosts_time_as_user_months text,
    hosts_time_as_host_years text, hosts_time_as_host_months text, host_location text,
    host_about text, host_response_time text, host_response_rate text,
    host_acceptance_rate text, host_is_superhost text, host_thumbnail_url text,
    host_picture_url text, host_neighbourhood text, host_listings_count text,
    host_total_listings_count text, host_verifications text, host_has_profile_pic text,
    host_identity_verified text, neighbourhood text, neighbourhood_cleansed text,
    neighbourhood_group_cleansed text, latitude text, longitude text, property_type text,
    room_type text, accommodates text, bathrooms text, bathrooms_text text, bedrooms text,
    beds text, amenities text, price text, price_quote_checkin_date text,
    price_quote_checkout_date text, price_quote_total_price text,
    price_quote_price_per_night text, price_quote_raw text, minimum_nights text,
    maximum_nights text, minimum_minimum_nights text, maximum_minimum_nights text,
    minimum_maximum_nights text, maximum_maximum_nights text, minimum_nights_avg_ntm text,
    maximum_nights_avg_ntm text, calendar_updated text, has_availability text,
    availability_30 text, availability_60 text, availability_90 text, availability_365 text,
    calendar_last_scraped text, number_of_reviews text, number_of_reviews_ltm text,
    number_of_reviews_l30d text, availability_eoy text, number_of_reviews_ly text,
    estimated_occupancy_l365d text, estimated_revenue_l365d text, first_review text,
    last_review text, review_scores_rating text, review_scores_accuracy text,
    review_scores_cleanliness text, review_scores_checkin text,
    review_scores_communication text, review_scores_location text, review_scores_value text,
    license text, instant_bookable text, calculated_host_listings_count text,
    calculated_host_listings_count_entire_homes text,
    calculated_host_listings_count_private_rooms text,
    calculated_host_listings_count_shared_rooms text, reviews_per_month text
) ON COMMIT DROP;

\copy carga FROM '/tmp/listings.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- El dataset trae miles de servicios distintos, en inglés. Solo se conservan los que
-- sirven para filtrar, con el nombre que verá el usuario.
CREATE TEMP TABLE servicios_origen (original text PRIMARY KEY, servicio text NOT NULL) ON COMMIT DROP;
INSERT INTO servicios_origen VALUES
    ('Wifi', 'Wifi'),
    ('Kitchen', 'Cocina'),
    ('Hot water', 'Agua caliente'),
    ('TV', 'TV'),
    ('Dedicated workspace', 'Zona de trabajo'),
    ('Washer', 'Lavadora'),
    ('Dryer', 'Secadora'),
    ('Elevator', 'Ascensor'),
    ('Pets allowed', 'Mascotas permitidas'),
    ('Free parking on premises', 'Parqueadero'),
    ('Paid parking on premises', 'Parqueadero'),
    ('Self check-in', 'Llegada autónoma'),
    ('Exercise equipment', 'Gimnasio'),
    ('Gym', 'Gimnasio'),
    ('BBQ grill', 'Asador'),
    ('Air conditioning', 'Aire acondicionado'),
    ('Heating', 'Calefacción'),
    ('Pool', 'Piscina'),
    ('Hot tub', 'Jacuzzi'),
    ('Breakfast', 'Desayuno'),
    ('Private entrance', 'Entrada independiente');

-- Un usuario ficticio por cada anfitrión de origen. El nombre se elige con un hash del id,
-- así el mismo anfitrión recibe siempre el mismo nombre. El password_hash '!' no es un hash
-- BCrypt válido: nadie puede iniciar sesión con estas cuentas.
INSERT INTO usuarios (nombre, email, password_hash, rol)
SELECT
    (ARRAY['Andrés', 'Camila', 'Felipe', 'Valentina', 'Julián', 'Daniela', 'Sebastián', 'Mariana',
           'Nicolás', 'Paula', 'Esteban', 'Carolina', 'Mateo', 'Natalia', 'David', 'Juliana',
           'Santiago', 'Lucía', 'Tomás', 'Gabriela'])[1 + (hashtext(host_id)::bigint & 2147483647) % 20]
    || ' ' ||
    (ARRAY['Rodríguez', 'Gómez', 'Martínez', 'López', 'Hernández', 'Ramírez', 'Torres', 'Vargas',
           'Castro', 'Moreno', 'Rojas', 'Jiménez', 'Ortiz', 'Suárez', 'Mendoza', 'Cárdenas',
           'Parra', 'Salazar', 'Acosta', 'Pineda'])[1 + (hashtext('apellido' || host_id)::bigint & 2147483647) % 20],
    'anfitrion.' || host_id || '@importado.upland.test',
    '!',
    'ANFITRION'
FROM (SELECT DISTINCT host_id FROM carga) AS anfitriones
ON CONFLICT DO NOTHING;

INSERT INTO alojamientos (anfitrion_id, titulo, descripcion, ciudad, zona, direccion, latitud, longitud,
                          capacidad, precio_noche, tipo, habitaciones, camas, banos, servicios, foto_url,
                          calificacion, numero_resenas, origen_id, fecha_creacion)
SELECT
    u.id,
    left(c.name, 150),
    -- Las descripciones traen <br /> y algunas etiquetas HTML: los saltos se conservan como
    -- saltos de línea y el resto de etiquetas se elimina.
    regexp_replace(
        regexp_replace(coalesce(nullif(c.description, ''), c.name), '<br\s*/?>', E'\n', 'gi'),
        '<[^>]+>', '', 'g'),
    'Bogotá',
    c.neighbourhood_cleansed,
    -- El dataset no publica direcciones exactas, solo la zona y unas coordenadas aproximadas.
    c.neighbourhood_cleansed || ', Bogotá',
    c.latitude::double precision,
    c.longitude::double precision,
    c.accommodates::integer,
    round(p.precio),
    CASE c.room_type
        WHEN 'Entire home/apt' THEN 'ALOJAMIENTO_ENTERO'
        WHEN 'Private room' THEN 'HABITACION_PRIVADA'
        WHEN 'Shared room' THEN 'HABITACION_COMPARTIDA'
        ELSE 'HOTEL'
    END,
    nullif(c.bedrooms, '')::numeric::integer,
    nullif(c.beds, '')::numeric::integer,
    -- "1.5 baths", "2 shared baths", "Half-bath"...
    CASE
        WHEN c.bathrooms_text ILIKE '%half%' THEN 0.5
        ELSE substring(c.bathrooms_text FROM '^[0-9]+\.?[0-9]*')::numeric
    END,
    ARRAY(SELECT DISTINCT s.servicio
          FROM servicios_origen s
          WHERE c.amenities::jsonb ? s.original
          ORDER BY s.servicio),
    c.picture_url,
    nullif(c.review_scores_rating, '')::numeric,
    c.number_of_reviews::integer,
    'insideairbnb:' || c.id,
    -- Fechas escalonadas hacia atrás, para que el orden por fecha de creación sea estable
    -- y los alojamientos creados en Upland sigan apareciendo primero.
    now() - interval '30 days' - (row_number() OVER (ORDER BY c.number_of_reviews::integer DESC, c.id)) * interval '1 minute'
FROM carga c
JOIN usuarios u ON u.email = 'anfitrion.' || c.host_id || '@importado.upland.test'
CROSS JOIN LATERAL (
    SELECT replace(replace(nullif(c.price, ''), '$', ''), ',', '')::numeric AS precio
) p
-- Se descartan los alojamientos sin precio y los precios absurdos del dataset (hay filas con
-- cientos de millones por noche).
WHERE p.precio BETWEEN 15000 AND 3000000
  AND c.accommodates::integer > 0
ON CONFLICT (origen_id) DO NOTHING;

COMMIT;

SELECT count(*) FILTER (WHERE origen_id IS NOT NULL) AS importados,
       count(*) FILTER (WHERE origen_id IS NULL)     AS propios
FROM alojamientos;

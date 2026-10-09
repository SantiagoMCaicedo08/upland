-- Datos de demostración. No es una migración de Flyway: se carga a mano y solo en
-- desarrollo, para que la demo no empiece con pantallas vacías.
--
--   docker cp db/semilla.sql upland-postgres:/tmp/semilla.sql
--   docker exec upland-postgres psql -U upland -d upland -f /tmp/semilla.sql
--
-- Se puede ejecutar varias veces: los ids son fijos y ON CONFLICT DO NOTHING omite lo que
-- ya existe. La contraseña de todos los usuarios es "upland123"; lo que se guarda es su hash
-- BCrypt, generado por la propia aplicación.

SET client_encoding = 'UTF8';

INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
    ('11111111-1111-4111-8111-111111111111', 'Ana Rojas',    'ana@upland.test',    '$2a$10$0R0obudeRH/kZS8JqVurwOifzuK6tXStRzSS9OtmpDJ70W3UZ1Hpe', 'ANFITRION'),
    ('22222222-2222-4222-8222-222222222222', 'Carlos Pinto', 'carlos@upland.test', '$2a$10$0R0obudeRH/kZS8JqVurwOifzuK6tXStRzSS9OtmpDJ70W3UZ1Hpe', 'ANFITRION'),
    ('33333333-3333-4333-8333-333333333333', 'Laura Gómez',  'laura@upland.test',  '$2a$10$0R0obudeRH/kZS8JqVurwOifzuK6tXStRzSS9OtmpDJ70W3UZ1Hpe', 'HUESPED'),
    ('44444444-4444-4444-8444-444444444444', 'Pedro Díaz',   'pedro@upland.test',  '$2a$10$0R0obudeRH/kZS8JqVurwOifzuK6tXStRzSS9OtmpDJ70W3UZ1Hpe', 'HUESPED')
ON CONFLICT DO NOTHING;

-- Las fechas van escalonadas para que el orden del catálogo (más reciente primero) sea
-- siempre el mismo.
INSERT INTO alojamientos (id, anfitrion_id, titulo, descripcion, ciudad, direccion, latitud, longitud, capacidad, precio_noche, fecha_creacion) VALUES
    ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
     'Casa colonial con patio en Barichara',
     'Casa de tapia pisada a dos cuadras del parque principal. Patio interior con hamacas, cocina equipada y tres habitaciones.',
     'Barichara', 'Calle 6 # 8-21', 6.6370, -73.2230, 6, 380000, now() - interval '1 day'),
    ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
     'Cabaña con vista al cañón del Chicamocha',
     'Cabaña de madera al borde del cañón. Terraza con chimenea exterior y desayuno incluido.',
     'Mesa de los Santos', 'Vereda El Tabacal, km 12', 6.7900, -73.0500, 4, 290000, now() - interval '2 days'),
    ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
     'Apartamento moderno en Cabecera',
     'Apartamento en piso octavo con balcón, wifi de fibra y parqueadero cubierto. Cerca de restaurantes y centros comerciales.',
     'Bucaramanga', 'Carrera 35 # 48-65, apto 802', 7.1170, -73.1100, 3, 180000, now() - interval '3 days'),
    ('a0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
     'Habitación privada cerca de la UIS',
     'Habitación con baño privado en casa familiar, a cinco minutos caminando de la universidad.',
     'Bucaramanga', 'Calle 9 # 27-40', NULL, NULL, 1, 65000, now() - interval '4 days'),
    ('a0000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222',
     'Finca cafetera con piscina',
     'Finca para grupos grandes con piscina, zona de asados y recorrido por el cultivo de café.',
     'San Gil', 'Vereda Ojo de Agua, km 3 vía a Charalá', 6.5200, -73.1300, 10, 520000, now() - interval '5 days'),
    ('a0000000-0000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222',
     'Hostal para aventureros junto al río Fonce',
     'Habitación doble en hostal con salida directa a los operadores de rafting y parapente.',
     'San Gil', 'Carrera 11 # 4-18', 6.5550, -73.1340, 2, 95000, now() - interval '6 days'),
    ('a0000000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222',
     'Casa de piedra en Guane',
     'Casa restaurada en el corregimiento de Guane, al final del Camino Real. Ideal para descansar sin ruido.',
     'Barichara', 'Calle 3 # 5-12, Guane', NULL, NULL, 5, 310000, now() - interval '7 days'),
    ('a0000000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222',
     'Glamping bajo las estrellas',
     'Domo para dos personas con cama doble, baño privado y vista abierta al cielo de la Mesa.',
     'Mesa de los Santos', 'Km 22 vía Los Santos', 6.8400, -73.0900, 2, 240000, now() - interval '8 days')
ON CONFLICT DO NOTHING;

-- Atributos que hacen falta para un catálogo con filtros: tipo, zona, habitaciones, camas,
-- baños, servicios, foto y calificación. Todas las columnas son opcionales o tienen valor
-- por defecto, de modo que las filas y el CRUD que ya existían siguen siendo válidos.

ALTER TABLE alojamientos
    ADD COLUMN tipo           varchar(30)  NOT NULL DEFAULT 'ALOJAMIENTO_ENTERO',
    -- Barrio o localidad dentro de la ciudad.
    ADD COLUMN zona           varchar(100),
    ADD COLUMN habitaciones   integer,
    ADD COLUMN camas          integer,
    -- Admite medios baños: 1.5 es un baño completo y uno sin ducha.
    ADD COLUMN banos          numeric(3,1),
    -- Arreglo de textos y no una tabla aparte: los servicios solo se leen y se filtran
    -- junto con su alojamiento, y un índice GIN resuelve "tiene todos estos servicios".
    ADD COLUMN servicios      text[]       NOT NULL DEFAULT '{}',
    ADD COLUMN foto_url       varchar(500),
    -- Promedio y cantidad de reseñas. Hoy vienen del dataset importado; cuando exista la
    -- tabla resenas pasarán a calcularse desde ella.
    ADD COLUMN calificacion   numeric(3,2),
    ADD COLUMN numero_resenas integer      NOT NULL DEFAULT 0,
    -- Identificador en la fuente externa (por ejemplo 'insideairbnb:12345'). Permite repetir
    -- la importación sin duplicar filas. Es NULL en los alojamientos creados en Upland.
    ADD COLUMN origen_id      varchar(60),

    ADD CONSTRAINT ck_alojamientos_tipo
        CHECK (tipo IN ('ALOJAMIENTO_ENTERO', 'HABITACION_PRIVADA', 'HABITACION_COMPARTIDA', 'HOTEL')),
    ADD CONSTRAINT ck_alojamientos_habitaciones CHECK (habitaciones >= 0),
    ADD CONSTRAINT ck_alojamientos_camas CHECK (camas >= 0),
    ADD CONSTRAINT ck_alojamientos_banos CHECK (banos >= 0),
    ADD CONSTRAINT ck_alojamientos_calificacion CHECK (calificacion BETWEEN 0 AND 5),
    ADD CONSTRAINT ck_alojamientos_numero_resenas CHECK (numero_resenas >= 0),
    ADD CONSTRAINT uq_alojamientos_origen UNIQUE (origen_id);

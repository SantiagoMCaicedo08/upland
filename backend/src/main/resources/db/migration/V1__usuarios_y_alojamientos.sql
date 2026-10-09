-- Usuarios y alojamientos: las tablas que tienen código en la entrega 1.
-- Reservas, bloqueos, reseñas y pagos están en el documento de diseño y reciben su
-- migración cuando se construya su módulo.

CREATE TABLE usuarios (
    -- El DEFAULT permite que los datos semilla y los INSERT manuales no inventen ids.
    id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre         varchar(120) NOT NULL,
    email          varchar(255) NOT NULL,
    -- BCrypt produce 60 caracteres; el margen permite cambiar de algoritmo sin migrar.
    password_hash  varchar(100) NOT NULL,
    rol            varchar(20)  NOT NULL,
    activo         boolean      NOT NULL DEFAULT true,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uq_usuarios_email UNIQUE (email),
    -- El servicio guarda el email en minúsculas. Sin este CHECK, 'Ana@x.com' y 'ana@x.com'
    -- pasarían la restricción UNIQUE como dos cuentas distintas.
    CONSTRAINT ck_usuarios_email_minusculas CHECK (email = lower(email)),
    -- varchar + CHECK en vez de un tipo ENUM de PostgreSQL: agregar un rol es una
    -- migración corriente y JPA lo mapea con @Enumerated(STRING) sin conversores.
    CONSTRAINT ck_usuarios_rol CHECK (rol IN ('HUESPED', 'ANFITRION', 'ADMIN'))
);

CREATE TABLE alojamientos (
    id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    anfitrion_id   uuid          NOT NULL,
    titulo         varchar(150)  NOT NULL,
    descripcion    text          NOT NULL,
    ciudad         varchar(100)  NOT NULL,
    direccion      varchar(255)  NOT NULL,
    -- Opcionales: el anfitrión puede no conocer las coordenadas. double precision porque
    -- son mediciones, no cantidades exactas como el dinero.
    latitud        double precision,
    longitud       double precision,
    capacidad      integer       NOT NULL,
    precio_noche   numeric(12,2) NOT NULL,
    activo         boolean       NOT NULL DEFAULT true,
    fecha_creacion timestamptz   NOT NULL DEFAULT now(),

    -- Sin ON DELETE CASCADE: los usuarios no se borran, se desactivan.
    CONSTRAINT fk_alojamientos_anfitrion FOREIGN KEY (anfitrion_id) REFERENCES usuarios (id),
    CONSTRAINT ck_alojamientos_capacidad CHECK (capacidad > 0),
    CONSTRAINT ck_alojamientos_precio CHECK (precio_noche > 0),
    CONSTRAINT ck_alojamientos_latitud CHECK (latitud BETWEEN -90 AND 90),
    CONSTRAINT ck_alojamientos_longitud CHECK (longitud BETWEEN -180 AND 180),
    CONSTRAINT ck_alojamientos_coordenadas_juntas CHECK ((latitud IS NULL) = (longitud IS NULL))
);

-- PostgreSQL no indexa las claves foráneas por sí solo. Este índice sirve a la consulta
-- "mis alojamientos" de un anfitrión.
CREATE INDEX idx_alojamientos_anfitrion ON alojamientos (anfitrion_id);

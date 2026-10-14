-- Una factura por reserva. Se numera V5 y no V3 porque la fase 2 ya usa V3 y V4: así la
-- misma migración sirve en las dos ramas sin chocar. Flyway acepta el salto de V2 a V5.

-- La factura guarda una copia de los datos del momento en que se emitió: nombres,
-- alojamiento, fechas y precio. Así no cambia si después el anfitrión edita el alojamiento
-- o alguien cambia su nombre, que es lo que se espera de un documento ya emitido.
CREATE TABLE facturas (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Consecutivo. IDENTITY es una secuencia de PostgreSQL: no bloquea a nadie, pero si una
    -- transacción toma un número y después falla, ese número se pierde y queda un hueco.
    numero             bigint        GENERATED ALWAYS AS IDENTITY,
    reserva_id         uuid          NOT NULL,
    huesped_id         uuid          NOT NULL,
    anfitrion_id       uuid          NOT NULL,
    huesped_nombre     varchar(120)  NOT NULL,
    huesped_email      varchar(255)  NOT NULL,
    anfitrion_nombre   varchar(120)  NOT NULL,
    anfitrion_email    varchar(255)  NOT NULL,
    alojamiento_titulo varchar(150)  NOT NULL,
    alojamiento_ciudad varchar(100)  NOT NULL,
    fecha_entrada      date          NOT NULL,
    fecha_salida       date          NOT NULL,
    noches             integer       NOT NULL,
    precio_noche       numeric(12,2) NOT NULL,
    total              numeric(12,2) NOT NULL,
    fecha_emision      timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT uq_facturas_numero UNIQUE (numero),
    -- Una reserva tiene como máximo una factura.
    CONSTRAINT uq_facturas_reserva UNIQUE (reserva_id),
    CONSTRAINT fk_facturas_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id),
    CONSTRAINT fk_facturas_huesped FOREIGN KEY (huesped_id) REFERENCES usuarios (id),
    CONSTRAINT fk_facturas_anfitrion FOREIGN KEY (anfitrion_id) REFERENCES usuarios (id),
    CONSTRAINT ck_facturas_fechas CHECK (fecha_salida > fecha_entrada),
    -- Noches y total se guardan para que la factura se lea sola, sin cálculos, pero la base
    -- exige que cuadren: una factura con la suma mal hecha no puede existir.
    CONSTRAINT ck_facturas_noches CHECK (noches = fecha_salida - fecha_entrada),
    CONSTRAINT ck_facturas_total CHECK (total = precio_noche * noches)
);

-- Las reservas que ya existían reciben su factura, numeradas en el orden en que se hicieron
-- y con la fecha de la reserva como fecha de emisión. El precio por noche se deduce del
-- total guardado, que es el que se acordó, y no del precio actual del alojamiento.
INSERT INTO facturas (reserva_id, huesped_id, anfitrion_id, huesped_nombre, huesped_email,
                      anfitrion_nombre, anfitrion_email, alojamiento_titulo, alojamiento_ciudad,
                      fecha_entrada, fecha_salida, noches, precio_noche, total, fecha_emision)
SELECT r.id, huesped.id, anfitrion.id, huesped.nombre, huesped.email,
       anfitrion.nombre, anfitrion.email, a.titulo, a.ciudad,
       r.fecha_entrada, r.fecha_salida, r.fecha_salida - r.fecha_entrada,
       r.valor_total / (r.fecha_salida - r.fecha_entrada), r.valor_total, r.fecha_creacion
FROM reservas r
JOIN alojamientos a ON a.id = r.alojamiento_id
JOIN usuarios huesped ON huesped.id = r.huesped_id
JOIN usuarios anfitrion ON anfitrion.id = a.anfitrion_id
WHERE r.estado = 'CONFIRMADA'
ORDER BY r.fecha_creacion, r.id;

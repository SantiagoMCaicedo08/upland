-- Reservas, con la regla central del proyecto: dos reservas confirmadas del mismo
-- alojamiento no pueden tener fechas superpuestas, ni siquiera ante peticiones simultáneas.

-- Un índice GiST sabe comparar rangos pero no uuid. btree_gist le agrega el operador "="
-- para tipos escalares, y así la restricción puede combinar alojamiento y rango de fechas.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE reservas (
    id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    alojamiento_id uuid          NOT NULL,
    huesped_id     uuid          NOT NULL,
    fecha_entrada  date          NOT NULL,
    fecha_salida   date          NOT NULL,
    -- Se guarda el total cobrado: si el anfitrión cambia el precio después, las reservas
    -- ya hechas conservan el valor con el que se acordaron.
    valor_total    numeric(12,2) NOT NULL,
    estado         varchar(20)   NOT NULL,
    fecha_creacion timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT fk_reservas_alojamiento FOREIGN KEY (alojamiento_id) REFERENCES alojamientos (id),
    CONSTRAINT fk_reservas_huesped FOREIGN KEY (huesped_id) REFERENCES usuarios (id),
    CONSTRAINT ck_reservas_fechas CHECK (fecha_salida > fecha_entrada),
    CONSTRAINT ck_reservas_valor CHECK (valor_total > 0),
    CONSTRAINT ck_reservas_estado
        CHECK (estado IN ('PENDIENTE_PAGO', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'RECHAZADA')),

    -- "No puede haber dos filas con el mismo alojamiento (=) cuyos rangos se crucen (&&)".
    -- daterange es [entrada, salida): el día de salida queda libre, así un huésped puede
    -- entrar el mismo día en que otro sale. El WHERE deja por fuera las reservas que no
    -- ocupan fechas, como una cancelada.
    CONSTRAINT ex_reservas_sin_solape
        EXCLUDE USING gist (alojamiento_id WITH =, daterange(fecha_entrada, fecha_salida) WITH &&)
        WHERE (estado = 'CONFIRMADA')
);

-- Sirven a "mis reservas" del huésped y a "reservas recibidas" del anfitrión.
CREATE INDEX idx_reservas_huesped ON reservas (huesped_id);
CREATE INDEX idx_reservas_alojamiento ON reservas (alojamiento_id);

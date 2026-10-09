# Medición de la búsqueda sobre PostgreSQL

Antes de agregar MongoDB como modelo de lectura se midió cuánto tarda la búsqueda del
catálogo sobre PostgreSQL con datos de tamaño realista. Este documento guarda esa medición
para que la decisión se apoye en números propios.

Fecha de la medición: 9 de octubre de 2026.

## Con qué se midió

| Dato | Cantidad | Origen |
|---|---|---|
| Alojamientos | 18.752 | 18.744 reales de Bogotá (Inside Airbnb, corte 2026-09-14) y 8 propios de Santander |
| Reservas confirmadas | 62.028 | Generadas con [`db/generar_reservas_demo.sql`](../db/generar_reservas_demo.sql) |
| Usuarios | 8.801 | 4 de demostración, 8.497 anfitriones y 300 huéspedes ficticios |

Entorno: PostgreSQL 16.15 en Docker Desktop sobre un portátil con Windows 11. Las tablas
caben completas en memoria (`alojamientos` ocupa 18 MB y `reservas` 16 MB).

Cada consulta es el SQL que arma
[`BusquedaAlojamientosPostgres`](../backend/src/main/java/com/uis/upland/alojamientos/infra/BusquedaAlojamientosPostgres.java),
ejecutado con `EXPLAIN (ANALYZE, BUFFERS)` después de una pasada de calentamiento. El
tiempo es el `Execution Time` que reporta PostgreSQL: no incluye la red ni el backend.

Filtros combinados usados en las consultas 3 a 6: Bogotá, zona Chapinero, alojamiento
entero, hasta $ 250.000 por noche, 2 huéspedes o más, con Wifi y Cocina. Devuelven 2.392
alojamientos; con el filtro de fechas del 10 al 14 de noviembre de 2026 quedan 2.199.

## Resultados

| # | Consulta | Sin índices | Con índices (V4) |
|---|---|---|---|
| 1 | Primera página sin filtros, orden por popularidad | 17,1 ms | 0,1 ms |
| 2 | Conteo sin filtros | 8,5 ms | 3,6 ms |
| 3 | Primera página con filtros combinados | 12,5 ms | 0,1 ms |
| 4 | Conteo con filtros combinados | 11,9 ms | 4,7 ms |
| 5 | Primera página con filtros y fechas libres | 13,4 ms | 0,3 ms |
| 6 | Conteo con filtros y fechas libres | 22,0 ms | 14,1 ms |
| 7 | Conteo de libres en fechas, toda la tabla | 18,6 ms | 12,4 ms |
| 8 | Página profunda (`OFFSET 12000`) | 43,5 ms | 8,0 ms |
| 9 | Conteo con dos servicios poco comunes (Piscina y Jacuzzi) | 12,8 ms | 0,9 ms |

"Sin índices" significa con los que ya existían para otras funciones: las claves
primarias, el índice de `anfitrion_id` y los de `reservas`, incluido el índice GiST de la
restricción de exclusión.

## Qué muestran los planes

**Sin índices**, toda consulta sobre `alojamientos` es un recorrido secuencial de las
18.752 filas (`Seq Scan`) seguido de un ordenamiento. A este tamaño eso cuesta entre 8 y
17 ms. La página profunda es la más lenta porque ordena toda la tabla y el ordenamiento ya
no cabe en memoria (`Sort Method: external merge  Disk: 4840kB`).

**Con los tres índices de
[`V4__indices_de_busqueda.sql`](../backend/src/main/resources/db/migration/V4__indices_de_busqueda.sql):**

- `idx_alojamientos_populares` entrega las filas ya ordenadas. La primera página lee 12
  filas y se detiene, en vez de leer y ordenar las 18.752. Explica las consultas 1, 3, 5 y 8.
- `idx_alojamientos_ciudad_zona` reduce los conteos a las filas de la zona pedida
  (consultas 4 y 6) y permite contar toda la tabla leyendo solo el índice (consulta 2).
- `idx_alojamientos_servicios`, de tipo GIN, resuelve "tiene todos estos servicios" sin
  recorrer la tabla (consulta 9).

Los tres juntos ocupan 1,2 MB.

**El filtro por fechas** se apoya en índices que ya existían. Para saber si un alojamiento
está libre, PostgreSQL usa el índice GiST `ex_reservas_sin_solape`, el mismo que sostiene
la regla de no superposición, o `idx_reservas_alojamiento`. Lo más lento que queda es
contar cuántos alojamientos hay libres en un rango (consultas 6 y 7, entre 12 y 14 ms),
porque hay que comprobar la disponibilidad de todos los candidatos y no solo de los 12 que
se muestran.

## Conclusión

Con 18.752 alojamientos y 62.028 reservas, **PostgreSQL responde cualquier búsqueda del
catálogo en menos de 15 ms** con tres índices pequeños, y en menos de 45 ms sin ninguno.

Con este volumen, el rendimiento no justifica agregar MongoDB. La medición no muestra un
problema que haya que resolver.

Lo que la medición sí deja ver es dónde crecería el costo con más datos:

- **Los conteos con filtro de fechas** recorren todos los candidatos y consultan `reservas`
  por cada uno. Es el costo que crece con el número de alojamientos y de reservas.
- **La paginación profunda** con `OFFSET` lee y descarta todas las filas anteriores.
- **El cruce entre módulos.** La búsqueda por fechas es la única consulta del sistema que
  lee tablas de dos módulos (`alojamientos` y `reservas`).

Una proyección desnormalizada en MongoDB, con los rangos ocupados dentro del documento de
cada alojamiento, ataca el primer y el tercer punto. Para sostener esa decisión con una
medición habría que repetir estas consultas con un volumen mayor (por ejemplo, un millón
de alojamientos) y comparar contra la implementación sobre MongoDB con los mismos datos.

## Cómo repetir la medición

1. Cargar los datos: `db/semilla.sql`, `db/importar_bogota.sql` y
   `db/generar_reservas_demo.sql`.
2. Ejecutar `ANALYZE alojamientos; ANALYZE reservas;` para actualizar las estadísticas.
3. Anteponer `EXPLAIN (ANALYZE, BUFFERS)` a la consulta. Por ejemplo, la número 5:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT a.id, a.titulo, a.zona, a.precio_noche, a.numero_resenas
FROM alojamientos a
WHERE a.activo
  AND a.ciudad = 'Bogotá'
  AND a.zona = 'Chapinero'
  AND a.tipo = 'ALOJAMIENTO_ENTERO'
  AND a.precio_noche <= 250000
  AND a.capacidad >= 2
  AND a.servicios @> ARRAY['Wifi', 'Cocina']::text[]
  AND NOT EXISTS (
      SELECT 1 FROM reservas r
      WHERE r.alojamiento_id = a.id
        AND r.estado = 'CONFIRMADA'
        AND daterange(r.fecha_entrada, r.fecha_salida) && daterange(DATE '2026-11-10', DATE '2026-11-14'))
ORDER BY a.numero_resenas DESC, a.id
LIMIT 12 OFFSET 0;
```

Para ver los tiempos sin los índices de V4 sin borrarlos de verdad, se pueden eliminar
dentro de una transacción y revertirla: `BEGIN; DROP INDEX ...; EXPLAIN ...; ROLLBACK;`.

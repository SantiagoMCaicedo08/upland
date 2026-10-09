-- Índices para la búsqueda del catálogo. Cada uno se agregó después de medir la consulta
-- que acelera; los números están en docs/MEDICION-BUSQUEDA.md.

-- Orden por defecto del catálogo ("más populares"). Con el índice, la primera página lee
-- 12 filas ya ordenadas en vez de leer y ordenar toda la tabla. El id va incluido porque es
-- el desempate del ORDER BY. Es parcial: el catálogo nunca muestra alojamientos inactivos.
CREATE INDEX idx_alojamientos_populares ON alojamientos (numero_resenas DESC, id) WHERE activo;

-- Filtro por ciudad y zona, y los conteos de resultados.
CREATE INDEX idx_alojamientos_ciudad_zona ON alojamientos (ciudad, zona) WHERE activo;

-- Filtro "tiene todos estos servicios" (operador @>). Un índice B-tree no sirve para buscar
-- dentro de un arreglo; GIN indexa cada elemento por separado.
CREATE INDEX idx_alojamientos_servicios ON alojamientos USING gin (servicios);

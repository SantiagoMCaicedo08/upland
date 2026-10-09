# Upland

Plataforma de reserva de alojamientos temporales, en la línea de Airbnb o Booking.

Proyecto de la asignatura Entornos de Programación (UIS).
Autor: Santiago Mauricio Caicedo Rodríguez (2220035).

> **Fases del proyecto.** Esta rama (`main`) es la **fase 2**, en desarrollo: frontend en
> React, catálogo con filtros y datos reales. La **fase 1** entregada (Spring Boot,
> PostgreSQL y JavaScript genérico) está congelada en la rama
> [`fase-1`](https://github.com/SantiagoMCaicedo08/upland/tree/fase-1).

## El problema

En Santander (Bucaramanga, San Gil, Barichara, Mesa de los Santos) buena parte del
alojamiento informal se coordina por WhatsApp y hojas de cálculo. De ahí salen tres
problemas que Upland resuelve:

- **Sobreventa:** dos huéspedes terminan con las mismas fechas.
- **Falta de catálogo:** no hay dónde consultar qué hay disponible.
- **Falta de confianza:** no hay un registro de quién reservó qué.

Upland conecta a dos tipos de usuario. El **anfitrión** publica y administra sus
alojamientos y ve quién los reservó. El **huésped** busca en el catálogo, filtra y reserva
un rango de fechas.

El requisito que define el proyecto es que **dos reservas confirmadas del mismo
alojamiento no pueden tener fechas superpuestas, ni siquiera ante peticiones simultáneas**.
Se garantiza en la base de datos con una restricción de exclusión de PostgreSQL, explicada
en el [diseño de la base de datos](docs/DISENO-BD.md).

## Qué incluye

De la fase 1:

- Registro y login con JWT.
- CRUD completo de alojamientos, protegido por rol y por propietario.
- Reservas por rango de fechas, sin superposición.
- Panel del huésped (sus reservas) y del anfitrión (sus alojamientos, las reservas
  recibidas y el total ganado).

De la fase 2, hasta ahora:

- Frontend en React.
- Catálogo con 18.744 alojamientos reales de Bogotá, importados de
  [Inside Airbnb](https://insideairbnb.com), además de los propios de Santander.
- Búsqueda con filtros por ciudad, zona, tipo, precio, huéspedes, habitaciones, servicios
  y fechas libres, con cinco criterios de orden.
- Medición de la búsqueda sobre PostgreSQL.

Pendiente de la fase 2: MongoDB como modelo de lectura, despliegue con contenedores,
observabilidad y mensajería entre huésped y anfitrión.

## Documentos

- [Diseño de la base de datos](docs/DISENO-BD.md): diagrama entidad-relación, tablas y
  restricciones.
- [Login con JWT: explicación de la solución](docs/ENTREGA-JWT.md): el flujo completo,
  archivo por archivo, sobre el código de la fase 1.
- [Medición de la búsqueda sobre PostgreSQL](docs/MEDICION-BUSQUEDA.md): tiempos con
  `EXPLAIN ANALYZE`, con y sin índices, y qué implican para MongoDB.

## Stack y por qué cada pieza

| Pieza | Por qué |
|---|---|
| Java 21 y Spring Boot 3.5 | Versión LTS de Java y el framework que pide la asignatura. |
| PostgreSQL 16 | Tiene restricciones de exclusión sobre rangos, que es lo que resuelve la sobreventa. |
| Flyway | El esquema vive en migraciones versionadas. Hibernate solo valida (`ddl-auto: validate`). |
| Spring Security y jjwt | Autenticación sin sesión de servidor, con tokens firmados HS256. |
| BCrypt | Las contraseñas se guardan como hash, nunca en texto plano. |
| React 19 y React Router | Interfaz por componentes y navegación sin recargar la página. Sin librerías de componentes ni de estilos. |
| Vite | Servidor de desarrollo y empaquetado del frontend. |
| Docker Compose | Levanta PostgreSQL con un comando, igual en cualquier máquina. |

El frontend y el backend son dos despliegues separados: el backend solo devuelve JSON y el
frontend lo consume por HTTP desde otro origen. Por eso pasar de JavaScript genérico a
React no exigió cambiar la API, y el cliente HTTP ([`api.js`](frontend/src/api.js)) es el
mismo archivo de la fase 1.

## Estructura

```
upland/
├── backend/               API en Spring Boot
│   └── src/main/java/com/uis/upland/
│       ├── shared/        seguridad, errores y tipos comunes
│       ├── usuarios/      registro, login y perfil
│       ├── alojamientos/  CRUD, catálogo y búsqueda
│       └── reservas/      reservas por rango de fechas
├── frontend/              aplicación React
│   └── src/
│       ├── api.js         cliente HTTP: único punto por el que salen las peticiones
│       ├── sesion.js      almacenamiento del token
│       ├── contexto/      la sesión como estado de React
│       ├── componentes/   piezas reutilizables (tarjeta, filtros, paginación)
│       └── paginas/       una por ruta
├── db/                    datos: semilla, importación de Bogotá y reservas de demostración
├── docs/                  diseño de la base, explicación del login y medición
├── scripts/               arranque de cada fase en un comando
└── docker-compose.yml     PostgreSQL
```

El backend es un monolito modular. Cada módulo tiene `api/` (controllers y DTOs), `domain/`
(entidades, servicios y reglas) e `infra/` (repositorios). Un módulo nunca usa el
repositorio ni las entidades de otro: se comunica por su servicio público.

## Cómo levantar el proyecto

Requisitos: Docker Desktop abierto, JDK 21 o superior y Node.js 20 o superior.

### En un comando (Windows)

Desde la raíz del repositorio, en PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\iniciar-fase2.ps1
```

Levanta PostgreSQL, abre el backend y el frontend cada uno en su ventana, y al final abre
`http://localhost:5500`. Para terminar se cierran las dos ventanas.

### Paso a paso

Todos los comandos se ejecutan desde la raíz del repositorio.

**1. Base de datos**

```bash
docker compose up -d
```

**2. Backend**, en otra terminal. Al arrancar, Flyway crea o actualiza las tablas.

```bash
cd backend
./mvnw spring-boot:run        # en PowerShell: .\mvnw.cmd spring-boot:run
```

Queda en `http://localhost:8080`.

**3. Frontend**, en otra terminal.

```bash
cd frontend
npm install                   # solo la primera vez
npm run dev
```

Queda en `http://localhost:5500`. El puerto es fijo porque forma parte del origen que el
backend permite por CORS.

### Datos

Se cargan una sola vez, con el backend ya arrancado. En Windows, desde PowerShell.

**Usuarios y alojamientos de demostración** (Santander):

```powershell
docker cp db/semilla.sql upland-postgres:/tmp/semilla.sql
docker exec upland-postgres psql -U upland -d upland -f /tmp/semilla.sql
```

Todos usan la contraseña `upland123`:

| Email | Rol |
|---|---|
| `ana@upland.test` | Anfitrión, con 4 alojamientos |
| `carlos@upland.test` | Anfitrión, con 4 alojamientos |
| `laura@upland.test` | Huésped |
| `pedro@upland.test` | Huésped |

**Alojamientos reales de Bogotá** (opcional). El dataset no se versiona en el repositorio:
pesa 54 MB y tiene su propia licencia (Creative Commons Attribution 4.0).

1. Descargar `listings.csv.gz` de Bogotá desde
   [insideairbnb.com/get-the-data](https://insideairbnb.com/get-the-data/) y descomprimirlo
   como `datos/insideairbnb/listings.csv`.
2. Importarlo:

```powershell
docker cp datos/insideairbnb/listings.csv upland-postgres:/tmp/listings.csv
docker cp db/importar_bogota.sql upland-postgres:/tmp/importar_bogota.sql
docker exec upland-postgres psql -U upland -d upland -f /tmp/importar_bogota.sql
```

Los anfitriones del dataset son personas reales: el script no importa sus nombres y crea
en su lugar usuarios ficticios que no pueden iniciar sesión.

**Reservas de demostración** (opcional), para que el filtro por fechas tenga datos:

```powershell
docker cp db/generar_reservas_demo.sql upland-postgres:/tmp/generar_reservas_demo.sql
docker exec upland-postgres psql -U upland -d upland -f /tmp/generar_reservas_demo.sql
```

Los tres scripts se pueden repetir sin duplicar datos.

### Presentar la fase 1

La fase 1 no puede usar la misma base de datos que la fase 2: esa base ya tiene
migraciones que el código de la fase 1 no conoce, y Flyway se niega a arrancar. Tampoco
pueden estar arriba a la vez, porque comparten puertos.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\presentar-fase1.ps1
```

El script deja el código de la rama `fase-1` en una carpeta aparte (`upland-fase1`, al lado
de esta), crea para ella la base `upland_fase1`, carga la semilla y abre backend y
frontend. Antes hay que cerrar las ventanas de la fase 2.

### Configuración

El backend lee su configuración de variables de entorno. Los valores por defecto sirven
solo para desarrollo local.

| Variable | Por defecto | Qué es |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Los de `docker-compose.yml` | Conexión a PostgreSQL. |
| `JWT_SECRET` | Un valor de desarrollo | Secreto de firma, mínimo 32 bytes. |
| `JWT_EXPIRACION` | `1h` | Duración del token. |
| `CORS_ORIGENES` | `http://localhost:5500,http://127.0.0.1:5500` | Orígenes del frontend. |

El frontend toma la dirección del backend de `VITE_API_URL`, o `http://localhost:8080` si
no está definida.

## API

Los errores tienen siempre el mismo formato:

```json
{ "codigo": "FECHAS_NO_DISPONIBLES", "mensaje": "El alojamiento ya está reservado en esas fechas. Elige otro rango", "detalles": [] }
```

### Autenticación

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /api/auth/registro` | Público | Crea una cuenta. |
| `POST /api/auth/login` | Público | Devuelve el token. |
| `GET /api/usuarios/yo` | Token | Datos del usuario autenticado. |

```http
POST /api/auth/registro
Content-Type: application/json

{ "nombre": "Laura Gómez", "email": "laura@upland.test", "password": "upland123", "rol": "HUESPED" }
```

```json
201 Created
{ "id": "33333333-3333-4333-8333-333333333333", "nombre": "Laura Gómez", "email": "laura@upland.test", "rol": "HUESPED" }
```

`rol` es opcional y admite `HUESPED` (por defecto) o `ANFITRION`.

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "laura@upland.test", "password": "upland123" }
```

```json
200 OK
{ "token": "eyJhbGciOiJIUzI1NiJ9...", "expiraEn": 3600 }
```

Las rutas protegidas reciben el token en el header:

```http
GET /api/usuarios/yo
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Alojamientos

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /api/alojamientos` | Público | Catálogo paginado, con filtros. |
| `GET /api/alojamientos/filtros` | Público | Ciudades, zonas, servicios y rango de precios disponibles. |
| `GET /api/alojamientos/{id}` | Público | Detalle. |
| `GET /api/alojamientos/mios` | Token | Los del anfitrión autenticado. |
| `POST /api/alojamientos` | Rol `ANFITRION` | Crea. |
| `PUT /api/alojamientos/{id}` | Solo el propietario | Edita. |
| `DELETE /api/alojamientos/{id}` | Solo el propietario | Baja lógica. |

Parámetros del catálogo. Todos son opcionales y se combinan entre sí:

| Parámetro | Ejemplo | Filtra por |
|---|---|---|
| `ciudad`, `zona` | `ciudad=Bogotá&zona=Chapinero` | Ubicación. |
| `tipo` | `tipo=ALOJAMIENTO_ENTERO` | `ALOJAMIENTO_ENTERO`, `HABITACION_PRIVADA`, `HABITACION_COMPARTIDA` u `HOTEL`. |
| `precioMin`, `precioMax` | `precioMax=250000` | Precio por noche. |
| `huespedes`, `habitaciones` | `huespedes=4` | Mínimos. |
| `servicios` | `servicios=Wifi&servicios=Cocina` | Debe tener todos los indicados. |
| `entrada`, `salida` | `entrada=2026-11-10&salida=2026-11-14` | Libre en ese rango. Van juntas. |
| `orden` | `orden=PRECIO_ASCENDENTE` | `POPULARES` (por defecto), `MEJOR_CALIFICADOS`, `PRECIO_ASCENDENTE`, `PRECIO_DESCENDENTE` o `RECIENTES`. |
| `pagina`, `tamano` | `pagina=0&tamano=12` | Paginación. El tamaño máximo es 50. |

```http
GET /api/alojamientos?ciudad=Bogotá&zona=Chapinero&servicios=Wifi&precioMax=250000&tamano=1
```

```json
{
  "contenido": [
    {
      "id": "…", "anfitrionId": "…",
      "titulo": "Hotel Express 53, Habitaciones Externas e Internas",
      "ciudad": "Bogotá", "zona": "Chapinero", "tipo": "HABITACION_PRIVADA",
      "capacidad": 2, "habitaciones": 20, "camas": 20, "precioNoche": 91260.00,
      "fotoUrl": "https://…", "calificacion": 4.23, "numeroResenas": 2586
    }
  ],
  "pagina": 0, "tamano": 1, "totalElementos": 3062, "totalPaginas": 3062
}
```

Para crear o editar:

```http
POST /api/alojamientos
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Casa colonial con patio en Barichara",
  "descripcion": "Casa de tapia pisada a dos cuadras del parque principal.",
  "ciudad": "Barichara",
  "zona": "Centro",
  "direccion": "Calle 6 # 8-21",
  "latitud": 6.637,
  "longitud": -73.223,
  "tipo": "ALOJAMIENTO_ENTERO",
  "capacidad": 6,
  "habitaciones": 3,
  "camas": 4,
  "banos": 2.5,
  "servicios": ["Wifi", "Cocina", "Parqueadero"],
  "precioNoche": 380000,
  "fotoUrl": null
}
```

Son obligatorios `titulo`, `descripcion`, `ciudad`, `direccion`, `capacidad` y
`precioNoche`. El dueño sale del token, nunca del cuerpo. Editar o borrar un alojamiento
ajeno responde 403.

### Reservas

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /api/reservas` | Token | Reserva un rango de fechas. |
| `GET /api/reservas/mias` | Token | Las que hice como huésped. |
| `GET /api/reservas/recibidas` | Token | Las hechas sobre mis alojamientos, con los datos del huésped. |
| `GET /api/reservas/ocupacion?alojamientoId={id}` | Público | Rangos ya ocupados. |

```http
POST /api/reservas
Authorization: Bearer <token>
Content-Type: application/json

{ "alojamientoId": "a0000000-0000-4000-8000-000000000003", "fechaEntrada": "2027-08-10", "fechaSalida": "2027-08-13" }
```

```json
201 Created
{
  "id": "56e517b4-5609-411d-891f-6708460b7add",
  "alojamientoId": "a0000000-0000-4000-8000-000000000003",
  "alojamientoTitulo": "Apartamento moderno en Cabecera",
  "alojamientoCiudad": "Bucaramanga",
  "fechaEntrada": "2027-08-10", "fechaSalida": "2027-08-13",
  "noches": 3, "valorTotal": 540000.00, "estado": "CONFIRMADA"
}
```

El total lo calcula el servidor a partir del precio del alojamiento. Si las fechas se
cruzan con otra reserva confirmada responde 409. El día de salida queda libre: un huésped
puede entrar el día en que otro sale.

## Cómo se desarrolló la solución

Se construyó por rebanadas verticales, cada una terminada y probada antes de la siguiente.
En la fase 1: esquema y migraciones, login con JWT, pantallas de login y panel, CRUD de
alojamientos y reservas. En la fase 2: atributos de catálogo e importación de datos reales,
búsqueda con filtros y su medición, y el frontend en React.

Cada regla de integridad que la base puede garantizar se declaró en la base; la validación
en el servicio existe para responder con un mensaje claro.

### El flujo del JWT

Qué pasa desde que el usuario envía el formulario hasta que accede a un recurso protegido:

1. **El formulario.** La página de login toma email y contraseña y llama a
   `iniciarSesion()`, que hace `fetch` con `POST /api/auth/login`.
2. **La verificación.** `UsuarioService` busca el usuario y compara la contraseña contra
   el hash BCrypt guardado. Si algo falla responde 401 con el mismo mensaje, sin revelar
   si el email existe.
3. **La emisión.** `JwtService` arma un token con el id del usuario (`sub`), su rol y un
   vencimiento de una hora, y lo firma con HS256 usando un secreto que solo conoce el
   backend.
4. **El almacenamiento.** El frontend guarda el token en `localStorage` y vuelve a la
   página que el usuario quería ver.
5. **La petición protegida.** Toda llamada sale por la función `peticion()` de `api.js`,
   que agrega el header `Authorization: Bearer <token>`.
6. **La validación.** `JwtAuthenticationFilter` intercepta la petición antes del
   controller, recalcula la firma y revisa el vencimiento. Si el token es válido deja al
   usuario autenticado para esa petición. No hay sesión en el servidor ni consulta a la
   base: toda la identidad viaja en el token.
7. **La autorización.** Spring Security decide si ese usuario puede usar la ruta, y el
   servicio decide si es dueño del recurso.
8. **El rechazo.** Un token ausente, vencido o manipulado recibe 401. `peticion()` borra
   el token y lleva al login.

La explicación detallada, archivo por archivo, está en
[docs/ENTREGA-JWT.md](docs/ENTREGA-JWT.md). Describe el frontend de la fase 1; en React el
flujo es el mismo y el cliente HTTP es el mismo archivo.

### La decisión sobre `localStorage`

El token se guarda en `localStorage`, que es vulnerable a XSS: un script inyectado en la
página podría leerlo. La alternativa más segura es una cookie `HttpOnly`, que JavaScript
no puede leer, pero obliga a protegerse de CSRF y complica que frontend y backend estén en
orígenes distintos.

Para el alcance de este proyecto se acepta `localStorage`. Como mitigación, nada de lo que
viene del servidor se inserta como HTML: en la fase 1 se escribía solo con `textContent`, y
en la fase 2 React escapa todo lo que pinta y el proyecto no usa
`dangerouslySetInnerHTML`.

### La búsqueda y su medición

El catálogo se consulta detrás de la interfaz `BusquedaAlojamientos`. Su implementación
actual arma el SQL según los filtros presentes y lo ejecuta sobre PostgreSQL.

Con 18.752 alojamientos y 62.028 reservas, cualquier búsqueda responde en menos de 15 ms
con tres índices pequeños. La medición completa, con los planes de ejecución, está en
[docs/MEDICION-BUSQUEDA.md](docs/MEDICION-BUSQUEDA.md). A este volumen el rendimiento no
justifica por sí solo agregar MongoDB; el documento explica dónde crecería el costo con más
datos.

## Pruebas realizadas

No hay todavía tests automatizados dentro del repositorio. La verificación se hizo contra
el sistema real:

- 15 casos de autenticación, 21 del CRUD, 19 de reservas y 21 de búsqueda contra la API.
- 20 reservas simultáneas sobre las mismas fechas: una recibió 201 y diecinueve 409.
- Recorrido completo de la aplicación React en un navegador real (38 comprobaciones),
  incluidos los filtros, la reserva, el CRUD y el manejo del token.
- La fase 1 se volvió a recorrer completa sobre su propia base de datos.

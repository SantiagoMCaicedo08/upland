# Upland

Plataforma de reserva de alojamientos temporales, en la línea de Airbnb o Booking.

Proyecto de la asignatura Entornos de Programación (UIS).
Autor: Santiago Mauricio Caicedo Rodríguez (2220035).

## El problema

En Santander (Bucaramanga, San Gil, Barichara, Mesa de los Santos) buena parte del
alojamiento informal se coordina por WhatsApp y hojas de cálculo. De ahí salen tres
problemas que Upland resuelve:

- **Sobreventa:** dos huéspedes terminan con las mismas fechas.
- **Falta de catálogo:** no hay dónde consultar qué hay disponible.
- **Falta de confianza:** no hay un registro de quién reservó qué.

Upland conecta a dos tipos de usuario. El **anfitrión** publica y administra sus
alojamientos y ve quién los reservó. El **huésped** consulta el catálogo y reserva un rango
de fechas.

El requisito que define el proyecto es que **dos reservas confirmadas del mismo
alojamiento no pueden tener fechas superpuestas, ni siquiera ante peticiones simultáneas**.
Se garantiza en la base de datos con una restricción de exclusión de PostgreSQL, explicada
en el [diseño de la base de datos](docs/DISENO-BD.md).

## Qué incluye la fase 1

- Registro y login con JWT.
- CRUD completo de alojamientos, protegido por rol y por propietario.
- Catálogo con filtros por ciudad, huéspedes, precio máximo y fechas libres.
- Reservas por rango de fechas, sin superposición.
- Una factura por cada reserva, que el huésped y el anfitrión pueden ver e imprimir.
- Panel del huésped (sus reservas) y del anfitrión (sus alojamientos, las reservas
  recibidas y el total ganado).

## Documentos

- [Diseño de la base de datos](docs/DISENO-BD.md): diagrama entidad-relación, tablas y
  restricciones.
- [Login con JWT: explicación de la solución](docs/ENTREGA-JWT.md): el flujo completo,
  archivo por archivo.

## Stack y por qué cada pieza

| Pieza | Por qué |
|---|---|
| Java 21 y Spring Boot 3.5 | Versión LTS de Java y el framework que pide la asignatura. |
| PostgreSQL 16 | Tiene restricciones de exclusión sobre rangos, que es lo que resuelve la sobreventa. |
| Flyway | El esquema vive en migraciones versionadas. Hibernate solo valida (`ddl-auto: validate`). |
| Spring Security y jjwt | Autenticación sin sesión de servidor, con tokens firmados HS256. |
| BCrypt | Las contraseñas se guardan como hash, nunca en texto plano. |
| HTML, CSS y JavaScript genérico | Sin frameworks, librerías ni empaquetador. Todo el acceso a la API es con `fetch`. |
| Docker Compose | Levanta PostgreSQL con un comando, igual en cualquier máquina. |

El frontend y el backend son dos despliegues separados: el backend solo devuelve JSON y el
frontend son archivos estáticos que lo consumen por HTTP desde otro origen.

## Estructura

```
upland/
├── backend/               API en Spring Boot
│   └── src/main/java/com/uis/upland/
│       ├── shared/        seguridad, errores y tipos comunes
│       ├── usuarios/      registro, login y perfil
│       ├── alojamientos/  CRUD y catálogo
│       └── reservas/      reservas por rango de fechas
├── frontend/              HTML, CSS y JavaScript
├── db/semilla.sql         datos de demostración
├── docs/                  diseño de la base de datos y explicación del login
└── docker-compose.yml     PostgreSQL
```

El backend es un monolito modular. Cada módulo tiene `api/` (controllers y DTOs), `domain/`
(entidades, servicios y reglas) e `infra/` (repositorios). Un módulo nunca usa el
repositorio ni las entidades de otro: se comunica por su servicio público.

## Cómo levantar el proyecto

Requisitos: Docker, JDK 21 o superior y Node.js (solo para servir el frontend).

Todos los comandos se ejecutan desde la raíz del repositorio.

**1. Base de datos**

```bash
docker compose up -d
```

**2. Backend**, en otra terminal. Al arrancar, Flyway crea las tablas.

```bash
cd backend
./mvnw spring-boot:run        # en PowerShell: .\mvnw.cmd spring-boot:run
```

Queda en `http://localhost:8080`.

**3. Datos de demostración**, una sola vez y con el backend ya arrancado.

```bash
docker cp db/semilla.sql upland-postgres:/tmp/semilla.sql
docker exec upland-postgres psql -U upland -d upland -f /tmp/semilla.sql
```

**4. Frontend**, en otra terminal.

```bash
npx http-server frontend -p 5500 -c-1
```

Abre `http://localhost:5500`. También funciona con la extensión Live Server de VS Code en
el puerto 5500.

Usuarios de demostración, todos con contraseña `upland123`:

| Email | Rol |
|---|---|
| `ana@upland.test` | Anfitrión, con 4 alojamientos |
| `carlos@upland.test` | Anfitrión, con 4 alojamientos |
| `laura@upland.test` | Huésped |
| `pedro@upland.test` | Huésped |

### Configuración

El backend lee su configuración de variables de entorno. Los valores por defecto sirven
solo para desarrollo local.

| Variable | Por defecto | Qué es |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Los de `docker-compose.yml` | Conexión a PostgreSQL. |
| `JWT_SECRET` | Un valor de desarrollo | Secreto de firma, mínimo 32 bytes. |
| `JWT_EXPIRACION` | `1h` | Duración del token. |
| `CORS_ORIGENES` | `http://localhost:5500,http://127.0.0.1:5500` | Orígenes del frontend. |

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
| `GET /api/alojamientos/ciudades` | Público | Ciudades con alojamientos, para el filtro. |
| `GET /api/alojamientos/{id}` | Público | Detalle. |
| `GET /api/alojamientos/mios` | Token | Los del anfitrión autenticado. |
| `POST /api/alojamientos` | Rol `ANFITRION` | Crea. |
| `PUT /api/alojamientos/{id}` | Solo el propietario | Edita. |
| `DELETE /api/alojamientos/{id}` | Solo el propietario | Baja lógica. |

```http
POST /api/alojamientos
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Casa colonial con patio en Barichara",
  "descripcion": "Casa de tapia pisada a dos cuadras del parque principal.",
  "ciudad": "Barichara",
  "direccion": "Calle 6 # 8-21",
  "latitud": 6.637,
  "longitud": -73.223,
  "capacidad": 6,
  "precioNoche": 380000
}
```

El dueño sale del token, nunca del cuerpo. Editar o borrar un alojamiento ajeno responde
403. El catálogo responde así:

```json
{
  "contenido": [
    { "id": "a0000000-0000-4000-8000-000000000001", "anfitrionId": "11111111-1111-4111-8111-111111111111",
      "titulo": "Casa colonial con patio en Barichara", "ciudad": "Barichara", "capacidad": 6, "precioNoche": 380000.00 }
  ],
  "pagina": 0, "tamano": 12, "totalElementos": 8, "totalPaginas": 1
}
```

Filtros del catálogo. Todos son opcionales y se combinan entre sí:

| Parámetro | Ejemplo | Filtra por |
|---|---|---|
| `ciudad` | `ciudad=San Gil` | Ciudad exacta. |
| `huespedes` | `huespedes=4` | Capacidad mínima. |
| `precioMax` | `precioMax=200000` | Precio por noche máximo. |
| `entrada`, `salida` | `entrada=2027-09-01&salida=2027-09-04` | Libre en ese rango. Van juntas. |
| `pagina`, `tamano` | `pagina=0&tamano=12` | Paginación. El tamaño máximo es 50. |

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

### Facturas

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /api/reservas/{id}/factura` | Solo el huésped o el anfitrión de esa reserva | Factura de la reserva. |

```json
200 OK
{
  "numero": 1, "fechaEmision": "2026-10-14T18:30:12Z",
  "reservaId": "56e517b4-5609-411d-891f-6708460b7add",
  "huespedNombre": "Laura Gómez", "huespedEmail": "laura@upland.test",
  "anfitrionNombre": "Ana Rojas", "anfitrionEmail": "ana@upland.test",
  "alojamientoTitulo": "Apartamento moderno en Cabecera", "alojamientoCiudad": "Bucaramanga",
  "fechaEntrada": "2027-08-10", "fechaSalida": "2027-08-13",
  "noches": 3, "precioNoche": 180000.00, "total": 540000.00
}
```

La factura se emite sola al crear la reserva, en la misma transacción. Cualquier otro
usuario recibe 403. En la interfaz se muestra como `UP-000001` y se puede imprimir o
guardar como PDF desde el navegador. Es un documento de demostración: no es una factura
electrónica ante la DIAN y no incluye impuestos.

## Cómo se desarrolló la solución

Se construyó por rebanadas verticales, cada una terminada y probada antes de la siguiente:
esquema y migraciones, login con JWT, pantallas de login y panel, CRUD de alojamientos y
reservas. Cada regla de integridad que la base puede garantizar se declaró en la base; la
validación en el servicio existe para responder con un mensaje claro.

### El flujo del JWT

Qué pasa desde que el usuario envía el formulario hasta que accede a un recurso protegido:

1. **El formulario.** `login.js` toma email y contraseña y llama a `iniciarSesion()`, que
   hace `fetch` con `POST /api/auth/login`.
2. **La verificación.** `UsuarioService` busca el usuario y compara la contraseña contra
   el hash BCrypt guardado. Si algo falla responde 401 con el mismo mensaje, sin revelar
   si el email existe.
3. **La emisión.** `JwtService` arma un token con el id del usuario (`sub`), su rol y un
   vencimiento de una hora, y lo firma con HS256 usando un secreto que solo conoce el
   backend.
4. **El almacenamiento.** El frontend guarda el token en `localStorage` y redirige al
   panel.
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
[docs/ENTREGA-JWT.md](docs/ENTREGA-JWT.md).

### La decisión sobre `localStorage`

El token se guarda en `localStorage`, que es vulnerable a XSS: un script inyectado en la
página podría leerlo. La alternativa más segura es una cookie `HttpOnly`, que JavaScript
no puede leer, pero obliga a protegerse de CSRF y complica que frontend y backend estén en
orígenes distintos.

Para el alcance de este proyecto se acepta `localStorage`. Como mitigación, el frontend
escribe en la página únicamente con `textContent` y nunca con `innerHTML`, así un texto
que venga del servidor no se ejecuta como código.

## Pruebas realizadas

No hay todavía tests automatizados dentro del repositorio. La verificación se hizo contra
el sistema real:

- 15 casos de autenticación, 21 del CRUD y 19 de reservas contra la API.
- 20 reservas simultáneas sobre las mismas fechas: una recibió 201 y diecinueve 409. Con
  la factura incluida, de 10 simultáneas quedó una sola reserva con una sola factura.
- La factura: la ven el huésped y el anfitrión, los demás reciben 403, y la base rechaza
  una factura cuyo total no cuadre.
- Recorrido completo en un navegador real, incluida la comprobación de CORS desde
  `localhost` y `127.0.0.1`, los filtros y la factura.

## Hacia la fase 2

La fase 2 amplía este mismo proyecto: React reemplaza al JavaScript genérico y MongoDB
entra como modelo de lectura derivado para la búsqueda, con PostgreSQL como fuente de
verdad. Dos decisiones de la fase 1 lo preparan: el catálogo se consulta detrás de la
interfaz `BusquedaAlojamientos`, y `api.js` no toca el DOM, así que puede reutilizarse.

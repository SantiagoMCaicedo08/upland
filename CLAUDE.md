# Upland

Plataforma de reserva de alojamientos temporales, en la línea de Airbnb o Booking.
Proyecto de la asignatura Entornos de Programación (UIS). Autor: Santiago Mauricio
Caicedo Rodríguez (2220035), trabajando solo.

## Qué es Upland

Un marketplace de dos lados que conecta anfitriones con huéspedes.

Un **anfitrión** publica un alojamiento (apartamento, finca, habitación) con fotos,
descripción, ubicación, capacidad, servicios y tarifa por noche, y administra un
calendario de disponibilidad donde puede bloquear fechas.

Un **huésped** busca alojamientos por ciudad, rango de fechas y número de personas,
filtra por precio y servicios, consulta el detalle con reseñas de otros huéspedes, y
reserva un rango de fechas. Al terminar la estadía puede calificar.

Un **administrador** gestiona usuarios y roles, y consulta reportes básicos.

El contexto es el mercado de alojamiento informal en Santander (Bucaramanga, San Gil,
Barichara, Mesa de los Santos), donde hoy los anfitriones coordinan por WhatsApp y hoja
de cálculo. De ahí salen los tres problemas que el sistema resuelve: la sobreventa, la
falta de un catálogo consultable, y la ausencia de un mecanismo de confianza.

### El núcleo técnico

El requisito que define el proyecto es que **dos reservas confirmadas del mismo
alojamiento no pueden tener rangos de fechas superpuestos**, ni siquiera ante solicitudes
simultáneas.

No es un contador de inventario que se decrementa. Es exclusión mutua sobre intervalos:
hay que verificar que `[entrada, salida)` no intersecte ningún rango ya confirmado para
ese alojamiento. Se resuelve en la base de datos con una restricción de exclusión de
PostgreSQL e índice GiST sobre un `daterange`, no con una validación en Java. La
validación en el servicio existe para dar un mensaje de error decente; la garantía es la
restricción.

Todo lo demás del proyecto es CRUD. Esto es lo que lo hace un proyecto de ingeniería.

## Objetivo del autor

Este proyecto existe para **aprender**, no solo para entregar. Debo poder sustentar cada
decisión técnica frente al profesor. Un archivo que yo no entienda es un pasivo, no un
avance.

---

## Hacia dónde va el proyecto

La asignatura tiene dos fases, pero el proyecto es uno solo: la fase 1 no se desecha, se
amplía. Las decisiones de hoy no deben bloquear lo de mañana.

**Fase 1 (entrega actual):** Spring Boot, PostgreSQL, JavaScript genérico. Monolito
modular.

**Fase 2 (después):**

- **React** reemplaza al JavaScript genérico en el frontend.
- **MongoDB** entra como **modelo de lectura derivado**, no como almacén en igualdad de
  condiciones. Postgres sigue siendo la fuente de verdad de todo. Mongo guarda una
  proyección desnormalizada de los alojamientos optimizada para la búsqueda, incluyendo
  los rangos ya ocupados, de modo que la consulta con filtros de ciudad, fechas,
  capacidad y precio se resuelva en una sola lectura con paginación correcta.
  Esta decisión está validada contra lo que hace Airbnb de verdad: MySQL como sistema de
  registro y almacenes secundarios optimizados para lectura alimentados desde él.
- **Despliegue** con contenedores en un proveedor de nube.
- **Observabilidad**: métricas, trazas distribuidas, dashboards.

Antes de construir Mongo hay que **medir** la búsqueda sobre Postgres con datos semilla
realistas y guardar el `EXPLAIN ANALYZE`. La justificación de Mongo en la sustentación
debe ser una medición propia, no una cita de un tutorial.

### Costuras que sí se hacen desde ya

Son decisiones de diseño baratas hoy que convierten la fase 2 en trabajo aditivo en vez
de un rediseño:

1. **La búsqueda vive detrás de una interfaz** (`BusquedaAlojamientos`), con una
   implementación sobre Postgres. En la fase 2 se agrega otra implementación sobre Mongo
   y se elige por perfil. Además facilita los tests.
2. **El backend devuelve JSON puro.** Nada de HTML renderizado en el servidor, ni
   Thymeleaf, ni JSP. Esto ya hace falta para el JS genérico, y es lo que permite cambiar
   el cliente a React sin tocar el backend.
3. **El frontend es un despliegue separado** que consume la API por HTTP. No se empaqueta
   dentro del JAR.
4. **Todas las transiciones de estado de la reserva pasan por un solo método del
   servicio.** Cuando la fase 2 necesite publicar eventos de sincronización, es una línea
   en un solo lugar.

### Lo que NO se hace todavía

No construir infraestructura sin consumidor: tabla de outbox, bus de eventos, broker,
contenedor de Mongo, separación en microservicios, API gateway. Tampoco capa de IA.

---

## Entrega 1 — qué se califica

Obligatorio:

- [ ] Diseño de la base de datos (documento con el modelo entidad-relación)
- [ ] Login funcional con JWT: Spring Boot en el backend, JavaScript genérico con `fetch`
      en el frontend
- [ ] Al menos un CRUD completo (soy equipo de una persona, así que el mínimo es uno)
- [ ] README del repositorio documentando el proyecto
- [ ] Explicación escrita de cómo se desarrolló la solución (va dentro del README)
- [ ] Presentación en clase: **demo funcional**, no revisión de código

Opcional, no bloqueante: Jira (no se usa, trabajo individual), gestión formal de ramas.

### Orden de construcción (no alterar)

La demo es lo que se califica. Primero lo que garantiza la nota, después lo interesante.

1. Esquema de base de datos completo + migraciones Flyway
2. Entidad usuario, registro, login, emisión y validación de JWT
3. Frontend: pantalla de login con `fetch`, almacenamiento del token, pantalla protegida
4. CRUD de alojamientos completo (backend + frontend), protegido por JWT
5. Checklist de demo en verde (ver al final)
6. README y documento de diseño de base de datos
7. **Solo si queda tiempo:** reservas con restricción de exclusión y test de concurrencia

El paso 7 es el corazón del proyecto a largo plazo, pero no se califica en esta entrega.
No empezarlo antes de que los pasos 1 a 6 estén terminados.

---

## Stack de esta fase

- Java 21, Spring Boot 3.x, Maven
- PostgreSQL 16, migraciones con Flyway (`ddl-auto: validate`, nunca `update`)
- Spring Security + JWT (jjwt), BCrypt para contraseñas
- Frontend: HTML + CSS + JavaScript genérico con `fetch`. **Sin React, sin frameworks,
  sin bundler.** Se sirve como archivos estáticos, aparte del backend.
- JUnit 5; Testcontainers para los tests que tocan base de datos

---

## Modelo de datos

El documento entregado debe cubrir el modelo completo del proyecto, aunque solo una parte
esté implementada en esta fase.

**Implementar ahora:**

- `usuarios` — id, nombre, email (único), password_hash, rol, activo, fecha_creacion
- `alojamientos` — id, anfitrion_id (FK a usuarios), titulo, descripcion, ciudad,
  direccion, latitud, longitud, capacidad, precio_noche, activo, fecha_creacion

**Diseñar y documentar, implementar después:**

- `bloqueos_disponibilidad` — alojamiento_id, rango de fechas, motivo
- `reservas` — id, alojamiento_id, huesped_id, fecha_entrada, fecha_salida, valor_total,
  estado, fecha_creacion
- `resenas` — reserva_id, calificacion, comentario, fecha
- `pagos` — reserva_id, valor, estado, fecha

La tabla `reservas` llevará la restricción de exclusión con índice GiST sobre
`(alojamiento_id, daterange(fecha_entrada, fecha_salida))`. Documentarla en el diseño
aunque todavía no se implemente.

Estado de una reserva: `PENDIENTE_PAGO` → `CONFIRMADA` → `COMPLETADA`, con transiciones a
`CANCELADA` y `RECHAZADA`. Las transiciones inválidas lanzan excepción; no se asignan
estados arbitrariamente desde fuera del servicio.

Convenciones: claves primarias UUID, tablas y columnas en `snake_case` y en español,
`timestamptz` para auditoría, `date` para estadías, `numeric(12,2)` para dinero.

---

## Especificación del login con JWT

### Endpoints

```
POST /api/auth/registro   { nombre, email, password }   -> 201, sin token
POST /api/auth/login      { email, password }           -> 200 { token, expiraEn }
GET  /api/usuarios/yo     requiere Authorization        -> 200 { id, nombre, email, rol }
```

### Backend

- Contraseñas con `BCryptPasswordEncoder`. Nunca en texto plano, nunca en los logs.
- Token firmado HS256, con `sub` = id de usuario, `rol` como claim, expiración de 1 hora.
- El secreto sale de `application.yml` vía variable de entorno, con un valor por defecto
  solo para desarrollo local. No hardcodear el secreto en una clase Java.
- Un `OncePerRequestFilter` lee el header `Authorization: Bearer <token>`, valida firma y
  expiración, y pone la autenticación en el `SecurityContext`.
- `SessionCreationPolicy.STATELESS`. Sin sesión de servidor, sin CSRF.
- Rutas públicas: `/api/auth/**`. Todo lo demás requiere autenticación.
- Token inválido o vencido devuelve 401 con el formato de error estándar, no una página
  de login ni un stacktrace.

### Frontend

- `fetch` con `Authorization: Bearer ${token}` en cada llamada protegida.
- El token se guarda en `localStorage`. **Decisión documentada:** `localStorage` es
  vulnerable a XSS; una cookie `HttpOnly` sería más segura pero obliga a manejar CSRF y
  complica el despliegue separado. Para el alcance de este proyecto se acepta
  `localStorage`, y el tradeoff queda escrito en el README.
- Un envoltorio único para las llamadas HTTP: agrega el header y, si la respuesta es 401,
  borra el token y redirige al login. No repetir esa lógica en cada pantalla.
- Sin librerías. `fetch` nativo, DOM nativo.

### CORS

El frontend corre en un origen distinto al del backend. Configurar
`CorsConfigurationSource` permitiendo ese origen, los métodos usados y el header
`Authorization`. **Esto es lo que más se rompe el día de la demo**; probarlo desde el
navegador, no solo con Postman.

---

## CRUD de alojamientos

```
GET    /api/alojamientos        público, listado con paginación
GET    /api/alojamientos/{id}   público, detalle
POST   /api/alojamientos        requiere rol ANFITRION
PUT    /api/alojamientos/{id}   solo el anfitrión propietario
DELETE /api/alojamientos/{id}   solo el propietario; baja lógica (activo = false)
```

El `anfitrion_id` sale del token, nunca del cuerpo de la petición. Un usuario no puede
editar ni borrar un alojamiento ajeno: eso devuelve 403, no 404. El borrado es lógico.

---

## Estructura de paquetes

Monolito modular, un paquete por módulo de dominio:

```
com.uis.upland
├── shared/          config, seguridad, manejo de excepciones, tipos comunes
├── usuarios/
├── alojamientos/
└── (reservas/, pagos/, resenas/ en fases posteriores)
```

Cada módulo: `api/` (controllers, DTOs), `domain/` (entidades, servicios, reglas),
`infra/` (repositorios).

### Reglas de arquitectura

1. Un módulo nunca importa el repositorio de otro. La comunicación va por el servicio
   público del módulo dueño. Esto es lo que haría mecánica una extracción futura.
2. Las entidades JPA no salen del módulo. Los controllers devuelven DTOs, siempre.
3. Las reglas de negocio viven en el servicio, no en el controller ni en la entidad.
4. Nada de lógica condicional de negocio en el controller: valida, delega, mapea.

---

## Convenciones

- Código, clases y variables en inglés. Comentarios, commits y documentación en español.
- Mensajes de error de la API en español; los ve el usuario final.
- Excepciones de dominio propias, traducidas a HTTP en un `@RestControllerAdvice` central.
  Nunca `RuntimeException` genérica.
- Formato de error uniforme: `{ "codigo", "mensaje", "detalles" }`.
- `LocalDate` para estadías, `Instant` para auditoría. Nunca `Date`.
- `BigDecimal` para dinero. Nunca `double`.
- Los comentarios explican **por qué**, no qué hace el código.

---

## Modo de trabajo

Estas reglas son el motivo por el que uso esta herramienta. Respétalas aunque hagan el
trabajo más lento.

1. **Explica el enfoque antes de escribir código.** Qué vas a hacer, qué archivos vas a
   tocar, por qué. Espera mi confirmación.
2. **Una rebanada vertical a la vez.** Un endpoint completo (controller → servicio →
   repositorio → migración → frontend) antes de pasar al siguiente. No generes veinte
   archivos de scaffolding de una vez.
3. **Cuando haya alternativas reales, preséntamelas.** Explica el tradeoff y recomienda
   una. No decidas en silencio.
4. **No agregues dependencias sin preguntar.**
5. **Nada de código especulativo.** No implementes lo que no pedí porque "va a hacer falta
   después".
6. **Si pregunto cómo funciona algo, respóndeme la pregunta.** No la conviertas en un
   commit.
7. **Nunca modifiques una migración de Flyway ya aplicada.** Crea una nueva.
8. Cuando aceptemos una decisión no trivial, recuérdame registrarla en
   `docs/DECISIONS.md` con las alternativas que descartamos. No la escribas tú: escribirla
   es mi trabajo.

---

## Contenido del README

- Descripción del proyecto y del problema que resuelve
- Stack y por qué cada pieza
- Modelo de datos con el diagrama entidad-relación
- Cómo levantar el proyecto paso a paso (base de datos, backend, frontend)
- Endpoints de la API con ejemplos de petición y respuesta
- **Explicación de cómo se desarrolló la solución**, con énfasis en el flujo del JWT: qué
  pasa desde que el usuario envía el formulario hasta que accede a un recurso protegido
- La decisión sobre `localStorage` y su tradeoff

---

## Checklist de demo

Verificar en el navegador, con backend y frontend corriendo por separado, antes de
presentar:

- [ ] Registro de un usuario nuevo desde el formulario
- [ ] Login devuelve token y redirige a la pantalla protegida
- [ ] Entrar directo a la URL protegida sin token redirige al login
- [ ] Credenciales incorrectas muestran mensaje de error, no una pantalla en blanco
- [ ] Crear, listar, editar y borrar un alojamiento desde la interfaz
- [ ] Intentar editar el alojamiento de otro usuario devuelve 403
- [ ] Token vencido o manipulado devuelve 401 y saca al usuario
- [ ] Cerrar sesión borra el token
- [ ] Todo lo anterior funciona desde cero: base de datos arriba, migraciones, arranque
- [ ] Datos semilla cargados para que la demo no empiece con pantallas vacías

---

## Comandos

```bash
# main es la fase 2 (frontend en React). La fase 1 entregada está en la rama fase-1.

# Todo de una vez, cada servidor en su ventana (desde la raíz, en PowerShell):
powershell -ExecutionPolicy Bypass -File scripts\iniciar-fase2.ps1     # fase 2, esta carpeta
powershell -ExecutionPolicy Bypass -File scripts\presentar-fase1.ps1   # fase 1, en ..\upland-fase1 y con su propia base

# O paso a paso:
docker compose up -d       # levanta PostgreSQL (desde la raíz)
cd frontend && npm install && npm run dev   # frontend React en http://localhost:5500

# Datos (desde la raíz, con el backend ya arrancado una vez). En PowerShell, no en Git Bash.
docker cp db/semilla.sql upland-postgres:/tmp/semilla.sql
docker exec upland-postgres psql -U upland -d upland -f /tmp/semilla.sql
# Después, opcionales: db/importar_bogota.sql y db/generar_reservas_demo.sql (ver sus encabezados)

# Los siguientes van desde backend/. En PowerShell: .\mvnw.cmd en vez de ./mvnw
./mvnw spring-boot:run     # arranca el backend
./mvnw test                # tests
./mvnw flyway:info         # estado de las migraciones
```

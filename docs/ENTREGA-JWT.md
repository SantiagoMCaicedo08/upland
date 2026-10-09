# Login con JWT: explicación de la solución

**Autor:** Santiago Mauricio Caicedo Rodríguez (2220035)
**Asignatura:** Entornos de Programación, UIS
**Código:** https://github.com/SantiagoMCaicedo08/upland (etiqueta `entrega-jwt`)

El login forma parte de Upland, una plataforma de reserva de alojamientos. El repositorio
contiene los dos proyectos que pide el enunciado:

- **Backend** en [`backend/`](../backend): Spring Boot 3.5, Spring Security y JWT.
- **Frontend** en [`frontend/`](../frontend): HTML, CSS y JavaScript genérico con `fetch`,
  sin frameworks ni librerías. Se sirve aparte del backend, desde otro origen.

## Qué hace

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `POST /api/auth/registro` | Público | Crea la cuenta. Responde 201 sin token. |
| `POST /api/auth/login` | Público | Verifica las credenciales y devuelve el token. |
| `GET /api/usuarios/yo` | Requiere token | Devuelve los datos del usuario autenticado. |

En el navegador hay un formulario de registro, uno de login y una pantalla protegida
(`panel.html`) a la que no se entra sin un token válido.

## Archivos que forman el login

Backend:

| Archivo | Responsabilidad |
|---|---|
| [`SecurityConfig.java`](../backend/src/main/java/com/uis/upland/shared/security/SecurityConfig.java) | Qué rutas son públicas, sin sesión de servidor, CORS y BCrypt. |
| [`JwtService.java`](../backend/src/main/java/com/uis/upland/shared/security/JwtService.java) | Firma y valida los tokens. |
| [`JwtAuthenticationFilter.java`](../backend/src/main/java/com/uis/upland/shared/security/JwtAuthenticationFilter.java) | Lee el header `Authorization` en cada petición. |
| [`SecurityErrorHandler.java`](../backend/src/main/java/com/uis/upland/shared/security/SecurityErrorHandler.java) | Responde 401 y 403 en JSON. |
| [`AuthController.java`](../backend/src/main/java/com/uis/upland/usuarios/api/AuthController.java) | Endpoints de registro y login. |
| [`UsuarioController.java`](../backend/src/main/java/com/uis/upland/usuarios/api/UsuarioController.java) | Endpoint protegido `/api/usuarios/yo`. |
| [`UsuarioService.java`](../backend/src/main/java/com/uis/upland/usuarios/domain/UsuarioService.java) | Reglas de registro y verificación de la contraseña. |
| [`Usuario.java`](../backend/src/main/java/com/uis/upland/usuarios/domain/Usuario.java) | Entidad de la tabla `usuarios`. |

Frontend:

| Archivo | Responsabilidad |
|---|---|
| [`login.html`](../frontend/login.html) y [`login.js`](../frontend/js/login.js) | Formulario de login. |
| [`registro.html`](../frontend/registro.html) y [`registro.js`](../frontend/js/registro.js) | Formulario de registro. |
| [`api.js`](../frontend/js/api.js) | Único punto por el que salen las llamadas `fetch`. |
| [`sesion.js`](../frontend/js/sesion.js) | Guarda, lee y borra el token. |
| [`panel.html`](../frontend/panel.html) y [`panel.js`](../frontend/js/panel.js) | Pantalla protegida. |

## El flujo completo, paso a paso

### 1. Registro

1. El usuario envía el formulario. `registro.js` llama a `registrar()` de `api.js`, que
   hace `fetch` con `POST /api/auth/registro` y el cuerpo en JSON.
2. `AuthController` valida el cuerpo (`@Valid`): email con formato correcto y contraseña
   de 8 a 72 caracteres.
3. `UsuarioService.registrar()` pasa el email a minúsculas, comprueba que no exista y
   calcula el hash con `BCryptPasswordEncoder`. La contraseña nunca se guarda ni se escribe
   en los logs.
4. Se inserta la fila. La unicidad del email la garantiza la restricción `UNIQUE` de la
   tabla, no solo la consulta previa.
5. El backend responde 201 con los datos del usuario, sin token. El frontend lleva al
   login.

### 2. Login y emisión del token

1. `login.js` llama a `iniciarSesion(email, password)`, que hace `POST /api/auth/login`.
2. `UsuarioService.login()` busca el usuario y compara la contraseña con
   `passwordEncoder.matches()`. Si el email no existe, la cuenta está inactiva o la
   contraseña no coincide, responde lo mismo: 401 "Email o contraseña incorrectos". No se
   distingue el motivo para no revelar qué emails tienen cuenta.
3. `JwtService.emitir()` construye el token:
   - `sub`: el id del usuario.
   - `rol`: su rol.
   - `iat` y `exp`: emisión y vencimiento, una hora después.
   - Firma HS256 con un secreto que el backend lee de la variable de entorno
     `JWT_SECRET`. El secreto no está escrito en ninguna clase Java.
4. El backend responde `{ "token": "...", "expiraEn": 3600 }`.
5. `login.js` guarda el token en `localStorage` y redirige a `panel.html`.

Un JWT tiene tres partes separadas por puntos: cabecera, contenido y firma. Las dos
primeras van codificadas en base64, no cifradas: cualquiera puede leerlas. Lo que impide
falsificarlo es la firma, que solo puede calcular quien conoce el secreto.

### 3. Acceso a un recurso protegido

1. `panel.js` llama a `obtenerYo()`. La función `peticion()` de `api.js` agrega a la
   llamada el header `Authorization: Bearer <token>`.
2. Como el frontend está en otro origen y la petición lleva ese header, el navegador
   envía primero un `OPTIONS` (preflight de CORS). `SecurityConfig` lo permite para los
   orígenes configurados.
3. `JwtAuthenticationFilter` se ejecuta antes de llegar al controller. Extrae el token y
   llama a `JwtService.validar()`, que recalcula la firma con el secreto y comprueba el
   vencimiento.
4. Si es válido, el filtro deja en el `SecurityContext` quién es el usuario y su rol. No
   se consulta la base de datos ni existe sesión en el servidor
   (`SessionCreationPolicy.STATELESS`): toda la información viaja en el token.
5. Spring Security comprueba que la ruta permita a ese usuario y la petición llega a
   `UsuarioController`, que recibe la identidad con `@AuthenticationPrincipal`. El id sale
   del token, no de la URL, así que nadie puede pedir los datos de otro usuario.

### 4. Qué pasa cuando el token no sirve

| Situación | Respuesta del backend | Qué hace el frontend |
|---|---|---|
| No hay token | 401 `NO_AUTENTICADO` | `panel.html` redirige al login antes de llamar. |
| Token manipulado o firmado con otro secreto | 401 `TOKEN_INVALIDO` | Borra el token y redirige al login. |
| Token vencido | 401 `TOKEN_VENCIDO` | Borra el token y redirige al login. |
| Token válido sin el rol necesario | 403 `ACCESO_DENEGADO` | Muestra el mensaje. |

El manejo del 401 está escrito una sola vez, en `peticion()` de `api.js`. Los errores
tienen siempre el mismo formato: `{ "codigo", "mensaje", "detalles" }`.

Cerrar sesión consiste en borrar el token de `localStorage`. El backend no guarda nada
que haya que invalidar.

## Decisiones tomadas

- **Token en `localStorage`.** Es vulnerable a XSS: un script inyectado en la página
  podría leerlo. Una cookie `HttpOnly` lo evitaría, pero obliga a protegerse de CSRF y
  complica tener frontend y backend en orígenes distintos. Se acepta `localStorage` para
  el alcance del proyecto, y como mitigación el frontend escribe en la página solo con
  `textContent`, nunca con `innerHTML`.
- **Sin CSRF.** Un ataque CSRF aprovecha que el navegador adjunta las cookies por su
  cuenta. Aquí no hay cookies de sesión y el token va en un header que solo agrega el
  código propio.
- **Verificación directa de la contraseña.** `UsuarioService` busca el usuario y compara
  el hash. No se usa el `UserDetailsService` de Spring porque agrega piezas que este login
  no necesita.
- **Limitación conocida.** Como el token no se consulta contra la base, un usuario
  desactivado conserva el acceso hasta que su token venza, como máximo una hora.

## Cómo comprobarlo

Con el proyecto levantado según el [README](../README.md) y las herramientas del navegador
abiertas (F12):

1. Inicia sesión y abre Application → Local Storage: ahí está `upland.token`.
2. En la consola, lee su contenido:
   ```js
   JSON.parse(atob(localStorage.getItem('upland.token').split('.')[1]))
   ```
3. En Network, recarga el panel y abre la petición `yo`: lleva
   `Authorization: Bearer ...` y responde 200.
4. Altera el token y recarga el panel:
   ```js
   localStorage.setItem('upland.token', localStorage.getItem('upland.token') + 'x')
   ```
   La petición `yo` responde 401 y la aplicación vuelve al login.
5. Sin sesión, abre `panel.html` directamente: redirige al login.

## Pruebas realizadas

- 15 casos contra la API: registro, email duplicado, validación, login correcto e
  incorrecto, token manipulado, token vencido y token firmado con otro secreto.
- Recorrido en un navegador real desde `http://localhost:5500` y desde
  `http://127.0.0.1:5500`, sin errores de CORS.

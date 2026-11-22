# Mila Estudio – Backend

Backend del sistema de gestión de turnos de **Mila Estudio**, una estética que ofrece diferentes servicios de belleza y bienestar.

## Descripción

Mila Estudio cuenta con distintas profesionales, cada una especializada en un área de trabajo. El sistema busca centralizar la gestión de turnos, permitiendo organizar los servicios ofrecidos y las agendas de cada profesional.

Actualmente, la estética cuenta con las siguientes áreas:

- **Manicuría:** servicios de cuidado y embellecimiento de uñas.
- **Masajes:** tratamientos de relajación y bienestar.
- **Pestañas:** servicios de belleza y cuidado de pestañas.
- **Cejas:** servicios de diseño y perfilado de cejas.

Cada profesional trabaja dentro de su respectiva área, ofreciendo servicios específicos según su especialidad.

## Objetivo

Desarrollar una API que permita gestionar la información necesaria para el funcionamiento del sistema de turnos de Mila Estudio, facilitando la organización de profesionales, servicios y agendas de atención.

## Tecnologías

- Node.js
- pnpm

## Instalación y ejecución

### Requisitos previos

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Paso 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
```

### Paso 2. Ingresar al proyecto

```bash
cd mila-estudio-backend
```

### Paso 3. Instalar las dependencias

```bash
pnpm install
```

## Cómo probarlo

### 1. Requisitos

- Node.js 20 o superior.
- pnpm 11 o superior.
- PostgreSQL 14 o superior, accesible desde `DATABASE_URL`.

### 2. Configuración

Copiar el archivo de ejemplo y completar los valores obligatorios:

```bash
cp .env.example .env
```

Completar `DATABASE_URL` y `JWT_SECRET`. `TIMEZONE` puede omitirse: por defecto usa `America/Argentina/Buenos_Aires`. El esquema se crea y actualiza automáticamente al inicializar el `DataSource` (`synchronize: true`), por lo que no hay migraciones que ejecutar.

### 3. Arranque

```bash
pnpm install
pnpm seed:demo
pnpm dev
```

`pnpm seed:demo` carga datos de prueba de un tirón y puede repetirse: usa claves naturales estables y actualiza los registros existentes en lugar de duplicarlos. La API queda en `http://localhost:3000` salvo que `PORT` indique otro valor.

### 4. Credenciales demo

| Uso | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@mila.test` | `AdminDemo123!` |
| Usuario normal | `user@mila.test` | `UserDemo123!` |

Son credenciales **solo para prueba**, publicadas en el repositorio a propósito. No deben usarse en ningún entorno real.

### 5. Thunder Client

1. Importar `thunder-client/mila-estudio.json` desde `Collections` → `Import` → `From File`.
2. Verificar la variable `baseUrl` (`http://localhost:3000` por defecto).
3. Hacer login con `admin@mila.test` y pegar el JWT devuelto en `adminToken`.
4. Hacer login con `user@mila.test` y pegar el JWT devuelto en `token`.
5. Los UUID fijos de la colección son ejemplos: reemplazarlos por ids reales devueltos por los `GET` después de correr el seed.

### 6. Endpoints

Las 24 rutas de negocio más las 2 de autenticación:

- Públicas: `POST /api/auth/register`, `POST /api/auth/login`.
- `GET` públicos (8): `/api/areas`, `/api/areas/:id`, `/api/professionals`, `/api/professionals/:id`, `/api/services`, `/api/services/:id`, `/api/appointments`, `/api/appointments/:id`.
- Escritura con `Authorization: Bearer <token>` (12): `POST`, `PUT` y `PATCH` de `/api/areas`, `/api/professionals`, `/api/services` y `/api/appointments`; en turnos el `PATCH` es `/api/appointments/:id/status`.
- `DELETE` con token de administrador (4): `/api/areas/:id`, `/api/professionals/:id`, `/api/services/:id`, `/api/appointments/:id`.

### 7. Casos de error esperados

| Código | Cómo provocarlo |
| --- | --- |
| `400` | Enviar `{"name":""}` a `POST /api/areas`, o un `price` negativo en un servicio. |
| `401` | Llamar a una escritura sin header `Authorization`, o hacer login con contraseña incorrecta. |
| `403` | Usar el token de `user@mila.test` en cualquier `DELETE`. |
| `404` | Pedir `/api/areas/99999999-9999-4999-8999-999999999999`. |
| `409` | Crear un turno solapado con uno sembrado para la misma profesional, o con un servicio de otra área. |
| `500` | Interrumpir PostgreSQL durante una request y verificar el error en los logs del servidor. |

Todas las respuestas de error usan la envoltura `{"error":{"message":"...","details":[...]}}`.

### 8. Comandos de verificación

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Contrato de API

Todas las rutas están bajo `/api`. El cuerpo y los parámetros se validan con zod. Las respuestas contienen objetos planos (DTO), nunca entidades de TypeORM.

### Autenticación y permisos

`POST /api/auth/register` crea usuarios con rol `user`. `POST /api/auth/login` devuelve un JWT con validez de 7 días; el payload solo expone `sub` y `role` como claims de aplicación. El email se normaliza con `trim` y minúsculas antes de buscarlo o guardarlo.

Las rutas `GET` son públicas. Las rutas `POST`, `PUT` y `PATCH` requieren el header `Authorization: Bearer <token>` con cualquier usuario autenticado. Las rutas `DELETE` requieren además el rol `admin`.

Para crear el primer administrador, completar `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env` y ejecutar `pnpm seed:admin`. El script crea o actualiza ese usuario con rol `admin`; no agrega secretos al repositorio.

| Método | Ruta | Respuesta correcta |
| --- | --- | --- |
| POST | `/api/auth/register` | `201` – usuario creado / `400` si el cuerpo es inválido / `409` si el email ya está registrado |
| POST | `/api/auth/login` | `200` – JWT / `400` si el cuerpo es inválido / `401` si las credenciales son inválidas |
| GET | `/api/areas` | `200` – lista de áreas |
| GET | `/api/areas/:id` | `200` – área / `404` si no existe |
| POST | `/api/areas` | `201` – área creada / `400` si el cuerpo es inválido |
| PUT | `/api/areas/:id` | `200` – área reemplazada / `400` si el cuerpo es inválido / `404` si no existe |
| PATCH | `/api/areas/:id` | `200` – área actualizada / `404` si no existe |
| DELETE | `/api/areas/:id` | `204` – área eliminada / `404` si no existe |
| GET | `/api/professionals` | `200` – lista de profesionales |
| GET | `/api/professionals/:id` | `200` – profesional / `404` si no existe |
| POST | `/api/professionals` | `201` – profesional creado / `400` si el cuerpo es inválido |
| PUT | `/api/professionals/:id` | `200` – profesional reemplazado / `400` si el cuerpo es inválido / `404` si no existe |
| PATCH | `/api/professionals/:id` | `200` – profesional actualizado / `404` si no existe |
| DELETE | `/api/professionals/:id` | `204` – profesional eliminado / `404` si no existe |
| GET | `/api/services` | `200` – lista de servicios ofrecidos |
| GET | `/api/services/:id` | `200` – servicio / `404` si no existe |
| POST | `/api/services` | `201` – servicio creado / `400` si el cuerpo es inválido |
| PUT | `/api/services/:id` | `200` – servicio reemplazado / `400` si el cuerpo es inválido / `404` si no existe |
| PATCH | `/api/services/:id` | `200` – servicio actualizado / `404` si no existe |
| DELETE | `/api/services/:id` | `204` – servicio eliminado / `404` si no existe |
| GET | `/api/appointments?professionalId=<uuid>&date=YYYY-MM-DD` | `200` – lista de turnos; ambos filtros son opcionales |
| GET | `/api/appointments/:id` | `200` – turno / `404` si no existe |
| POST | `/api/appointments` | `201` – turno creado / `400` cuerpo inválido / `404` profesional o servicio inexistente / `409` área incompatible o superposición de horarios |
| PUT | `/api/appointments/:id` | `200` – turno reemplazado / `400` cuerpo inválido / `404` si no existe / `409` área incompatible o superposición de horarios |
| PATCH | `/api/appointments/:id/status` | `200` – turno confirmado o cancelado / `404` si no existe / `409` si al confirmar se superpone con otro turno |
| DELETE | `/api/appointments/:id` | `204` – turno eliminado / `404` si no existe |

El filtro `date` usa el día local del salón configurado en `TIMEZONE` (por defecto `America/Argentina/Buenos_Aires`). Incluye turnos que se cruzan con la medianoche local: un turno pertenece al día en que empieza y también al día en que termina. Un turno que finaliza exactamente a la medianoche local siguiente no pertenece a ese día siguiente.

Un turno pertenece a un profesional y a un servicio de su misma área. El campo `endAt` se calcula como `start + service.durationMinutes`. Dos turnos no cancelados del mismo profesional no pueden superponerse en el intervalo semiabierto `[start, endAt)`.

`PUT /:id` reemplaza el recurso completo; `PATCH` conserva su comportamiento parcial. Los campos obligatorios del `PUT` son:

- Áreas: `name`. `description` es opcional.
- Profesionales: `firstName`, `lastName` y `areaId`.
- Servicios: `name`, `durationMinutes`, `price` y `areaId`. `price` acepta de `0` a `99999999.99` con hasta dos decimales.
- Turnos: `professionalId`, `serviceId`, `start`, `clientName`, `clientPhone` y `status`. `clientEmail` y `notes` son opcionales. `endAt` se recalcula y no se envía. La revalidación ocurre dentro de la transacción con el lock del profesional; la comprobación de superposición excluye el propio turno para que no se considere conflicto consigo mismo.

Los campos opcionales usan `.nullish()`: si se omiten o se envían como `null`, se almacenan como `null`.

### Manejo de errores en los controladores

Los handlers asincrónicos usan `try/catch` explícito: envuelven todo el cuerpo y el `catch` reenvía el error con `next(error)`. El middleware `errorHandler` sigue siendo el único lugar que decide el status y el cuerpo de la respuesta; por eso los controladores no devuelven entidades de TypeORM, sino DTOs generados por mappers.

Los `DELETE` responden `204` con `res.status(204).end()`: la operación terminó correctamente, pero no hay cuerpo que devolver.

### Formato de errores

Todas las respuestas de error usan la misma envoltura:

```json
{
  "error": {
    "message": "Invalid request",
    "details": ["start: Invalid datetime"]
  }
}
```

Los códigos son `400` (validación, JSON malformado), `401` (token ausente, inválido o credenciales incorrectas), `403` (usuario autenticado sin rol `admin`), `404` (recurso inexistente), `409` (conflicto de negocio o restricción de base de datos) y `500` (error inesperado).

### Variables de entorno

Copiar `.env.example` a `.env` y completar los valores antes de iniciar la API:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto HTTP del servidor |
| `JWT_SECRET` | Secreto usado para firmar y verificar JWT; obligatorio |
| `DATABASE_URL` | Cadena de conexión PostgreSQL obligatoria |
| `TIMEZONE` | Zona horaria IANA usada para los filtros de día; por defecto `America/Argentina/Buenos_Aires` |
| `ADMIN_EMAIL` | Opcional. Email del usuario admin creado o actualizado por `pnpm seed:admin` |
| `ADMIN_PASSWORD` | Opcional. Contraseña del usuario admin creado o actualizado por `pnpm seed:admin` |

La conexión se configura únicamente desde `DATABASE_URL`; el esquema se sincroniza automáticamente desde las entidades (`synchronize: true`). Un valor inválido de `TIMEZONE` hace que la API falle al iniciar, con el error en los logs.

### Esquema y datos

TypeORM crea y actualiza el esquema automáticamente desde las entidades al iniciar la API (`synchronize: true`). No hay migraciones: los datos de prueba se cargan con `pnpm seed:demo` y el admin inicial con `pnpm seed:admin`.

### Colección Thunder Client

1. Abrir Thunder Client en VS Code.
2. En `Collections`, elegir `Import` → `From File` y seleccionar `thunder-client/mila-estudio.json`.
3. La variable `baseUrl` queda configurada en `http://localhost:3000`; ajustarla si el servidor usa otro `PORT`.
4. Después de hacer login, copiar el `token` devuelto en la variable `token`. Para las peticiones `DELETE`, usar el token de un usuario admin en la variable `adminToken`.

La colección incluye los 20 endpoints anteriores, los 4 `PUT` y los 2 endpoints de autenticación. Las operaciones de escritura ya envían `Authorization: Bearer <token>`; las de eliminación usan `adminToken`. También trae requests de error para `400`, `401`, `403`, `404` y `409`, con la envoltura de errores estándar.

### Comandos útiles

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm seed:admin
pnpm seed:demo
pnpm build
pnpm start
```

## Estado del proyecto

En desarrollo.

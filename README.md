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

## Contrato de API

Todas las rutas están bajo `/api`. El cuerpo y los parámetros se validan con zod. Las respuestas contienen objetos planos (DTO), nunca entidades de TypeORM.

| Método | Ruta | Respuesta correcta |
| --- | --- | --- |
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

Los códigos son `400` (validación, JSON malformado), `404` (recurso inexistente), `409` (conflicto de negocio o restricción de base de datos) y `500` (error inesperado).

### Variables de entorno

Copiar `.env.example` a `.env` y completar los valores antes de iniciar la API:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto HTTP del servidor |
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL |
| `DB_USER` | Usuario de PostgreSQL |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `DB_NAME` | Nombre de la base de datos |
| `DATABASE_URL` | Opcional. Cadena de conexión PostgreSQL; cuando está presente tiene prioridad sobre `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` |
| `TIMEZONE` | Zona horaria IANA usada para los filtros de día; por defecto `America/Argentina/Buenos_Aires` |

La conexión se configura únicamente desde estas variables; `synchronize` está desactivado. `DATABASE_URL` aparece comentada en `.env.example`: descomentarla la habilita; si se deja comentada o vacía se usan las variables `DB_*`. Un valor inválido de `TIMEZONE` hace que la API falle al iniciar, con el error en los logs.

### Migraciones

```bash
pnpm migration:run
```

El comando inicializa el `DataSource` una vez, aplica la migración inicial (tablas, enum de estado, columna `price` de servicios como `numeric(10,2)`, claves foráneas con `RESTRICT` e índices) y cierra la conexión.

### Colección Thunder Client

1. Abrir Thunder Client en VS Code.
2. En `Collections`, elegir `Import` → `From File` y seleccionar `thunder-client/mila-estudio.json`.
3. La variable `baseUrl` queda configurada en `http://localhost:3000`; ajustarla si el servidor usa otro `PORT`.

La colección incluye los 20 endpoints anteriores más los 4 `PUT`, y trae requests de error para `400` por cuerpo inválido, `404` por id inexistente y fecha imposible en los filtros de turnos. No incluye requests `401` porque este bloque todavía no implementa autenticación; se agregarán cuando exista el middleware de auth y devuelva `401` con la envoltura de errores estándar.

### Comandos útiles

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

## Estado del proyecto

En desarrollo.

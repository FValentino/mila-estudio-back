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
| PATCH | `/api/areas/:id` | `200` – área actualizada / `404` si no existe |
| DELETE | `/api/areas/:id` | `204` – área eliminada / `404` si no existe |
| GET | `/api/professionals` | `200` – lista de profesionales |
| GET | `/api/professionals/:id` | `200` – profesional / `404` si no existe |
| POST | `/api/professionals` | `201` – profesional creado / `400` si el cuerpo es inválido |
| PATCH | `/api/professionals/:id` | `200` – profesional actualizado / `404` si no existe |
| DELETE | `/api/professionals/:id` | `204` – profesional eliminado / `404` si no existe |
| GET | `/api/services` | `200` – lista de servicios ofrecidos |
| GET | `/api/services/:id` | `200` – servicio / `404` si no existe |
| POST | `/api/services` | `201` – servicio creado / `400` si el cuerpo es inválido |
| PATCH | `/api/services/:id` | `200` – servicio actualizado / `404` si no existe |
| DELETE | `/api/services/:id` | `204` – servicio eliminado / `404` si no existe |
| GET | `/api/appointments?professionalId=<uuid>&date=YYYY-MM-DD` | `200` – lista de turnos; ambos filtros son opcionales |
| GET | `/api/appointments/:id` | `200` – turno / `404` si no existe |
| POST | `/api/appointments` | `201` – turno creado / `400` cuerpo inválido / `404` profesional o servicio inexistente / `409` área incompatible o superposición de horarios |
| PATCH | `/api/appointments/:id/status` | `200` – turno confirmado o cancelado / `404` si no existe / `409` si al confirmar se superpone con otro turno |
| DELETE | `/api/appointments/:id` | `204` – turno eliminado / `404` si no existe |

El filtro `date` usa el día local del salón configurado en `TIMEZONE` (por defecto `America/Argentina/Buenos_Aires`). Incluye turnos que se cruzan con la medianoche local: un turno pertenece al día en que empieza y también al día en que termina. Un turno que finaliza exactamente a la medianoche local siguiente no pertenece a ese día siguiente.

Un turno pertenece a un profesional y a un servicio de su misma área. El campo `endAt` se calcula como `start + service.durationMinutes`. Dos turnos no cancelados del mismo profesional no pueden superponerse en el intervalo semiabierto `[start, endAt)`.

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
| `TIMEZONE` | Zona horaria IANA usada para los filtros de día; por defecto `America/Argentina/Buenos_Aires` |

La conexión se configura únicamente desde estas variables; `synchronize` está desactivado. Un valor inválido de `TIMEZONE` hace que la API falle al iniciar, con el error en los logs.

### Migraciones

```bash
pnpm migration:run
```

El comando inicializa el `DataSource` una vez, aplica la migración inicial (tablas, enum de estado, claves foráneas con `RESTRICT` e índices) y cierra la conexión.

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

# Plan Incremental de Integración Supabase (Sin Reset + `respondent_hash`)

## Resumen
Implementaremos la migración a Supabase sin reiniciar el proyecto remoto ni rehacer el historial.
Base: conservar las migraciones actuales ya aplicadas y añadir una migración incremental para anonimización con hash por `curso + semestre`, más el refactor progresivo del frontend (operativo: admin/profesor/estudiante).

## Cambios de API/Esquema (públicos y de contrato)
1. `public.responses`
- Agregar columna `respondent_hash text null`.
- Agregar índice único parcial: `unique(event_id, respondent_hash) where respondent_hash is not null`.
- Mantener `answers`, `event_id`, `submitted_at` sin cambios.

2. RPC `public.submit_event_response(p_qr_code text, p_answers jsonb)`
- Mantener firma.
- Cambiar implementación para calcular `respondent_hash` server-side usando `auth.uid() + course_id + semester`.
- Insertar en `responses` incluyendo `respondent_hash`.

3. Tipos TS generados
- Regenerar [types.ts](/Users/rafa/Desktop/Desktop%20-%20Rafael%E2%80%99s%20MacBook%20Air/Human%20Reinvention/Aplicaciones%20Web/insightful-feedback/src/integrations/supabase/types.ts) para reflejar nueva columna.

## Plan de implementación

## Fase 1: Migraciones SQL incrementales (sin reset)
1. Crear migración `add_responses_respondent_hash`.
2. SQL de la migración:
- `alter table public.responses add column if not exists respondent_hash text;`
- `create unique index if not exists ux_responses_event_hash on public.responses(event_id, respondent_hash) where respondent_hash is not null;`
- `create index if not exists idx_responses_event_submitted on public.responses(event_id, submitted_at desc);`
3. No forzar `not null` en esta fase para no bloquear filas antiguas.

## Fase 2: Secreto para HMAC y hardening
1. Crear esquema privado `app_private` (si no existe).
2. Crear tabla de configuración privada con `hash_pepper`.
3. Poblarla una sola vez con valor aleatorio.
4. Revocar permisos a `anon`/`authenticated` sobre `app_private`.
5. Objetivo: usar HMAC, no hash simple.

## Fase 3: Actualizar función `submit_event_response`
1. Nueva versión de función en migración `update_submit_event_response_with_hash`.
2. Flujo interno:
- Validar autenticación y payload.
- Resolver evento por QR.
- Validar estado y expiración.
- Insertar en `response_receipts` para unicidad por estudiante/evento.
- Obtener `course_id` y `semester`.
- Calcular `respondent_hash = encode(hmac(auth.uid||course_id||semester, pepper, 'sha256'), 'hex')`.
- Insertar `responses(event_id, answers, respondent_hash)`.
3. Mantener respuestas de estado actuales: `invalid_qr`, `expired`, `already_submitted`, `ok`.

## Fase 4: RLS y permisos
1. Mantener políticas actuales para evitar regresiones.
2. Verificar que `responses` siga sin inserción directa para cliente.
3. Confirmar `grant execute` solo a `authenticated` para RPC.

## Fase 5: Regeneración de tipos y capa frontend
1. Ejecutar `supabase db push` (sin `db reset`).
2. Ejecutar `supabase gen types typescript --linked --schema public > src/integrations/supabase/types.ts`.
3. Actualizar hooks/servicios para usar RPC y tablas reales.
4. Migrar pantallas operativas en orden:
- Admin: catálogos y configuración.
- Profesor: generación y listado de eventos QR.
- Estudiante: dashboard de eventos activos y envío de encuesta.

## Fase 6: Validación y criterios de aceptación
1. DB:
- Existe `respondent_hash` en `responses`.
- Índice único parcial activo.
2. RPC:
- Misma persona en mismo curso-semestre produce mismo hash.
- Misma persona en distinto curso o semestre produce hash distinto.
- Doble envío al mismo evento retorna `already_submitted`.
3. UI operativa:
- Flujo completo profesor -> QR -> estudiante responde funciona sin mocks.
4. Calidad:
- `npm run test` verde.
- `npm run lint` sin errores en archivos tocados.

## Casos de prueba
1. Estudiante A responde evento E1 del curso C1 semestre S1.
2. Estudiante A responde evento E2 del curso C1 semestre S1.
- Esperado: mismo `respondent_hash`.
3. Estudiante A responde evento E3 del curso C2 o semestre S2.
- Esperado: `respondent_hash` distinto.
4. Estudiante A intenta re-enviar E1.
- Esperado: `already_submitted`, sin nueva fila en `responses`.
5. Usuario no autenticado invoca RPC.
- Esperado: error de autorización.

## Supuestos y defaults
1. No haremos reset remoto ni local.
2. Se mantiene alcance fase 1: operativo (no analítica institucional completa).
3. Filas históricas previas pueden quedar con `respondent_hash = null`; el sistema nuevo sí lo llenará en todas las respuestas nuevas.
4. OAuth Microsoft queda fuera de este corte; auth inicial email/password.

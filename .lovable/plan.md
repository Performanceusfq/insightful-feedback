

# Plataforma de Gestión del Desempeño Docente

Sistema completo de feedback continuo por evento de clase, con analítica e insights IA para universidades. Interfaz en español, autenticación Microsoft, single-tenant.

---

## Sprint 1 – Estructura Académica Base
- Configurar Lovable Cloud (base de datos, auth, edge functions)
- Configurar autenticación con Microsoft (OAuth)
- Crear tablas: departamentos, profesores, clases, usuarios
- Crear tabla de roles (estudiante, profesor, admin, coordinador, director) con soporte multi-rol
- Implementar sistema de navegación con cambio de vista según rol activo
- Panel de Admin: CRUD de departamentos, profesores, clases y asignación de roles

## Sprint 2 – Banco de Preguntas
- Crear tabla de preguntas con categorías y tipos (escala Likert, abierta, opción múltiple)
- Panel de Admin: crear, editar y organizar preguntas
- Configurar encuestas: asignar preguntas fijas y aleatorias por clase
- Vista previa de encuesta generada

## Sprint 3 – Eventos de Clase + QR
- Crear tabla de eventos de clase (instancia con fecha y hora)
- Panel del Profesor: generar código QR por evento con tiempo de expiración
- Configurar frecuencia y horarios de eventos desde Admin
- QR vinculado a clase + evento específico

## Sprint 4 – Respuestas de Estudiantes
- Flujo estudiante: escanear QR → autenticarse → responder encuesta
- Interfaz minimalista optimizada para móvil (< 1 minuto)
- Validar unicidad: 1 respuesta por estudiante por evento
- Garantizar anonimato real (desvincular identidad de respuestas)
- Soporte para comentarios abiertos
- Bloqueo automático de respuestas al cerrar encuesta

## Sprint 5 – Dashboard del Profesor
- Dashboard por evento de clase con resultados individuales
- Dashboard agregado por clase (todas las sesiones)
- Visualización de tendencias en el tiempo con gráficos
- Análisis de comentarios abiertos
- Sección para publicar "acciones de mejora" (cerrar loop de feedback)
- Vista estudiante: ver acciones tomadas por el profesor

## Sprint 6 – Analítica Institucional
- Dashboard Coordinador: analítica filtrada por departamento
  - Profesores en riesgo y destacados
  - Evolución temporal
- Dashboard Director: analítica global institucional
  - Comparativa entre departamentos
  - Detección de patrones globales
- Misma interfaz con filtros según alcance del rol

## Sprint 7 – Módulo de IA
- Edge function con Lovable AI para generar insights
- **IA para Profesor:**
  - Insight semanal automático
  - Recomendaciones pedagógicas
  - Alertas de caída de desempeño
- **IA para Gestión (Coordinador/Director):**
  - Detección de profesores críticos
  - Identificación de top performers
  - Recomendaciones de mentoría/intervención/reconocimiento
  - Patrones por departamento


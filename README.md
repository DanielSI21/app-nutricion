# Mi plan nutricional

Prototipo funcional, mobile-first y en español para consultar un plan, elegir opciones prescritas, registrar consumos, detectar diferencias y revisar propuestas de ajuste para las comidas pendientes del mismo día.

> Los alimentos y valores nutrimentales incluidos son demostrativos o aproximados. Este prototipo no sustituye las indicaciones de una nutrióloga ni debe usarse para decisiones clínicas.

## Ejecutar

Requiere Node.js 20 o posterior.

```bash
npm install
npm run dev
```

La app funciona sin cuentas ni servicios externos. En ese caso muestra `Modo demo` y persiste el estado en `localStorage` bajo la clave `mi-plan-nutricional:v1`.

Comandos de calidad:

```bash
npm run test
npm run build
npm run preview
```

## Flujos implementados

- Pantalla Hoy con fecha, progreso, consumo/objetivo y cuatro comidas.
- Plan completo proveniente de `EJEMPLO PLAN DE ALIMENTACION.txt`, incluidas todas las alternativas y cantidades.
- Selección persistente de alternativas por grupo y horarios editables.
- Registro exacto, edición de cantidades, eliminación y adición de alimentos o recetas.
- Registro de comida omitida con lenguaje neutral.
- Comparación en tiempo real de planeado, registrado y diferencia.
- Clasificación `within-plan`, `under`, `over` o `different-distribution` con tolerancia de 5 %.
- Propuesta determinista que afecta solo comidas pendientes, nunca genera valores negativos y requiere confirmación.
- Historial de propuestas aceptadas y rechazadas con estado previo.
- Catálogo buscable por nombre/marca, filtro SMAE, recientes y captura manual validada con Zod.
- Palomitas de cine con controles de 60/120 g y refresco regular editable, ambos marcados como aproximados.
- Recetas calculadas por ingredientes y recetas con información manual.
- Reinicio completo del modo demo desde Perfil.
- Navegación accesible mediante teclado, etiquetas de formulario, diálogos, estados vacíos, skeleton y `aria-live`.

## Arquitectura

```text
src/
├── domain/       tipos estrictos y reglas de cálculo puras
├── data/         seeds, repositorios y adaptador de Supabase
├── state/        sesión React y operaciones persistentes
├── components/   shell, navegación y componentes compartidos
├── pages/        Hoy, Mi plan, Agregar, Recetas, Perfil y propuesta
├── styles/       sistema visual responsive
└── test/         escenarios funcionales
```

`NutritionRepository` desacopla la interfaz de la persistencia:

- `LocalNutritionRepository`: valida el JSON almacenado con Zod y recupera seeds ante datos inválidos.
- `SupabaseNutritionRepository`: se activa solamente al existir las variables de entorno. El mapeo remoto está aislado en este adaptador; sin sesión conserva el funcionamiento local.

Los tipos de dominio incluyen `PatientProfile`, `NutritionTarget`, `SmaeGroup`, `Food`, `FoodServing`, `NutritionPlan`, `PlanMeal`, `MealChoiceGroup`, `MealOption`, `Recipe`, `RecipeIngredient`, `DailyLog`, `MealLog`, `FoodLogEntry`, `RecalculationProposal` y `RecalculationEvent`.

## Fórmulas y presets

La fórmula implementada conserva decimales y redondea solo en la presentación:

```text
P = pesoKg × factorProteína
G = pesoKg × factorGrasa
C = (caloríasObjetivo − P × 4 − G × 9) / 4
```

Si el remanente para carbohidratos es negativo se lanza un error de configuración. El preset de fórmula (74.2 kg, 2,009 kcal) produce 163.24 g P, 51.94 g G y 222.145 g C.

El preset SMAE es deliberadamente independiente: 138 g P, 85 g G y 239 g C (2,273 kcal). La app no mezcla ni fuerza la coincidencia entre ambos ejemplos.

Para un grupo SMAE:

```text
macro = equivalentes × macroPorEquivalente
kcal = proteína × 4 + grasa × 9 + carbohidratos × 4
```

Para escalar un alimento:

```text
factor = cantidadConsumida / cantidadReferencia
macroConsumido = macroReferencia × factor
```

## Recálculo

El algoritmo suma registros reales, aplica `max(0, objetivo − consumido)` y reparte el remanente entre comidas pendientes según el peso original de cada macro. Los equivalentes se aproximan en pasos de 0.5. Si la aproximación no es cercana, la UI conserva los macros como referencia y lo indica expresamente.

La propuesta:

- no toca comidas registradas u omitidas;
- no cambia el objetivo diario;
- no oculta excesos consumidos;
- no produce cantidades negativas;
- no se guarda hasta pulsar “Aplicar propuesta”;
- puede rechazarse sin modificar el plan.

## Supabase

Archivos preparados, sin ejecutar remotamente:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/seed.sql`
- `src/data/supabase/database.types.ts`
- `.env.example`

Para habilitar el adaptador:

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
```

La migración crea claves UUID, restricciones, índices, relaciones y RLS explícito en todas las tablas expuestas. Los pacientes solo escriben sus propios registros; las nutriólogas solo acceden a pacientes asignados y son quienes modifican prescripciones. Los catálogos verificados son solo lectura para pacientes. Nunca se utiliza una service role key en el frontend.

Antes de producción debe completarse el mapeo CRUD remoto del adaptador, configurar autenticación y revisar las políticas con pruebas de integración contra un proyecto Supabase local.

## Pruebas

La suite cubre:

- fórmula, decimales y configuración inválida;
- equivalentes SMAE y escalado 120 → 60 g;
- suma de ingredientes de recetas;
- detección de consumo menor/exceso;
- reparto solo entre comidas pendientes;
- protección contra negativos;
- aceptación/rechazo de propuestas;
- los tres casos funcionales solicitados.

## Limitaciones nutricionales

- Los valores por alimento son datos demostrativos, no una base clínica validada.
- Las cifras de palomitas y refresco son aproximaciones visibles como tales y varían por cine, marca y preparación.
- “Verduras libres” se conserva como indicación textual; la app permite registrarlas y no afirma que aporten cero energía.
- La traducción de macros a equivalentes es una heurística determinista en pasos de 0.5, no una optimización clínica exhaustiva.
- Las recetas manuales no pueden derivar equivalentes sin desglose de ingredientes.
- Todo ajuste debe revisarse con la profesional responsable.

## Despliegue

`npm run build` produce un sitio estático en `dist/`. Puede desplegarse en Vercel, Netlify o cualquier hosting estático con fallback de rutas a `index.html`. Configure las variables `VITE_*` solo si utilizará Supabase.

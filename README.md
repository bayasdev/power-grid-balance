# Power Grid Balance Dashboard

Un dashboard en tiempo real para monitorear el balance de energía eléctrica en España utilizando datos de Red Eléctrica de España (REE).

## 📋 Descripción del Proyecto

Este proyecto consiste en una aplicación full-stack que:

- **Backend**: API GraphQL construida con Pylon que obtiene datos de la API de REE
- **Frontend**: Dashboard React con TypeScript que visualiza los datos energéticos
- **Base de datos**: MongoDB para almacenar datos históricos
- **Automatización**: Sistema de scheduling para actualización automática de datos

## 🏗️ Arquitectura y Pipeline de Datos

### Pipeline de Datos

```mermaid
graph TD
    A[REE API] -->|HTTP Requests| B[REE API Service]
    B --> C[Database Service]
    C --> D[(MongoDB)]
    E[Scheduler Service] -->|Cron Jobs| B
    F[GraphQL Resolvers] --> C
    G[React Frontend] -->|GraphQL Queries| F
```

### Flujo de Datos

1. **Obtención de Datos**: El `reeApiService` realiza peticiones HTTP a la API de REE
2. **Procesamiento**: Los datos se validan y transforman usando esquemas Zod
3. **Almacenamiento**: El `databaseService` guarda los datos en MongoDB usando Prisma
4. **Automatización**: El `schedulerService` ejecuta trabajos programados:
   - Cada 15 minutos: datos del día actual
   - Cada hora: datos del día anterior
   - Diario a las 2 AM: datos históricos
   - Semanal: limpieza de datos antiguos
5. **Consulta**: Los resolvers GraphQL exponen los datos al frontend
6. **Visualización**: El dashboard React muestra gráficos y estadísticas

## 📊 Modelo de Datos

### Esquema de Base de Datos (Prisma)

```prisma
model PowerGridBalance {
  id               String           @id @default(auto()) @map("_id") @db.ObjectId
  balanceId        String           // ID original de REE (ej: "bal1")
  balanceDate      DateTime         // Fecha del balance
  type             String           // Tipo de balance
  title            String           // Título del balance
  description      String?          // Descripción opcional
  lastUpdate       DateTime         // Última actualización
  cacheHit         Boolean?         // Si fue cache hit de REE
  cacheExpireAt    DateTime?        // Expiración del cache
  energyCategories EnergyCategory[] // Categorías de energía relacionadas

  @@unique([balanceId, balanceDate])
}

model EnergyCategory {
  id            String         @id @default(auto()) @map("_id") @db.ObjectId
  categoryId    String         @unique // ID de categoría de REE
  type          String         // Tipo: "Renovable", "No-Renovable", etc.
  title         String         // Título para mostrar
  description   String?        // Descripción opcional
  lastUpdate    DateTime       // Última actualización
  balance       PowerGridBalance @relation(fields: [balanceId], references: [id])
  energySources EnergySource[] // Fuentes de energía
}

model EnergySource {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  sourceId        String        @unique // ID de fuente de REE
  groupId         String        // ID del grupo al que pertenece
  type            String        // Tipo de fuente (ej: "Hidráulica", "Eólica")
  title           String        // Título para mostrar
  description     String?       // Descripción opcional
  color           String?       // Color hexadecimal para gráficos
  icon            String?       // Icono opcional
  magnitude       String?       // Magnitud de la medición
  isComposite     Boolean       // Si es una fuente compuesta/calculada
  total           Float         // Total de energía
  totalPercentage Float         // Porcentaje del total
  category        EnergyCategory @relation(fields: [categoryId], references: [id])
  values          EnergyValue[] // Valores de series temporales
}

model EnergyValue {
  id         String      @id @default(auto()) @map("_id") @db.ObjectId
  value      Float       // Valor de energía
  percentage Float       // Porcentaje del total
  datetime   DateTime    // Timestamp del valor
  source     EnergySource @relation(fields: [sourceId], references: [id])

  @@unique([sourceId, datetime])
}
```

### Tipos de Datos

- **Categorías de Energía**: Renovable, No-Renovable, Almacenamiento, Demanda
- **Fuentes de Energía**: Hidráulica, Eólica, Solar, Nuclear, Carbón, Gas, etc.
- **Valores Temporales**: Series de tiempo con valores y porcentajes por hora/día

## 🚀 Configuración y Ejecución

### Prerrequisitos

- Node.js 18+
- pnpm
- MongoDB (local o Atlas)

### Variables de Entorno

**Se recomienda utilizar MongoDB Atlas dado que Prisma requiere el soporte de replica sets**

Crear un archivo `.env` en la carpeta `backend/`:

```env
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/power-grid-balance"
```

### Instalación

```bash
# Instalar dependencias del proyecto completo
pnpm install

# Instalar dependencias del backend
cd backend
pnpm install

# Generar cliente de Prisma
pnpm run db:generate

# Sincronizar esquema con la base de datos
pnpm run db:push
```

## 🖥️ Cómo Ejecutar y Testear el Backend

### Ejecutar el Backend

```bash
cd backend

# Modo desarrollo (con hot reload)
pnpm run dev

# Construir para producción
pnpm run build
```

El backend estará disponible en:

- **API GraphQL**: `http://localhost:3000/graphql`
- **GraphQL Playground**: `http://localhost:3000/graphql` (interfaz web)

### Testear el Backend

```bash
cd backend

# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch
pnpm test --watch

# Ejecutar tests con coverage
pnpm test --coverage
```

### Estructura del Backend

```
backend/
├── src/
│   ├── index.ts              # Punto de entrada
│   ├── resolvers/            # Resolvers GraphQL
│   │   └── powerGridResolvers.ts
│   └── services/             # Servicios de negocio
│       ├── databaseService.ts    # Gestión de base de datos
│       ├── reeApiService.ts      # Cliente API de REE
│       └── schedulerService.ts   # Trabajos programados
├── prisma/
│   └── schema.prisma         # Esquema de base de datos
└── package.json
```

## 🎨 Cómo Ejecutar y Testear el Frontend

### Ejecutar el Frontend

```bash
# Desde la raíz del proyecto
pnpm run dev

# O construir para producción
pnpm run build
pnpm run preview
```

El frontend estará disponible en `http://localhost:5173`

### Testear el Frontend

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests con interfaz visual
pnpm run test:ui

# Ejecutar tests con coverage
pnpm run test:coverage
```

### Estructura del Frontend

```
src/
├── components/               # Componentes React
│   ├── charts/              # Componentes de gráficos
│   ├── ui/                  # Componentes UI base
│   └── PowerGridDashboard.tsx # Dashboard principal
├── hooks/                   # Custom hooks
│   └── usePowerGridData.ts  # Hook para datos de GraphQL
├── lib/
│   ├── graphql/
│   │   └── queries.ts       # Consultas GraphQL
│   ├── types.ts             # Tipos TypeScript
│   └── utils/               # Utilidades
└── main.tsx                 # Punto de entrada
```

## 📡 Cómo Obtener y Actualizar los Datos de REE

### Actualización Automática

El sistema incluye un scheduler que actualiza automáticamente los datos:

```typescript
// Configuración del scheduler
const jobs = [
  "*/15 * * * *", // Cada 15 min: datos actuales
  "0 * * * *", // Cada hora: datos del día anterior
  "0 2 * * *", // Diario 2 AM: datos históricos
  "0 3 * * 0", // Semanal domingo 3 AM: limpieza
];
```

### Actualización Manual

Via GraphQL:

```graphql
mutation ManualDataFetch($type: String!) {
  manualDataFetch(type: $type) {
    success
    message
    timestamp
  }
}
```

Tipos disponibles:

- `"current"`: Datos del día actual
- `"previous"`: Datos del día anterior
- `"historical"`: Datos históricos

### API de REE

El servicio se conecta a:

- **URL Base**: `https://apidatos.ree.es`
- **Endpoint**: `/es/datos/balance/balance-electrico`
- **Parámetros**: fechas de inicio/fin, agregación temporal

## 📊 Consultas GraphQL de Ejemplo y Respuestas Esperadas

### 1. Obtener Balance por Rango de Fechas

**Consulta:**

```graphql
query GetElectricBalanceByDateRange($startDate: String!, $endDate: String!) {
  electricBalanceByDateRange(startDate: $startDate, endDate: $endDate) {
    id
    balanceId
    balanceDate
    type
    title
    description
    lastUpdate
    cacheHit
    energyCategories {
      id
      categoryId
      type
      title
      description
      lastUpdate
      energySources {
        id
        sourceId
        groupId
        type
        title
        description
        color
        icon
        magnitude
        isComposite
        total
        totalPercentage
        values {
          id
          value
          percentage
          datetime
        }
      }
    }
  }
}
```

**Variables:**

```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-07"
}
```

**Respuesta Esperada:**

```json
{
  "data": {
    "electricBalanceByDateRange": [
      {
        "id": "60f1b2b3c4d5e6f7a8b9c0d1",
        "balanceId": "bal1",
        "balanceDate": "2024-01-01T00:00:00.000Z",
        "type": "Balance de energía eléctrica",
        "title": "Balance de energía eléctrica",
        "description": null,
        "lastUpdate": "2024-01-01T12:00:00.000Z",
        "cacheHit": false,
        "energyCategories": [
          {
            "id": "60f1b2b3c4d5e6f7a8b9c0d2",
            "categoryId": "Renovable",
            "type": "Renovable",
            "title": "Renovable",
            "description": null,
            "lastUpdate": "2024-01-01T12:00:00.000Z",
            "energySources": [
              {
                "id": "60f1b2b3c4d5e6f7a8b9c0d3",
                "sourceId": "10288",
                "groupId": "Renovable",
                "type": "Hidráulica",
                "title": "Hidráulica",
                "description": null,
                "color": "#1f77b4",
                "icon": null,
                "magnitude": "MWh",
                "isComposite": false,
                "total": 15420.5,
                "totalPercentage": 18.2,
                "values": [
                  {
                    "id": "60f1b2b3c4d5e6f7a8b9c0d4",
                    "value": 642.1,
                    "percentage": 18.5,
                    "datetime": "2024-01-01T00:00:00.000Z"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 2. Obtener Último Balance

**Consulta:**

```graphql
query GetLatestElectricBalance {
  latestElectricBalance {
    id
    balanceDate
    title
    energyCategories {
      type
      title
      energySources {
        title
        total
        totalPercentage
        color
      }
    }
  }
}
```

**Respuesta Esperada:**

```json
{
  "data": {
    "latestElectricBalance": {
      "id": "60f1b2b3c4d5e6f7a8b9c0d1",
      "balanceDate": "2024-01-07T00:00:00.000Z",
      "title": "Balance de energía eléctrica",
      "energyCategories": [
        {
          "type": "Renovable",
          "title": "Renovable",
          "energySources": [
            {
              "title": "Eólica",
              "total": 25630.8,
              "totalPercentage": 32.1,
              "color": "#2ca02c"
            },
            {
              "title": "Solar fotovoltaica",
              "total": 18420.3,
              "totalPercentage": 23.0,
              "color": "#ff7f0e"
            }
          ]
        }
      ]
    }
  }
}
```

### 3. Obtener Fuentes por Categoría

**Consulta:**

```graphql
query GetEnergySourcesByCategory(
  $categoryType: String!
  $startDate: String
  $endDate: String
) {
  energySourcesByCategory(
    categoryType: $categoryType
    startDate: $startDate
    endDate: $endDate
  ) {
    title
    total
    totalPercentage
    color
    values {
      value
      percentage
      datetime
    }
  }
}
```

**Variables:**

```json
{
  "categoryType": "Renovable",
  "startDate": "2024-01-01",
  "endDate": "2024-01-07"
}
```

### 4. Obtener Estadísticas Resumen

**Consulta:**

```graphql
query GetSummaryStats {
  summaryStats {
    balanceCount
    categoryCount
    sourceCount
    valueCount
    latestUpdate
    scheduler {
      isRunning
      jobCount
    }
  }
}
```

**Respuesta Esperada:**

```json
{
  "data": {
    "summaryStats": {
      "balanceCount": 365,
      "categoryCount": 4,
      "sourceCount": 25,
      "valueCount": 219000,
      "latestUpdate": "2024-01-07T12:00:00.000Z",
      "scheduler": {
        "isRunning": true,
        "jobCount": 4
      }
    }
  }
}
```

### 5. Actualización Manual de Datos

**Mutación:**

```graphql
mutation ManualDataFetch($type: String!) {
  manualDataFetch(type: $type) {
    success
    message
    timestamp
  }
}
```

**Variables:**

```json
{
  "type": "current"
}
```

**Respuesta Esperada:**

```json
{
  "data": {
    "manualDataFetch": {
      "success": true,
      "message": "Successfully fetched current data",
      "timestamp": "2024-01-07T15:30:00.000Z"
    }
  }
}
```

## 🔧 Características del Sistema

### Backend

- **Framework**: Pylon (GraphQL sobre Hono)
- **Base de datos**: MongoDB con Prisma ORM
- **Validación**: Esquemas Zod para validación de datos de API
- **Scheduling**: node-cron para trabajos programados
- **Testing**: Vitest con mocks de servicios
- **Manejo de errores**: Clases de error personalizadas
- **Cache**: Soporte para cache de REE API

### Frontend

- **Framework**: React 19 con TypeScript
- **Styling**: Tailwind CSS con componentes Shadcn UI
- **Gráficos**: Recharts para visualizaciones
- **Estado**: Apollo Client para GraphQL
- **Testing**: Vitest + Testing Library
- **Build**: Vite

### Características Destacadas

- **Tiempo Real**: Actualización automática cada 15 minutos
- **Histórico**: Almacenamiento de datos históricos con limpieza automática
- **Visualización**: Gráficos de series temporales y distribución por categorías
- **Responsive**: Interfaz adaptable a diferentes dispositivos
- **Error Handling**: Manejo robusto de errores con reintentos
- **Export**: Funcionalidad de exportación de datos
- **Filtrado**: Filtros por fecha y categoría de energía

## 📝 Notas de Desarrollo

### Comandos Útiles

```bash
# Regenerar cliente Prisma después de cambios en schema
cd backend && pnpm run db:generate

# Formatear código
pnpm run format

# Linting
pnpm run lint

# Tests con watch mode
pnpm test --watch
```

### Estructura de Datos de REE

La API de REE devuelve datos en formato JSON-API con:

- `data`: Información principal del balance
- `included`: Array con categorías y fuentes de energía
- `meta`: Metadatos incluyendo información de cache

El sistema transforma estos datos al modelo normalizado de la base de datos.

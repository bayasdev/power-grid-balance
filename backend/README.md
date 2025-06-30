# Power Grid Balance Backend

A GraphQL API backend that polls the Spanish REE (Red Eléctrica Española) API to collect electric balance data and stores it in MongoDB for analysis and visualization.

## Features

- 🔌 **REE API Integration**: Automatically polls the Spanish electricity grid data
- 📊 **MongoDB Storage**: Persists historical and current electric balance data
- 🕐 **Scheduled Data Collection**: Regular automated data fetching with cron jobs
- 🛡️ **Error Handling**: Robust error handling with comprehensive logging
- 📈 **GraphQL API**: Flexible API for querying electric balance data built with Pylon
- 🔄 **Real-time Updates**: Regular data updates every 15 minutes
- 🏥 **Health Monitoring**: Built-in health checks for API and database

## Tech Stack

- **Framework**: Pylon (GraphQL + TypeScript)
- **Database**: MongoDB with Prisma ORM
- **HTTP Client**: Better Fetch
- **Scheduling**: Node Cron
- **Date Handling**: date-fns
- **Validation**: Zod

## Prerequisites

- Node.js 18+
- MongoDB instance
- pnpm package manager

## Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure environment**:

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit your environment variables
   DATABASE_URL="mongodb://localhost:27017/power-grid-balance"
   ```

3. **Generate Prisma client**:

   ```bash
   pnpm db:generate
   ```

4. **Push database schema**:

   ```bash
   pnpm db:push
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

## Environment Variables

| Variable              | Description                  | Default     |
| --------------------- | ---------------------------- | ----------- |
| `DATABASE_URL`        | MongoDB connection string    | Required    |
| `DATA_RETENTION_DAYS` | Days to keep historical data | 365         |
| `PORT`                | Server port                  | 3000        |
| `NODE_ENV`            | Environment mode             | development |

## API Endpoints

### GraphQL Playground

- **URL**: `http://localhost:3000/graphql`
- **Description**: Interactive GraphQL playground for testing queries

### Queries

#### `electricBalanceByDateRange`

Fetch electric balance data for a specific date range (max 365 days).

```graphql
query {
  electricBalanceByDateRange(startDate: "2024-01-01", endDate: "2024-01-31") {
    id
    title
    lastUpdate
    energyCategories {
      type
      title
      energySources {
        title
        type
        color
        total
        totalPercentage
        values {
          value
          percentage
          datetime
        }
      }
    }
  }
}
```

#### `latestElectricBalance`

Get the most recent electric balance data.

```graphql
query {
  latestElectricBalance {
    id
    title
    lastUpdate
    energyCategories {
      type
      title
      energySources {
        title
        type
        values {
          value
          datetime
        }
      }
    }
  }
}
```

#### `electricBalanceByDate`

Fetch data for a specific date.

```graphql
query {
  electricBalanceByDate(date: "2024-01-15") {
    id
    title
    energyCategories {
      type
      energySources {
        title
        values {
          value
          datetime
        }
      }
    }
  }
}
```

#### `energySourcesByCategory`

Get energy sources filtered by category with optional date filtering.

```graphql
query {
  energySourcesByCategory(
    categoryType: Renovable
    startDate: "2024-01-01"
    endDate: "2024-01-31"
  ) {
    title
    type
    color
    total
    values {
      value
      percentage
      datetime
    }
  }
}
```

**Available category types:**

- `Renovable` - Renewable energy sources
- `No-Renovable` - Non-renewable energy sources
- `Almacenamiento` - Energy storage systems
- `Demanda` - Energy demand

#### `summaryStats`

Get database and system statistics.

```graphql
query {
  summaryStats {
    balanceCount
    categoryCount
    sourceCount
    valueCount
    latestUpdate
    scheduler {
      isRunning
      jobCount
      hasFallbackData
    }
  }
}
```

### Mutations

#### `manualDataFetch`

Manually trigger data fetch with optional fetch type.

```graphql
mutation {
  manualDataFetch(type: current) {
    success
    message
    timestamp
  }
}
```

**Available fetch types:**

- `current` - Current day data (default)
- `previous` - Previous day data
- `historical` - Historical data

#### `startScheduler`

Start the data collection scheduler.

```graphql
mutation {
  startScheduler {
    success
    message
    timestamp
  }
}
```

#### `stopScheduler`

Stop the data collection scheduler.

```graphql
mutation {
  stopScheduler {
    success
    message
    timestamp
  }
}
```

## Data Collection Schedule

- **Current Data**: Every 15 minutes
- **Previous Day**: Every hour
- **Historical Data**: Daily at 2 AM
- **Health Checks**: Every 5 minutes
- **Data Cleanup**: Weekly on Sunday at 3 AM

## Data Model

### PowerGridBalance

Main container for electric balance data with timestamp and metadata.

### EnergyCategory

Categories like "Renovable", "No-Renovable", "Almacenamiento", "Demanda".

### EnergySource

Specific energy sources like "Hidráulica", "Eólica", "Nuclear", etc.

### EnergyValue

Time-series data points with value, percentage, and timestamp.

## Error Handling

The backend implements robust error handling:

1. **API Failures**: Automatic retries with exponential backoff
2. **Database Issues**: Transaction rollbacks and connection recovery
3. **Validation**: Input validation with descriptive error messages
4. **Graceful Degradation**: Continues operation even with partial failures

## Monitoring

- Health check endpoint for monitoring systems
- Comprehensive logging with structured data
- Scheduler status tracking
- Database connection monitoring

## Development

### Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database

### Adding New Queries

1. Create resolver in `src/resolvers/powerGridResolvers.ts`
2. Follow Pylon conventions using individual parameters instead of input objects
3. Add proper TypeScript types for automatic schema generation
4. Test with GraphQL Playground

### Debugging

- Check logs for REE API errors
- Monitor database connection status
- Use GraphQL Playground for query testing
- Check scheduler status via `summaryStats` query

## API Design

This backend follows Pylon best practices:

- **Individual Parameters**: GraphQL resolvers use individual parameters instead of input objects for better developer experience
- **Type Safety**: Full TypeScript integration with automatic schema generation
- **Clean Schema**: Pylon automatically generates intuitive GraphQL schemas from TypeScript functions
- **Error Handling**: Comprehensive error handling with descriptive messages

## Deployment

1. **Build the application**:

   ```bash
   pnpm build
   ```

2. **Set production environment variables**
3. **Ensure MongoDB is accessible**
4. **Start the application**:
   ```bash
   node .pylon/index.js
   ```

## REE API Integration

This backend integrates with the Spanish REE (Red Eléctrica Española) public API:

- **Base URL**: `https://apidatos.ree.es`
- **Endpoint**: `/es/datos/balance/balance-electrico`
- **Documentation**: [REE API Docs](https://www.ree.es/es/datos/apidatos)

The API provides comprehensive electric balance data including:

- Renewable energy sources (wind, solar, hydro)
- Non-renewable sources (nuclear, combined cycle, coal)
- Storage systems (pumped hydro)
- Demand and international exchanges

## License

This project is licensed under the MIT License.

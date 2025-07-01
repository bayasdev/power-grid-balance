import { gql } from "@apollo/client";

export const GET_ELECTRIC_BALANCE_BY_DATE_RANGE = gql`
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
`;

export const GET_LATEST_ELECTRIC_BALANCE = gql`
  query GetLatestElectricBalance {
    latestElectricBalance {
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
`;

export const GET_ENERGY_SOURCES_BY_CATEGORY = gql`
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
`;

export const GET_SUMMARY_STATS = gql`
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
`;

export const MANUAL_DATA_FETCH = gql`
  mutation ManualDataFetch($type: String!) {
    manualDataFetch(type: $type) {
      success
      message
      timestamp
    }
  }
`;

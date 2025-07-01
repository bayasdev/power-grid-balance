import React, { useState } from "react";
import { RefreshCw, Download, Settings } from "lucide-react";
import {
  useElectricBalanceByDateRange,
  useSummaryStats,
  useManualDataFetch,
  useDateRange,
} from "@/hooks/usePowerGridData";
import {
  processBalanceDataForChart,
  processBalanceDataForTotals,
} from "@/lib/utils/dataUtils";
import type { EnergySourceCategory } from "@/lib/types";

// Components
import { ErrorBoundary } from "./ErrorBoundary";
import { LoadingCard, LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import { DateRangePicker, QuickDateButtons } from "./DateRangePicker";
import { SummaryStatsComponent } from "./SummaryStats";
import { TimeSeriesChart } from "./charts/TimeSeriesChart";
import { EnergyPieChart, EnergyDonutChart } from "./charts/EnergyPieChart";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PowerGridDashboard: React.FC = () => {
  const { dateRange, updateDateRange, setPresetRange } = useDateRange(7);
  const [selectedCategory, setSelectedCategory] = useState<
    EnergySourceCategory | "all"
  >("all");

  // Data hooks
  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
    retryFetch: retryBalance,
  } = useElectricBalanceByDateRange(dateRange);

  const {
    data: summaryStats,
    loading: statsLoading,
    error: statsError,
    retryFetch: retryStats,
  } = useSummaryStats();

  const { fetchData: manualFetch, loading: fetchLoading } =
    useManualDataFetch();

  // Process data for charts
  const chartData = processBalanceDataForChart(balanceData);
  const totalsData = processBalanceDataForTotals(balanceData);

  // Filter data by category if selected
  const filteredChartData =
    selectedCategory === "all"
      ? chartData
      : chartData.filter((data) => data.categoryType === selectedCategory);

  const filteredTotalsData =
    selectedCategory === "all"
      ? totalsData
      : totalsData.filter((data) => data.categoryType === selectedCategory);

  const handleManualRefresh = async () => {
    try {
      await manualFetch("current");
      retryBalance();
      retryStats();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      dateRange,
      balanceData,
      summaryStats,
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `power-grid-data-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard de Balance Energético
            </h1>
            <p className="text-muted-foreground">
              Monitor en tiempo real del balance de energía eléctrica
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleManualRefresh}
              disabled={fetchLoading}
              variant="outline"
            >
              {fetchLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualizar
            </Button>

            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Controles de Filtrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Rango de Fechas
                </label>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={updateDateRange}
                  onPresetSelect={setPresetRange}
                />
              </div>

              <div className="flex gap-2">
                <QuickDateButtons onPresetSelect={setPresetRange} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Categoría de Energía
              </label>
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  setSelectedCategory(value as EnergySourceCategory | "all")
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="Renovable">Renovable</SelectItem>
                  <SelectItem value="No-Renovable">No Renovable</SelectItem>
                  <SelectItem value="Almacenamiento">Almacenamiento</SelectItem>
                  <SelectItem value="Demanda">Demanda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {statsLoading ? (
          <LoadingCard title="Cargando estadísticas..." />
        ) : statsError ? (
          <ErrorDisplay error={statsError} onRetry={retryStats} />
        ) : summaryStats ? (
          <SummaryStatsComponent stats={summaryStats} />
        ) : null}

        {/* Charts Section */}
        <Tabs defaultValue="timeseries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeseries">Serie Temporal</TabsTrigger>
            <TabsTrigger value="distribution">Distribución</TabsTrigger>
            <TabsTrigger value="comparison">Comparación</TabsTrigger>
          </TabsList>

          <TabsContent value="timeseries" className="space-y-4">
            {balanceLoading ? (
              <LoadingCard title="Cargando datos de series temporales..." />
            ) : balanceError ? (
              <ErrorDisplay error={balanceError} onRetry={retryBalance} />
            ) : filteredChartData.length > 0 ? (
              <div className="space-y-4">
                {filteredChartData.map((categoryData) => (
                  <TimeSeriesChart
                    key={categoryData.categoryType}
                    data={categoryData.data}
                    title={`Serie Temporal - ${categoryData.categoryTitle}`}
                  />
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No hay datos disponibles para el rango de fechas seleccionado.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            {balanceLoading ? (
              <LoadingCard title="Cargando datos de distribución..." />
            ) : balanceError ? (
              <ErrorDisplay error={balanceError} onRetry={retryBalance} />
            ) : filteredTotalsData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <EnergyPieChart
                  data={filteredTotalsData}
                  title="Distribución por Fuente de Energía"
                />
                <EnergyDonutChart
                  data={filteredTotalsData}
                  title="Totales por Categoría"
                />
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No hay datos disponibles para mostrar la distribución.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredChartData.map((categoryData) => (
                <Card key={categoryData.categoryType}>
                  <CardHeader>
                    <CardTitle>
                      {categoryData.categoryTitle} - Comparación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <TimeSeriesChart
                        data={categoryData.data}
                        title="Evolución Temporal"
                      />
                      <EnergyPieChart
                        data={filteredTotalsData.filter(
                          (d) => d.categoryType === categoryData.categoryType
                        )}
                        title="Distribución"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

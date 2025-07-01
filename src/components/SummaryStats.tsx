import React from "react";
import {
  Activity,
  Database,
  Zap,
  TrendingUp,
  Calendar,
  Settings,
} from "lucide-react";
import type { SummaryStats } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/dataUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SummaryStatsProps {
  stats: SummaryStats;
  className?: string;
}

export const SummaryStatsComponent: React.FC<SummaryStatsProps> = ({
  stats,
  className,
}) => {
  const statItems = [
    {
      title: "Balances de Energía",
      value: stats.balanceCount.toLocaleString(),
      icon: <Zap className="h-4 w-4" />,
      description: "Registros de balance",
    },
    {
      title: "Categorías",
      value: stats.categoryCount.toLocaleString(),
      icon: <Activity className="h-4 w-4" />,
      description: "Tipos de energía",
    },
    {
      title: "Fuentes de Energía",
      value: stats.sourceCount.toLocaleString(),
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Fuentes registradas",
    },
    {
      title: "Valores de Datos",
      value: stats.valueCount.toLocaleString(),
      icon: <Database className="h-4 w-4" />,
      description: "Puntos de datos",
    },
  ];

  return (
    <div className={className}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statItems.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Last Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Última Actualización
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.latestUpdate ? (
              <div>
                <p className="text-lg font-semibold">
                  {formatDateTime(stats.latestUpdate)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Datos más recientes disponibles
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Scheduler Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Estado del Planificador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado:</span>
                <Badge
                  variant={stats.scheduler.isRunning ? "default" : "secondary"}
                >
                  {stats.scheduler.isRunning ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trabajos:</span>
                <span className="font-medium">{stats.scheduler.jobCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.scheduler.isRunning
                  ? "Recopilando datos automáticamente"
                  : "Recopilación pausada"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div
            className={`text-xs flex items-center mt-1 ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 mr-1 ${trend.isPositive ? "" : "rotate-180"}`}
            />
            {Math.abs(trend.value)}%
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

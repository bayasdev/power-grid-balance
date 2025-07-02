import { useState } from "react";
import { Calendar, History, Download, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useManualDataFetch } from "@/hooks/usePowerGridData";
import type { FetchType } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "./LoadingSpinner";

interface ManualDataFetchControlsProps {
  onFetchComplete?: () => void;
}

interface FetchTypeConfig {
  type: FetchType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const fetchTypes: FetchTypeConfig[] = [
  {
    type: "current",
    label: "Actuales",
    icon: Calendar,
  },
  {
    type: "previous",
    label: "Anteriores",
    icon: CalendarClock,
  },
  {
    type: "historical",
    label: "Históricos",
    icon: History,
  },
];

export const ManualDataFetchControls: React.FC<
  ManualDataFetchControlsProps
> = ({ onFetchComplete }) => {
  const { fetchData } = useManualDataFetch();
  const [loadingType, setLoadingType] = useState<FetchType | null>(null);

  const handleFetch = async (type: FetchType) => {
    try {
      setLoadingType(type);
      const result = await fetchData(type);

      if (result.success) {
        toast.success(
          `Datos ${fetchTypes.find((f) => f.type === type)?.label} obtenidos correctamente`,
          {
            description: `Actualizado: ${new Date().toLocaleTimeString()}`,
          },
        );
        onFetchComplete?.();
      } else {
        toast.error(
          `Error al obtener datos ${fetchTypes.find((f) => f.type === type)?.label}`,
          {
            description: result.message,
          },
        );
      }
    } catch (error) {
      toast.error("Error de conexión", {
        description:
          error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Download className="h-4 w-4" />
          Actualización Manual
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {fetchTypes.map(({ type, label, icon: Icon }) => {
          const isCurrentlyLoading = loadingType === type;
          return (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => handleFetch(type)}
              disabled={loadingType !== null}
            >
              {isCurrentlyLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Icon className="h-3 w-3 mr-1" />
              )}
              {label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

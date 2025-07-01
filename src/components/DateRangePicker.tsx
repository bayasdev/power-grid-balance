import React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onPresetSelect: (days: number) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  onPresetSelect,
  className,
}) => {
  const formatDateRange = () => {
    const start = format(dateRange.startDate, "dd/MM/yyyy", { locale: es });
    const end = format(dateRange.endDate, "dd/MM/yyyy", { locale: es });
    return `${start} - ${end}`;
  };

  const presetOptions = [
    { label: "Último día", days: 1 },
    { label: "Últimos 3 días", days: 3 },
    { label: "Última semana", days: 7 },
    { label: "Últimas 2 semanas", days: 14 },
    { label: "Último mes", days: 30 },
    { label: "Últimos 3 meses", days: 90 },
  ];

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange ? formatDateRange() : "Selecciona un rango de fechas"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange.startDate}
            selected={{
              from: dateRange.startDate,
              to: dateRange.endDate,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange({
                  startDate: range.from,
                  endDate: range.to,
                });
              }
            }}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>

      {/* Preset Options */}
      <Select onValueChange={(value) => onPresetSelect(parseInt(value))}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Rangos predefinidos" />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((preset) => (
            <SelectItem key={preset.days} value={preset.days.toString()}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface QuickDateButtonsProps {
  onPresetSelect: (days: number) => void;
  className?: string;
}

export const QuickDateButtons: React.FC<QuickDateButtonsProps> = ({
  onPresetSelect,
  className,
}) => {
  const quickOptions = [
    { label: "1D", days: 1 },
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
  ];

  return (
    <div className={cn("flex gap-1", className)}>
      {quickOptions.map((option) => (
        <Button
          key={option.days}
          variant="outline"
          size="sm"
          onClick={() => onPresetSelect(option.days)}
          className="px-3"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

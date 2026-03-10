import { useState } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

export function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Período:</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(d) => d && onStartDateChange(d)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <span className="text-sm text-muted-foreground">até</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(d) => d && onEndDateChange(d)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

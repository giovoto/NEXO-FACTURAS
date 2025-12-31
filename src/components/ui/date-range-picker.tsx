'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
    value?: DateRange;
    onChange: (range: DateRange | undefined) => void;
    className?: string;
    placeholder?: string;
}

export function DateRangePicker({
    value,
    onChange,
    className,
    placeholder = 'Seleccionar rango de fechas',
}: DateRangePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>(value);

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range);
        onChange(range);
    };

    const handlePreset = (preset: 'today' | 'week' | 'month' | 'lastMonth' | 'last3Months') => {
        const today = new Date();
        const ranges: Record<typeof preset, DateRange> = {
            today: { from: today, to: today },
            week: {
                from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
                to: today,
            },
            month: {
                from: new Date(today.getFullYear(), today.getMonth(), 1),
                to: today,
            },
            lastMonth: {
                from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                to: new Date(today.getFullYear(), today.getMonth(), 0),
            },
            last3Months: {
                from: new Date(today.getFullYear(), today.getMonth() - 3, 1),
                to: today,
            },
        };

        handleSelect(ranges[preset]);
    };

    const handleClear = () => {
        setDate(undefined);
        onChange(undefined);
    };

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, 'dd MMM yyyy', { locale: es })} -{' '}
                                    {format(date.to, 'dd MMM yyyy', { locale: es })}
                                </>
                            ) : (
                                format(date.from, 'dd MMM yyyy', { locale: es })
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        {/* Presets sidebar */}
                        <div className="flex flex-col gap-1 border-r p-3">
                            <div className="text-xs font-medium text-muted-foreground mb-2">
                                Accesos rápidos
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => handlePreset('today')}
                            >
                                Hoy
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => handlePreset('week')}
                            >
                                Últimos 7 días
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => handlePreset('month')}
                            >
                                Este mes
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => handlePreset('lastMonth')}
                            >
                                Mes pasado
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => handlePreset('last3Months')}
                            >
                                Últimos 3 meses
                            </Button>
                            <div className="border-t pt-2 mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start w-full text-destructive hover:text-destructive"
                                    onClick={handleClear}
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="p-3">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleSelect}
                                numberOfMonths={2}
                                locale={es}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface AutocompleteOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface AutocompleteProps {
    options: AutocompleteOption[];
    value?: string;
    onValueChange: (value: string | undefined) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    isLoading?: boolean;
    allowClear?: boolean;
}

export function Autocomplete({
    options,
    value,
    onValueChange,
    placeholder = 'Seleccionar...',
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'No se encontraron resultados.',
    className,
    isLoading = false,
    allowClear = true,
}: AutocompleteProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.value === value);

    const handleSelect = (currentValue: string) => {
        if (currentValue === value && allowClear) {
            onValueChange(undefined);
        } else {
            onValueChange(currentValue);
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between', className)}
                >
                    <span className="flex items-center gap-2 truncate">
                        {selectedOption?.icon}
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {isLoading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={handleSelect}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === option.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <span className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

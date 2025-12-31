'use client';

import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    debounceMs?: number;
    className?: string;
    isLoading?: boolean;
    defaultValue?: string;
}

export function SearchBar({
    placeholder = 'Buscar...',
    onSearch,
    debounceMs = 300,
    className,
    isLoading = false,
    defaultValue = '',
}: SearchBarProps) {
    const [value, setValue] = React.useState(defaultValue);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    // Debounced search
    React.useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onSearch(value);
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, debounceMs, onSearch]);

    // Keyboard shortcuts: Ctrl+K to focus
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClear = () => {
        setValue('');
        inputRef.current?.focus();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    return (
        <div className={cn('relative w-full', className)}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                className="pl-10 pr-20"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {value && !isLoading && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-7 w-7 p-0 hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Limpiar búsqueda</span>
                    </Button>
                )}

                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>
        </div>
    );
}

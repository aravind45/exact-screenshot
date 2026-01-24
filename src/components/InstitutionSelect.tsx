
import * as React from "react"
import { Check, Building2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"

export interface Institution {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    fax?: string;
    address?: string;
    website?: string;
}

interface InstitutionSelectProps {
    value: string;
    onSelect: (institution: Institution) => void;
    onChange: (value: string) => void;
}

export function InstitutionSelect({ value, onSelect, onChange }: InstitutionSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState(value)
    const debouncedQuery = useDebounce(searchQuery, 300)

    // Sync internal searchQuery with prop value when it changes externally (e.g. form reset or pre-fill)
    React.useEffect(() => {
        if (value !== searchQuery) {
            setSearchQuery(value)
        }
    }, [value])

    const { data: suggestions = [], isLoading } = useQuery({
        queryKey: ['institutions', debouncedQuery],
        queryFn: () => api.searchInstitutions(debouncedQuery),
        enabled: debouncedQuery.length >= 2,
        staleTime: 60000
    });

    const hasSuggestions = suggestions.length > 0;
    const showDropdown = open && (isLoading || hasSuggestions);

    return (
        <div className="relative w-full">
            <Popover open={showDropdown} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative w-full">
                        <Input
                            placeholder="Type institution name (e.g. Fidelity, Chase)..."
                            value={searchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchQuery(val);
                                onChange(val);
                                if (!open) setOpen(true);
                            }}
                            onFocus={() => {
                                if (debouncedQuery.length >= 2) setOpen(true);
                            }}
                            className="pl-9 h-11 bg-background/50 focus:bg-background transition-all border-border/50 focus:border-primary/50"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                                <Building2 className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="p-0 border-border/40 shadow-2xl bg-popover/95 backdrop-blur-md rounded-xl"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                    align="start"
                    sideOffset={8}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command shouldFilter={false} className="bg-transparent">
                        <CommandList className="max-h-[300px]">
                            {isLoading && (
                                <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span>Searching institutions...</span>
                                </div>
                            )}

                            {!isLoading && hasSuggestions && (
                                <CommandGroup heading="Verified Institutions" className="p-2">
                                    {suggestions.map((inst: Institution) => (
                                        <CommandItem
                                            key={inst.id}
                                            value={inst.name}
                                            onSelect={() => {
                                                onSelect(inst);
                                                setSearchQuery(inst.name);
                                                setOpen(false);
                                            }}
                                            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-accent rounded-lg transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 text-xs font-bold">
                                                {inst.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 flex flex-col min-w-0">
                                                <span className="font-semibold text-sm truncate">{inst.name}</span>
                                                {inst.website && (
                                                    <span className="text-[10px] text-muted-foreground truncate opacity-70">
                                                        {inst.website.replace('https://', '').replace('www.', '')}
                                                    </span>
                                                )}
                                            </div>
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 text-primary shrink-0",
                                                    value === inst.name ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

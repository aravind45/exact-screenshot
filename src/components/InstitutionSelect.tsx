
import * as React from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
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
    onChange: (value: string) => void; // For manual typing
}

export function InstitutionSelect({ value, onSelect, onChange }: InstitutionSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")

    // Fetch suggestions when typing
    const { data: suggestions = [] } = useQuery({
        queryKey: ['institutions', query],
        queryFn: () => api.searchInstitutions(query),
        enabled: query.length >= 2,
        staleTime: 60000
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value ? (
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 opacity-50" />
                            {value}
                        </div>
                    ) : (
                        "Select or type institution..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search institution..."
                        value={query}
                        onValueChange={(val) => {
                            setQuery(val);
                            // Also update the parent if they are just typing a new name
                            onChange(val);
                        }}
                    />
                    <CommandList>
                        {suggestions.length === 0 && query.length > 0 && (
                            <CommandEmpty>
                                <div className="p-2 text-sm text-muted-foreground">
                                    Press Enter to use "{query}"
                                </div>
                            </CommandEmpty>
                        )}

                        <CommandGroup heading="Suggestions">
                            {suggestions.map((inst: Institution) => (
                                <CommandItem
                                    key={inst.id}
                                    value={inst.name}
                                    onSelect={(currentValue) => {
                                        onSelect(inst);
                                        setOpen(false);
                                        setQuery(""); // Reset internal query
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === inst.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{inst.name}</span>
                                        {inst.website && <span className="text-xs text-muted-foreground">{inst.website}</span>}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

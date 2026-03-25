"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  type: string;
  label: string;
  description?: string;
  href?: string;
}

interface SearchCommandProps {
  onSearch?: (query: string) => Promise<SearchResult[]>;
  onSelect?: (result: SearchResult) => void;
  recentItems?: SearchResult[];
  quickActions?: { label: string; onAction: () => void }[];
}

export function SearchCommand({ onSearch, onSelect, recentItems = [], quickActions = [] }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!query || !onSearch) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const r = await onSearch(query);
      setResults(r);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  function handleSelect(result: SearchResult) {
    onSelect?.(result);
    setOpen(false);
    setQuery("");
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type]!.push(r);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search orders, customers, products..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Quick actions */}
        {quickActions.length > 0 && !query && (
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem key={action.label} onSelect={action.onAction}>
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Recent items */}
        {recentItems.length > 0 && !query && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent">
              {recentItems.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                  <span className="text-xs font-mono text-muted-foreground mr-2 uppercase">{item.type}</span>
                  <span>{item.label}</span>
                  {item.description && (
                    <span className="ml-auto text-xs text-muted-foreground">{item.description}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search results */}
        {Object.entries(grouped).map(([type, items]) => (
          <CommandGroup key={type} heading={type}>
            {items.map((item) => (
              <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                <span>{item.label}</span>
                {item.description && (
                  <span className="ml-auto text-xs text-muted-foreground">{item.description}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

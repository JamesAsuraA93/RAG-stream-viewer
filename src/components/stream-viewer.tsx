"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreamEventCard } from "./stream-event-card";
import { StreamStats } from "./stream-stats";
import type { FormattedChunkItem, EventType, RAGResponseItemFinal } from "@/types/rag-stream";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RAGResponseCardFinal } from "./stream-event-card-final";

interface StreamViewerProps {
  items: FormattedChunkItem[];
}

export function StreamViewer({ items }: StreamViewerProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<
    EventType | "unknown" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tools = useMemo(() => {
    const toolSet = new Set(
      items
        .map((i) => i.metadata?.tool?.name)
        .filter((n): n is string => typeof n === "string" && n.length > 0)
    );
    return Array.from(toolSet);
  }, [items]);

  const events = useMemo(() => {
    const eventSet = new Set(items.map((i) => i.event));
    return Array.from(eventSet);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedTool && item.metadata?.tool?.name !== selectedTool)
        return false;
      if (selectedEvent && item.event !== selectedEvent) return false;
      if (searchQuery) {
        const content =
          typeof item.content === "string"
            ? item.content.toLowerCase()
            : JSON.stringify(item.content).toLowerCase();
        return content.includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [items, selectedTool, selectedEvent, searchQuery]);

  const clearFilters = () => {
    setSelectedTool(null);
    setSelectedEvent(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedTool || selectedEvent || searchQuery;

  return (
    <div className="space-y-6">
      <StreamStats items={items} />

      <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tools</p>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool) => (
                <Badge
                  key={tool}
                  variant={selectedTool === tool ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedTool(selectedTool === tool ? null : tool)
                  }
                >
                  {tool}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Event Types</p>
            <div className="flex flex-wrap gap-2">
              {events.map((event) => (
                <Badge
                  key={event}
                  variant={selectedEvent === event ? "default" : "outline"}
                  className="cursor-pointer font-mono text-xs"
                  onClick={() =>
                    setSelectedEvent(selectedEvent === event ? null : event)
                  }
                >
                  {event.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Stream Events ({filteredItems.length})
          </h3>
        </div>

        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center bg-card/30 backdrop-blur-sm border-border/50">
            <p className="text-muted-foreground">
              No events match your filters
            </p>
          </Card>
        ) : (
          filteredItems.map((item, index) => {
            if (item.isFinal) {
              const finalData = item as RAGResponseItemFinal;
              return (
                <RAGResponseCardFinal
                  key={`${finalData.index}-${finalData.sequence}`}
                  item={finalData}
                 />
              );
            }
            return (
              <StreamEventCard
                key={`${item.index}-${item.sequence}`}
                item={item}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { FormattedChunkItem, SearchResultContent } from "@/types/rag-stream"
import { formatTimestamp, formatSearchResult } from "@/lib/format-rag-stream"
import { Clock, Database, Search, Sparkles, Terminal, Zap, Code2, Eye, AlertCircle } from "lucide-react"
import { useState } from "react"

interface StreamEventCardProps {
  item: FormattedChunkItem
}

const eventIcons: Record<string, typeof Zap> = {
  thinking_title: Sparkles,
  thinking_content: Sparkles,
  search_result: Search,
  tool_call: Terminal,
  tool_result: Database,
  chunk: Zap,
  final: Zap,
}

const eventColors: Record<string, string> = {
  thinking_title: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  thinking_content: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  search_result: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  tool_call: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  tool_result: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  chunk: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  final: "bg-pink-500/10 text-pink-400 border-pink-500/20",
}

function findMissingParams(item: FormattedChunkItem): string[] {
  const missing: string[] = []

  // Check top-level fields
  if (item.content === null || item.content === undefined || item.content === "") {
    missing.push("content")
  }
  if (!item.runId) missing.push("runId")
  if (!item.timestamp) missing.push("timestamp")

  // Check metadata fields
  if (item.metadata) {
    if (!item.metadata.source) missing.push("metadata.source")
    if (item.metadata.timing === null || item.metadata.timing === undefined) {
      missing.push("metadata.timing")
    }

    // Check tool fields
    if (item.metadata.tool) {
      if (!item.metadata.tool.name) missing.push("metadata.tool.name")
    } else {
      missing.push("metadata.tool")
    }

    // Check agent field
    if (item.metadata.agent === null || item.metadata.agent === undefined) {
      missing.push("metadata.agent")
    }
  } else {
    missing.push("metadata")
  }

  return missing
}

// Local lightweight runtime type guard for search result content.
// This avoids importing a non-existent helper from "@/lib/format-rag-stream".
function isSearchResultContent(content: any): content is SearchResultContent {
  return (
    content !== null &&
    typeof content === "object" &&
    (Object.prototype.hasOwnProperty.call(content, "query_text") ||
      Object.prototype.hasOwnProperty.call(content, "action") ||
      Object.prototype.hasOwnProperty.call(content, "results"))
  )
}

export function StreamEventCard({ item }: StreamEventCardProps) {
  const [showRaw, setShowRaw] = useState(false)

  const Icon = (eventIcons as Record<string, typeof Zap>)[item.event] || Zap
  const colorClass = (eventColors as Record<string, string>)[item.event] || "bg-muted text-muted-foreground"

  const missingParams = findMissingParams(item)

  const renderContent = () => {
    if (showRaw) {
      return (
        <pre className="text-xs font-mono text-muted-foreground overflow-x-auto bg-muted/30 p-3 rounded-lg border border-border/30">
          {JSON.stringify(item, null, 2)}
        </pre>
      )
    }

    if (item.content === null || item.content === undefined || item.content === "") {
      return <p className="text-sm text-muted-foreground italic">No content</p>
    }

    if (item.event === "search_result" && typeof item.content === "object" && isSearchResultContent(item.content)) {
      return (
        <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
          {formatSearchResult(item.content)}
        </pre>
      )
    }

    if (typeof item.content === "object") {
      return (
        <pre className="text-sm font-mono text-muted-foreground overflow-x-auto bg-muted/30 p-3 rounded-lg">
          {JSON.stringify(item.content, null, 2)}
        </pre>
      )
    }

    return <p className="text-sm text-foreground whitespace-pre-wrap">{item.content}</p>
  }

  return (
    <Card className="p-4 border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg border ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                {item.event.replace("_", " ").toUpperCase()}
              </Badge>
              {item.metadata?.tool?.name && (
                <Badge variant="secondary" className="text-xs">
                  {item.metadata.tool.name}
                </Badge>
              )}
              {item.isDuplicate && (
                <Badge variant="destructive" className="text-xs">
                  Duplicate
                </Badge>
              )}
              {missingParams.length > 0 && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {missingParams.length} missing
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)} className="h-7 px-2 gap-1">
            {showRaw ? (
              <>
                <Eye className="w-3 h-3" />
                <span className="text-xs">Formatted</span>
              </>
            ) : (
              <>
                <Code2 className="w-3 h-3" />
                <span className="text-xs">Raw</span>
              </>
            )}
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{formatTimestamp(item.timestamp)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {renderContent()}

        {!showRaw && missingParams.length > 0 && (
          <div className="pt-2 border-t border-destructive/30 bg-destructive/5 -mx-4 px-4 pb-2 mt-3">
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive mb-1">Missing or Empty Parameters:</p>
                <div className="flex flex-wrap gap-1">
                  {missingParams.map((param) => (
                    <Badge
                      key={param}
                      variant="outline"
                      className="text-xs font-mono border-destructive/30 text-destructive"
                    >
                      {param}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!showRaw && (
          <div className="flex items-center gap-4 pt-2 border-t border-border/30 text-xs text-muted-foreground">
            <span className="font-mono">Index: {item.index}</span>
            <span className="font-mono">Seq: {item.sequence}</span>
            {item.metadata?.source && <span className="font-mono">Source: {item.metadata.source}</span>}
          </div>
        )}
      </div>
    </Card>
  )
}

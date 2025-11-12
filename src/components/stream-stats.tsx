"use client"

import { Card } from "@/components/ui/card"
import type { FormattedChunkItem } from "@/types/rag-stream"
import { Activity, Database, Search, Sparkles } from "lucide-react"

interface StreamStatsProps {
  items: FormattedChunkItem[]
}

export function StreamStats({ items }: StreamStatsProps) {
  const stats = {
    total: items.length,
    thinking: items.filter((i) => i.event.includes("thinking")).length,
    searches: items.filter((i) => i.event === "search_result").length,
    toolCalls: items.filter((i) => i.event === "tool_call" || i.event === "tool_result").length,
    duplicates: items.filter((i) => i.isDuplicate).length,
  }

  const tools = [...new Set(items.map((i) => i.metadata?.tool?.name).filter(Boolean))]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Events</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.searches}</p>
            <p className="text-sm text-muted-foreground">Searches</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Database className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.toolCalls}</p>
            <p className="text-sm text-muted-foreground">Tool Calls</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{tools.length}</p>
            <p className="text-sm text-muted-foreground">Active Tools</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

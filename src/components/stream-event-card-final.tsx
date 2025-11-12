"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RAGResponseItemFinal, SearchResultContentFinal, ItemMetadataFinal, SourceMetadataFinal } from "@/types/rag-stream"
import { formatTimestamp } from "@/lib/format-rag-stream"
import { 
  Clock, 
  Database, 
  Search, 
  Sparkles, 
  Terminal, 
  Zap, 
  Code2, 
  Eye, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Brain
} from "lucide-react"
import { useState } from "react"

interface RAGResponseCardProps {
  item: RAGResponseItemFinal
}

const eventIcons: Record<string, typeof Zap> = {
  final_answer: CheckCircle,
  update_event: TrendingUp,
  thinking: Brain,
  tool_call: Terminal,
  error: AlertCircle,
  unknown: Zap,
}

const eventColors: Record<string, string> = {
  final_answer: "bg-green-500/10 text-green-400 border-green-500/20",
  update_event: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  thinking: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  tool_call: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  unknown: "bg-gray-500/10 text-gray-400 border-gray-500/20",
}

function findMissingParams(item: RAGResponseItemFinal): string[] {
  const missing: string[] = []

  // Check top-level fields
  if (item.content === null || item.content === undefined || item.content === "") {
    missing.push("content")
  }
  if (!item.runId) missing.push("runId")
  if (!item.timestamp) missing.push("timestamp")

  // Check metadata based on type
  if (item.metadata) {
    // Check if it's a final answer metadata (has source, timing, tool, agent)
    if ('source' in item.metadata && 'timing' in item.metadata) {
      const finalMetadata = item.metadata as Extract<ItemMetadataFinal, { source: SourceMetadataFinal }>
      
      if (!finalMetadata.source) {
        missing.push("metadata.source")
      } else {
        if (!finalMetadata.source.searches) missing.push("metadata.source.searches")
      }
      
      if (!finalMetadata.timing) {
        missing.push("metadata.timing")
      } else {
        if (!finalMetadata.timing.started_at) missing.push("metadata.timing.started_at")
        if (!finalMetadata.timing.ended_at) missing.push("metadata.timing.ended_at")
      }
      
      if (!finalMetadata.agent) {
        missing.push("metadata.agent")
      }
    }
    // Check if it's an update event metadata (has source and score)
    else if ('score' in item.metadata) {
      const updateMetadata = item.metadata as Extract<ItemMetadataFinal, { score: any }>
      
      if (!updateMetadata.source) missing.push("metadata.source")
      if (!updateMetadata.score) {
        missing.push("metadata.score")
      } else {
        if (updateMetadata.score.sim_query_context === undefined) missing.push("metadata.score.sim_query_context")
        if (updateMetadata.score.avg_sim_answer_context === undefined) missing.push("metadata.score.avg_sim_answer_context")
        if (updateMetadata.score.sim_query_answer === undefined) missing.push("metadata.score.sim_query_answer")
      }
    }
  } else {
    missing.push("metadata")
  }

  return missing
}

function isSearchResultContent(content: any): content is SearchResultContentFinal {
  return (
    content !== null &&
    typeof content === "object" &&
    (Object.prototype.hasOwnProperty.call(content, "searches") ||
      Object.prototype.hasOwnProperty.call(content, "timing"))
  )
}

function isFinalAnswerMetadata(metadata: ItemMetadataFinal): metadata is Extract<ItemMetadataFinal, { source: any; timing: any }> {
  return metadata !== null && typeof metadata === 'object' && 'timing' in metadata
}

function isUpdateEventMetadata(metadata: ItemMetadataFinal): metadata is Extract<ItemMetadataFinal, { score: any }> {
  return metadata !== null && typeof metadata === 'object' && 'score' in metadata
}

export function RAGResponseCardFinal({ item }: RAGResponseCardProps) {
  const [showRaw, setShowRaw] = useState(false)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const Icon = eventIcons[item.event] || Zap
  const colorClass = eventColors[item.event] || "bg-muted text-muted-foreground"

  const missingParams = findMissingParams(item)

  const toggleTool = (toolName: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolName)) {
        newSet.delete(toolName)
      } else {
        newSet.add(toolName)
      }
      return newSet
    })
  }

  const renderSearchTools = () => {
    if (!item.metadata || !isFinalAnswerMetadata(item.metadata)) return null
    
    const searches = item.metadata.source?.searches
    if (!searches) return null

    return (
      <div className="space-y-3 mt-3">
        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <Search className="w-3 h-3" />
          Search Tools Used
        </h4>
        
        {searches.qna_search && (
          <Card className="p-3 bg-muted/30 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                QNA Search
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {searches.qna_search.exec_time}ms
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleTool('qna_search')}
              className="w-full justify-between h-7 text-xs"
            >
              <span>{searches.qna_search.struct_data.length} results</span>
              <span>{expandedTools.has('qna_search') ? '▼' : '▶'}</span>
            </Button>
            {expandedTools.has('qna_search') && (
              <div className="mt-2 space-y-2">
                {searches.qna_search.struct_data.map((result, idx) => (
                  <div key={idx} className="p-2 bg-background/50 rounded text-xs space-y-1">
                    <p className="font-medium text-foreground">Q: {result.question}</p>
                    <p className="text-muted-foreground">A: {result.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {searches.web_search && (
          <Card className="p-3 bg-muted/30 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                Web Search
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {searches.web_search.exec_time}ms
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleTool('web_search')}
              className="w-full justify-between h-7 text-xs"
            >
              <span>{searches.web_search.struct_data.length} results</span>
              <span>{expandedTools.has('web_search') ? '▼' : '▶'}</span>
            </Button>
            {expandedTools.has('web_search') && (
              <div className="mt-2 space-y-2">
                {searches.web_search.struct_data.map((result, idx) => (
                  <div key={idx} className="p-2 bg-background/50 rounded text-xs">
                    <p className="text-muted-foreground whitespace-pre-wrap">{result.context}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {searches.rag_search && (
          <Card className="p-3 bg-muted/30 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                RAG Search
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {searches.rag_search.exec_time}ms
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleTool('rag_search')}
              className="w-full justify-between h-7 text-xs"
            >
              <span>{searches.rag_search.struct_data.length} results</span>
              <span>{expandedTools.has('rag_search') ? '▼' : '▶'}</span>
            </Button>
            {expandedTools.has('rag_search') && (
              <div className="mt-2 space-y-2">
                {searches.rag_search.struct_data.map((result, idx) => (
                  <div key={idx} className="p-2 bg-background/50 rounded text-xs">
                    <p className="text-muted-foreground whitespace-pre-wrap">{result.context}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    )
  }

  const renderScores = () => {
    if (!item.metadata || !isUpdateEventMetadata(item.metadata)) return null
    
    const scores = item.metadata.score
    if (!scores) return null

    return (
      <div className="space-y-2 mt-3">
        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-3 h-3" />
          Confidence Scores
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-muted/30 rounded text-center">
            <p className="text-xs text-muted-foreground mb-1">Query-Context</p>
            <p className="text-sm font-bold text-foreground">
              {(scores.sim_query_context * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded text-center">
            <p className="text-xs text-muted-foreground mb-1">Answer-Context</p>
            <p className="text-sm font-bold text-foreground">
              {(scores.avg_sim_answer_context * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded text-center">
            <p className="text-xs text-muted-foreground mb-1">Query-Answer</p>
            <p className="text-sm font-bold text-foreground">
              {(scores.sim_query_answer * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderTiming = () => {
    if (!item.metadata || !isFinalAnswerMetadata(item.metadata)) return null
    
    const timing = item.metadata.timing
    if (!timing) return null

    return (
      <div className="flex items-center gap-4 pt-2 border-t border-border/30 text-xs text-muted-foreground">
        <span className="font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Total: {timing.total_time_ms}ms
        </span>
        <span className="font-mono flex items-center gap-1">
          <Brain className="w-3 h-3" />
          Thinking: {timing.total_thinking_ms}ms
        </span>
      </div>
    )
  }

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

    if (typeof item.content === "object" && !isSearchResultContent(item.content)) {
      return (
        <pre className="text-sm font-mono text-muted-foreground overflow-x-auto bg-muted/30 p-3 rounded-lg">
          {JSON.stringify(item.content, null, 2)}
        </pre>
      )
    }

    return <p className="text-sm text-foreground whitespace-pre-wrap">{String(item.content)}</p>
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
                {item.event.replace(/_/g, " ").toUpperCase()}
              </Badge>
              {item.metadata && isFinalAnswerMetadata(item.metadata) && item.metadata.agent && (
                <Badge variant="secondary" className="text-xs">
                  {item.metadata.agent.type}
                </Badge>
              )}
              {item.isChunk && (
                <Badge variant="default" className="text-xs">
                  Streaming
                </Badge>
              )}
              {item.isFinal && (
                <Badge variant="default" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  Final
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

        {!showRaw && renderScores()}
        {!showRaw && renderSearchTools()}

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
          <>
            {renderTiming()}
            <div className="flex items-center gap-4 pt-2 border-t border-border/30 text-xs text-muted-foreground">
              <span className="font-mono">Index: {item.index}</span>
              <span className="font-mono">Seq: {item.sequence}</span>
              <span className="font-mono">RunID: {item.runId.slice(0, 8)}...</span>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
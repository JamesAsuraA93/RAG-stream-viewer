import { ChunkWrapper } from "@/types/rag-stream"
import type { RAGStreamData, FormattedChunkItem, ParsedChunk, SearchResultContent, ChunkItem } from "@/types/rag-stream"

export function formatRAGStreamData(data: RAGStreamData | string): FormattedChunkItem[] {
  try {
    let parsedData: RAGStreamData

    // If input is a string, attempt several parsing strategies
    if (typeof data === "string") {
      const text = data.trim()

      // Quick SSE/data: lines handler
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !/^\s*:\s*ping\b/.test(l))
      const dataLines = lines.filter((l) => l.toLowerCase().startsWith("data:"))

      if (dataLines.length > 0) {
        const parsedObjects: any[] = []

        for (const line of dataLines) {
          const payload = line.replace(/^data:\s*/i, "").trim()
          if (!payload) continue
          try {
            parsedObjects.push(JSON.parse(payload))
          } catch {
            const match = payload.match(/\{[\s\S]*\}/)
            if (match) {
              try {
                parsedObjects.push(JSON.parse(match[0]))
              } catch {
                // ignore invalid payload
              }
            }
          }
        }

        if (parsedObjects.length === 0) {
          throw new Error("SSE parsing detected but no valid JSON objects found")
        }

        const constructed = parsedObjects.map((obj, idx) => ({
          index: idx,
          timestamp: obj.timestamp || "",
          chunk: { data: JSON.stringify(obj) },
          is_duplicate: false,
        }))

        parsedData = { chunk_list: constructed }
      } else {
        // Try full JSON parse
        try {
          const parsed = JSON.parse(text)
          if (parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
            parsedData = parsed
          } else {
            throw new Error("No chunk_list found in parsed data")
          }
        } catch {
          // Fallback: split concatenated JSON objects by balanced braces
          const objs: any[] = []
          let buffer = ""
          let braceCount = 0
          let inString = false
          let escapeNext = false

          for (let i = 0; i < text.length; i++) {
            const ch = text[i]
            buffer += ch

            if (escapeNext) {
              escapeNext = false
              continue
            }
            if (ch === "\\") {
              escapeNext = true
              continue
            }
            if (ch === '"' && !escapeNext) {
              inString = !inString
            }

            if (!inString) {
              if (ch === "{") braceCount++
              else if (ch === "}") braceCount--
            }

            if (!inString && braceCount === 0 && buffer.trim()) {
              try {
                const p = JSON.parse(buffer)
                if (p && p.chunk_list && Array.isArray(p.chunk_list)) {
                  objs.push(...p.chunk_list)
                } else if (p && p.chunk) {
                  objs.push(p)
                }
              } catch {
                // ignore invalid chunk
              }
              buffer = ""
            }
          }

          if (objs.length === 0) {
            throw new Error("Failed to parse input string into chunk_list")
          }

          // Deduplicate using run_id + sequence if possible
          const unique = new Map<string, any>()
          objs.forEach((c: any, idx: number) => {
            try {
              const inner = JSON.parse(c.chunk?.data ?? "{}")
              const key = `${inner.run_id ?? "?"}-${inner.sequence ?? idx}`
              if (!unique.has(key)) unique.set(key, c)
            } catch {
              unique.set(Math.random().toString(), c)
            }
          })

          parsedData = { chunk_list: Array.from(unique.values()) }
        }
      }
    } else {
      parsedData = data
    }

    if (!parsedData || !Array.isArray(parsedData.chunk_list)) {
      throw new Error("Data must contain a 'chunk_list' array")
    }

    return parsedData.chunk_list.map((item: ChunkItem, idx: number) => {
      try {
        const chunk: ParsedChunk = JSON.parse(item.chunk.data)
        return {
          index: item.index,
          timestamp: item.timestamp ?? "",
          event: (chunk.event ?? "unknown") as FormattedChunkItem["event"],
          content: chunk.content ?? "No content",
          runId: chunk.run_id ?? "unknown",
          sequence: chunk.sequence ?? 0,
          metadata: chunk.metadata ?? null,
          isChunk: chunk.is_chunk ?? null,
          isFinal: chunk.is_final ?? null,
          isDuplicate: item.is_duplicate ?? null,
        }
      } catch (err) {
        throw new Error(`Failed to parse chunk ${idx}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    })
  } catch (err) {
    console.error("[v0] Error in formatRAGStreamData:", err)
    throw err
  }
}

export function groupByTool(data: RAGStreamData | string) {
  const formatted = formatRAGStreamData(data)
  const grouped: Record<string, FormattedChunkItem[]> = {}

  formatted.forEach((item) => {
    const toolName = item.metadata?.tool?.name || "system"

    if (!grouped[toolName]) {
      grouped[toolName] = []
    }

    grouped[toolName].push(item)
  })

  return grouped
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function formatSearchResult(content: SearchResultContent): string {
  const query = content.query_text || "N/A"
  const action = content.action || "N/A"
  const resultCount = content.result_count || content.results?.length || 0
  const executionTime = content.execution_time ? `Time: ${content.execution_time}ms` : ""

  return `Query: ${query}
Action: ${action}
Results: ${resultCount} items
${executionTime}`
}

import { ChunkWrapper } from "@/types/rag-stream"
import type { RAGStreamData, FormattedChunkItem, ParsedChunk, SearchResultContent, ChunkItem } from "@/types/rag-stream"

export function formatRAGStreamData(data: RAGStreamData | string): FormattedChunkItem[] {
  try {
    let parsedData: RAGStreamData
    let allChunks: RAGStreamData["chunk_list"] = []

    // Parse the input if it's a string
    if (typeof data === "string") {
      let textToParse = data.trim()

      console.log("[v0] Input length:", textToParse.length)
      console.log("[v0] Input preview:", textToParse.substring(0, 200))

      // Replace {{ with { at the start and }} with } at the end
      if (textToParse.startsWith("{{")) {
        textToParse = "{" + textToParse.slice(2)
      }
      if (textToParse.endsWith("}}")) {
        textToParse = textToParse.slice(0, -2) + "}"
      }

      // Wrap partial JSON that starts with "chunk_list"
      if (textToParse.startsWith('"chunk_list"') || textToParse.startsWith("'chunk_list'")) {
        console.log("[v0] Detected partial JSON starting with 'chunk_list', wrapping...")
        textToParse = `{${textToParse}}`
      }

      try {
        const parsed = JSON.parse(textToParse)
        if (parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
          console.log(`[v0] Successfully parsed as single JSON object with ${parsed.chunk_list.length} chunks`)
          parsedData = parsed
          allChunks = parsed.chunk_list
        } else {
          throw new Error("No chunk_list found in parsed data")
        }
      } catch (singleParseError) {
        console.log("[v0] Single parse failed, attempting recovery strategies...")

        // Strategy 1: Check for ]"chunk_list" pattern (concatenated without separator)
        if (textToParse.includes(']"chunk_list"')) {
          console.log("[v0] Detected concatenated arrays without separator, splitting...")
          const parts = textToParse.split(/\][\s]*"chunk_list":/).filter(Boolean)

          for (let i = 0; i < parts.length; i++) {
            let part = parts[i].trim()

            // First part already has opening brace
            if (i === 0) {
              if (!part.endsWith("]")) part += "]"
              if (!part.endsWith("}")) part += "}"
            } else {
              // Other parts need wrapping
              part = '{"chunk_list":' + part
              if (!part.endsWith("}")) part += "}"
            }

            try {
              const parsed = JSON.parse(part)
              if (parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
                console.log(`[v0] Extracted ${parsed.chunk_list.length} chunks from part ${i + 1}`)
                allChunks = allChunks.concat(parsed.chunk_list)
              }
            } catch (partErr) {
              console.error(`[v0] Failed to parse part ${i + 1}:`, partErr)
            }
          }

          if (allChunks.length > 0) {
            const uniqueChunks = new Map()
            
            // interface InnerParsed {
            //   run_id?: string
            //   sequence?: number | string
            //   [k: string]: any
            // }

            // interface ChunkWrapper {
            //   chunk: {
            //     data: string
            //   }
            //   [k: string]: any
            // }

            allChunks.forEach((chunk: ChunkWrapper) => {
              try {
                const parsed = JSON.parse(chunk.chunk.data)
                const key = `${parsed.run_id}-${parsed.sequence}`
                const map = uniqueChunks as Map<string, ChunkWrapper>
                if (!map.has(key)) {
                  map.set(key, chunk)
                }
              } catch (err: unknown) {
                ;(uniqueChunks as Map<string, ChunkWrapper>).set(Math.random().toString(), chunk)
              }
            })

            parsedData = { chunk_list: Array.from(uniqueChunks.values()) }
            console.log(`[v0] After deduplication: ${parsedData.chunk_list.length} unique chunks`)
          } else {
            throw new Error("Failed to extract chunks from concatenated arrays")
          }
        }
        // Strategy 2: Look for }{ pattern (proper concatenation)
        else if (textToParse.includes("}{")) {
          console.log("[v0] Detected concatenated objects with }{ separator")

          const jsonObjects: string[] = []
          let braceCount = 0
          let currentObj = ""
          let inString = false
          let escapeNext = false

          for (let i = 0; i < textToParse.length; i++) {
            const char = textToParse[i]

            if (escapeNext) {
              escapeNext = false
              currentObj += char
              continue
            }

            if (char === "\\") {
              escapeNext = true
              currentObj += char
              continue
            }

            if (char === '"' && !escapeNext) {
              inString = !inString
            }

            currentObj += char

            if (!inString) {
              if (char === "{") {
                braceCount++
              } else if (char === "}") {
                braceCount--

                if (braceCount === 0 && currentObj.trim()) {
                  jsonObjects.push(currentObj.trim())
                  currentObj = ""
                }
              }
            }
          }

          if (currentObj.trim() && braceCount === 0) {
            jsonObjects.push(currentObj.trim())
          }

          console.log(`[v0] Detected ${jsonObjects.length} JSON object(s)`)

          for (let i = 0; i < jsonObjects.length; i++) {
            try {
              const parsed = JSON.parse(jsonObjects[i])
              if (parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
                console.log(`[v0] Found ${parsed.chunk_list.length} chunks in object ${i + 1}`)
                allChunks = allChunks.concat(parsed.chunk_list)
              }
            } catch (err) {
              console.error(`[v0] Error parsing object ${i + 1}:`, err instanceof Error ? err.message : err)
            }
          }

          const uniqueChunks = new Map()

          allChunks.forEach((chunk: ChunkWrapper) => {
            try {
              const parsed = JSON.parse(chunk.chunk.data)
              const key = `${parsed.run_id}-${parsed.sequence}`
              if (!uniqueChunks.has(key)) {
                uniqueChunks.set(key, chunk)
              }
            } catch (err) {
              uniqueChunks.set(Math.random().toString(), chunk)
            }
          })

          parsedData = { chunk_list: Array.from(uniqueChunks.values()) }
          console.log(`[v0] After deduplication: ${parsedData.chunk_list.length} unique chunks`)
        } else {
          console.error("[v0] No recovery strategy matched")
          console.error(
            "[v0] Parse error:",
            singleParseError instanceof Error ? singleParseError.message : singleParseError,
          )
          throw singleParseError
        }
      }
    } else {
      parsedData = data
    }

    // Check if chunk_list exists
    if (!parsedData.chunk_list || !Array.isArray(parsedData.chunk_list)) {
      console.error("[v0] Invalid data structure:", parsedData)
      throw new Error("Data must contain a 'chunk_list' array")
    }

    console.log(`[v0] Processing ${parsedData.chunk_list.length} chunks`)

    return parsedData.chunk_list.map((item: ChunkItem, idx:number) => {
      try {
        console.log(`[v0] --- Chunk ${idx + 1} Value Sources ---`)

        console.log('[v0] --- Chunk Item', JSON.stringify(item, null, 2));

        console.log(`[v0] Outer level (item.is_duplicate):`, item.is_duplicate)

        const chunk: ParsedChunk = JSON.parse(item.chunk.data)

        console.log(`[v0] Inner level (chunk.is_chunk):`, chunk.is_chunk)
        console.log(`[v0] Inner level (chunk.is_final):`, chunk.is_final)

        const event = chunk.event || "unknown"
        const content = chunk.content ?? "No content"
        const runId = chunk.run_id || "unknown"
        const sequence = chunk.sequence ?? 0
        const metadata = chunk.metadata ?? null
        const isChunk = chunk?.is_chunk ?? null
        const isFinal = chunk?.is_final ?? null
        const isDuplicate = item.is_duplicate ?? null

        // Log missing values for debugging
        const missingFields: string[] = []
        if (!chunk.event) missingFields.push("event")
        if (chunk.content === null || chunk.content === undefined) missingFields.push("content")
        if (!chunk.run_id) missingFields.push("run_id")
        if (chunk.sequence === null || chunk.sequence === undefined) missingFields.push("sequence")
        if (!chunk.metadata) missingFields.push("metadata")
        if (chunk.is_chunk === null || chunk.is_chunk === undefined) missingFields.push("is_chunk")
        if (chunk.is_final === null || chunk.is_final === undefined) missingFields.push("is_final")
        if (item.is_duplicate === null || item.is_duplicate === undefined) missingFields.push("is_duplicate (outer)")

        if (missingFields.length > 0) {
          console.log(`[v0] Chunk ${idx + 1} missing fields:`, missingFields.join(", "))
        }

        return {
          index: item.index,
          timestamp: item.timestamp ?? "",
          event: event as FormattedChunkItem["event"],
          content,
          runId,
          sequence,
          metadata,
          isChunk,
          isFinal,
          isDuplicate,
        }
      } catch (err) {
        console.error(`[v0] Error parsing chunk ${idx}:`, err)
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

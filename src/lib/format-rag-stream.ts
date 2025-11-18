import { ChunkWrapper } from "@/types/rag-stream"
import type { RAGStreamData, ParsedChunk, SearchResultContent, ChunkItem } from "@/types/rag-stream"

/**
 * Normalize a parsed chunk object and its wrapper into a canonical shape the UI expects.
 * Produces both snake_case and camelCase variants for common fields to remain backward compatible.
 */
export function normalizeChunkItem(parsed: any, wrapper?: ChunkWrapper, idx?: number) {
  const out: any = {}

  // Basic fields
  out.event = String(parsed?.event ?? parsed?.type ?? "unknown")
  out.event_label = out.event.replaceAll("_", " ")
  out.content = parsed?.content ?? parsed?.data ?? null

  // run id (both forms)
  const runId = parsed?.run_id ?? (parsed as any)?.runId ?? wrapper?.run_id ?? (wrapper as any)?.runId ?? null
  out.run_id = runId ?? null
  out.runId = runId ?? null

  // index/sequence
  out.index = wrapper?.index ?? parsed?.index ?? idx ?? null
  out.sequence = parsed?.sequence ?? (parsed as any)?.seq ?? wrapper?.sequence ?? null

  // flags (both snake_case and camelCase)
  out.is_chunk = parsed?.is_chunk ?? (parsed as any)?.isChunk ?? false
  out.isChunk = out.is_chunk
  out.is_final = parsed?.is_final ?? (parsed as any)?.isFinal ?? false
  out.isFinal = out.is_final
  out.is_duplicate = wrapper?.is_duplicate ?? parsed?.is_duplicate ?? (parsed as any)?.isDuplicate ?? false
  out.isDuplicate = out.is_duplicate
  
  // timestamp
  out.timestamp = parsed?.timestamp ?? wrapper?.timestamp ?? new Date().toISOString()

  // metadata normalization
  const meta = parsed?.metadata ?? wrapper?.metadata ?? {}
  out.metadata = {
    source: meta?.source ?? null,
    timing: meta?.timing ?? null,
    agent: meta?.agent ?? null,
    tool: { name: meta?.tool?.name ?? meta?.tool ?? null },
  }

  // keep the original raw object for 'Raw' view
  out.__raw = parsed

  return out
}

export function formatRAGStreamData(data: RAGStreamData | string) {
  try {
    const parsedData = parseRawToRAGStreamData(data)

    if (!parsedData || !Array.isArray(parsedData.chunk_list)) {
      throw new Error("Data must contain a 'chunk_list' array")
    }

    return parsedData.chunk_list.map((item: ChunkItem, idx: number) => {
      try {
        const chunk: ParsedChunk = JSON.parse(item.chunk.data)
        return normalizeChunkItem(chunk, item, idx)

      } catch (err) {
        throw new Error(`Failed to parse chunk ${idx}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    })
  } catch (err) {
    console.error("[v0] Error in formatRAGStreamData:", err)
    throw err
  }
}

/**
 * Parse raw input (SSE-style stream or full JSON) into a normalized RAGStreamData
 */
export function parseRawToRAGStreamData(data: RAGStreamData | string): RAGStreamData {
  let parsedData: RAGStreamData
  let allChunks: RAGStreamData["chunk_list"] = []

  if (typeof data === "string") {
    let textToParse = data.trim()

    console.log("[v0] Input length:", textToParse.length)
    console.log("[v0] Input preview:", textToParse.substring(0, 200))

    if (textToParse.startsWith("{{")) {
      textToParse = "{" + textToParse.slice(2)
    }

  
    if (textToParse.endsWith("}}")) {
      textToParse = textToParse.slice(0, -2) + "}"
    }

    if (textToParse.startsWith('"chunk_list"') || textToParse.startsWith("'chunk_list'")) {
      console.log("[v0] Detected partial JSON starting with 'chunk_list', wrapping...")
      textToParse = `{${textToParse}}`
    }

    // SSE-friendly parsing: split lines, drop ping lines, parse data: lines
    const lines = textToParse.split(/\r?\n/).map((l) => l.trim())
    const nonPingLines = lines.filter((l) => !/^\s*:\s*ping\b/.test(l) && l.length > 0)
    const dataLines = nonPingLines.filter((l) => l.startsWith("data:"))

    if (dataLines.length > 0) {
      console.log(`[v0] Detected ${dataLines.length} SSE 'data:' line(s), parsing individually`)
      const parsedObjects: any[] = []

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i]
        let payload = line.replace(/^data:\s*/i, "").trim()
        if (!payload) continue

        try {
          parsedObjects.push(JSON.parse(payload))
        } catch (e) {
          const match = payload.match(/\{[\s\S]*\}/)
          if (match) {
            try {
              parsedObjects.push(JSON.parse(match[0]))
            } catch (err) {
              console.error(`[v0] Failed to parse JSON from SSE line ${i + 1}:`, err)
            }
          } else {
            console.error(`[v0] No JSON object found in SSE line ${i + 1}`)
          }
        }
      }

      if (parsedObjects.length > 0) {
        const constructed = parsedObjects.map((obj, idx) => ({
          index: idx,
          timestamp: obj.timestamp || "",
          chunk: { data: JSON.stringify(obj) },
          is_duplicate: false,
        }))

        parsedData = { chunk_list: constructed }
        return parsedData
      } else {
        throw new Error("SSE parsing detected but no valid JSON objects found")
      }
    }

    // Try parsing full JSON
    try {
      const parsed = JSON.parse(textToParse)
      if (parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
        console.log(`[v0] Successfully parsed as single JSON object with ${parsed.chunk_list.length} chunks`)
        parsedData = parsed
        return parsedData
      }
    } catch (err) {
      console.log("[v0] Single parse failed, attempting recovery strategies...")
    }

    // Recovery: try to split concatenated JSON objects
    if (textToParse.includes(']"chunk_list"')) {
      console.log("[v0] Detected concatenated arrays without separator, splitting...")
      const parts = textToParse.split(/\][\s]*"chunk_list":/).filter(Boolean)

      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim()
        if (i === 0) {
          if (!part.endsWith("]")) part += "]"
          if (!part.endsWith("}")) part += "}"
        } else {
          part = '{"chunk_list":' + part
          if (!part.endsWith("}")) part += "}"
        }

        try {
          const parsed = JSON.parse(part)
          if (parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
            allChunks = allChunks.concat(parsed.chunk_list)
          }
        } catch (partErr) {
          console.error(`[v0] Failed to parse part ${i + 1}:`, partErr)
        }
      }

      if (allChunks.length > 0) {
        const uniqueChunks = new Map()
        allChunks.forEach((chunk: ChunkWrapper) => {
          try {
            const parsed = JSON.parse(chunk.chunk.data)
            const key = `${parsed.run_id}-${parsed.sequence}`
            const map = uniqueChunks as Map<string, ChunkWrapper>
            if (!map.has(key)) map.set(key, chunk)
          } catch (err: unknown) {
            ;(uniqueChunks as Map<string, ChunkWrapper>).set(Math.random().toString(), chunk)
          }
        })

        parsedData = { chunk_list: Array.from(uniqueChunks.values()) }
        console.log(`[v0] After deduplication: ${parsedData.chunk_list.length} unique chunks`)
        return parsedData
      }
    }

    if (textToParse.includes("}{")) {
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
        if (char === '"' && !escapeNext) inString = !inString
        currentObj += char
        if (!inString) {
          if (char === "{") braceCount++
          else if (char === "}") {
            braceCount--
            if (braceCount === 0 && currentObj.trim()) {
              jsonObjects.push(currentObj.trim())
              currentObj = ""
            }
          }
        }
      }

      if (currentObj.trim() && braceCount === 0) jsonObjects.push(currentObj.trim())

      for (let i = 0; i < jsonObjects.length; i++) {
        try {
          const parsed = JSON.parse(jsonObjects[i])
          if (parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
            allChunks = allChunks.concat(parsed.chunk_list)
          }
        } catch (err) {
          console.error(`[v0] Error parsing object ${i + 1}:`, err instanceof Error ? err.message : err)
        }
      }

      if (allChunks.length > 0) {
        const uniqueChunks = new Map()
        allChunks.forEach((chunk: ChunkWrapper) => {
          try {
            const parsed = JSON.parse(chunk.chunk.data)
            const key = `${parsed.run_id}-${parsed.sequence}`
            if (!uniqueChunks.has(key)) uniqueChunks.set(key, chunk)
          } catch (err) {
            uniqueChunks.set(Math.random().toString(), chunk)
          }
        })

        parsedData = { chunk_list: Array.from(uniqueChunks.values()) }
        console.log(`[v0] After deduplication: ${parsedData.chunk_list.length} unique chunks`)
        return parsedData
      }
    }

    throw new Error("Unable to parse input into RAGStreamData")
  } else {
    // already a structured object
    return data
  }
}

/**
 * Parse raw input and return the inner parsed JSON objects (no wrappers).
 * Useful when you want the raw event objects (e.g. the payload of each `data:` line).
 */
export function parseRawToObjects(data: RAGStreamData | string): any[] {
  if (typeof data !== "string") {
    // If already structured, try to extract inner parsed objects from chunk_list
    if (data && Array.isArray(data.chunk_list)) {
      return data.chunk_list.map((c) => {
        try {
          return JSON.parse(c.chunk.data)
        } catch {
          return c.chunk.data
        }
      })
    }
    return []
  }

  const text = data.trim()
  // Strip ping lines and split into non-empty lines
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !/^\s*:\s*ping\b/.test(l))

  // Prefer SSE-style 'data:' lines
  const dataLines = lines.filter((l) => l.toLowerCase().startsWith("data:"))
  const results: any[] = []

  if (dataLines.length > 0) {
    for (const line of dataLines) {
      const payload = line.replace(/^data:\s*/i, "").trim()
      if (!payload) continue
      try {
        results.push(JSON.parse(payload))
        continue
      } catch {
        const match = payload.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            results.push(JSON.parse(match[0]))
            continue
          } catch {
            // fallthrough
          }
        }
      }
    }

    return results
  }

  // If not SSE, try full JSON parse
  try {
    const parsed = JSON.parse(text)
    if (parsed && parsed.chunk_list && Array.isArray(parsed.chunk_list)) {
      return parsed.chunk_list.map((c: any) => {
        try {
          return JSON.parse(c.chunk.data)
        } catch {
          return c.chunk.data
        }
      })
    }
  } catch {
    // ignore
  }

  // Fallback: try to extract any JSON objects from the text
  const objs: any[] = []
  let braceCount = 0
  let buffer = ""
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
    if (ch === '"' && !escapeNext) inString = !inString
    if (!inString) {
      if (ch === "{") braceCount++
      else if (ch === "}") braceCount--
    }

    if (!inString && braceCount === 0 && buffer.trim()) {
      try {
        const p = JSON.parse(buffer)
        objs.push(p)
      } catch {
        // ignore
      }
      buffer = ""
    }
  }

  return objs
}
export function groupByTool(data: RAGStreamData | string) {
  const formatted = formatRAGStreamData(data)
  // const grouped: Record<string, any[]> = {}
  const grouped: Record<string, any[]> = {}

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

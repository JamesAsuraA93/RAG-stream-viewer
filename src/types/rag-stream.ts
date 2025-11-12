export interface InnerParsed {
  run_id?: string;
  sequence?: number | string;
  [k: string]: any;
}

export interface ChunkWrapper {
  chunk: {
    data: string;
  };
  [k: string]: any;
}

// TypeScript interfaces for RAG streaming data
export interface RAGStreamData {
  chunk_list: ChunkItem[];
}

export interface ChunkItem {
  index: number;
  timestamp?: string; // can be missing too
  chunk: ChunkData;
  is_duplicate?: boolean; // Can be missing
}

export interface ChunkData {
  event?: string; // Can be missing
  data: string; // This is a JSON string that needs to be parsed
  sep?: string; // Can be missing
}

export interface ParsedChunk {
  event?: EventType; // Can be missing
  content?: string | SearchResultContent | Record<string, unknown> | null; // Can be missing or null
  run_id?: string; // Can be missing
  sequence?: number; // Can be missing
  metadata?: ChunkMetadata | null; // Can be missing or null
  is_chunk?: boolean; // Can be missing
  is_final?: boolean; // Can be missing
  parent_ids?: string[]; // Can be missing
  timestamp?: string; // Can be missing
}

export interface ChunkMetadata {
  source?: string | null; // Can be null or missing
  tool?: ToolMetadata | null; // Can be null or missing
  timing?: TimingMetadata | null; // Can be null or missing
  agent?: string | null; // Can be null or missing
}

export interface ToolMetadata {
  name?: string | null; // Can be null or missing
  input?: Record<string, unknown> | null; // Can be null or missing
}

export interface TimingMetadata {
  start?: number;
  end?: number;
  duration?: number;
}

export interface SearchResultContent {
  query_text: string;
  action: string;
  results?: SearchResult[];
  execution_time?: number;
  result_count?: number;
}

export interface SearchResult {
  title: string;
  url?: string;
  content?: string;
  score?: number;
}

export type EventType =
  | "thinking_title"
  | "thinking_content"
  | "search_result"
  | "tool_call"
  | "tool_result"
  | "chunk"
  | "final";

export interface FormattedChunkItem {
  index: number;
  timestamp: string;
  event: EventType | "unknown"; // Fallback for missing event
  content: string | SearchResultContent | Record<string, unknown>;
  runId: string;
  sequence: number;
  metadata: ChunkMetadata | null;
  isChunk: boolean | null | undefined;
  isFinal: boolean | null | undefined;
  isDuplicate: boolean | null | undefined;
}

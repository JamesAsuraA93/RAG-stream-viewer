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


// ====== ====== ====== FINAL ====== ====== ======

// Event types
export type EventTypeFinal = 
  | "final_answer"
  | "update_event"
  | "thinking"
  | "tool_call"
  | "error"
  | "unknown";

// Tool-related types
export interface QNASearchResultFinal {
  tool_name: "qna_search";
  question: string;
  answer: string;
  context: string | null;
}

export interface WebSearchResultFinal {
  tool_name: "web_search";
  question: null;
  answer: null;
  context: string;
}

export interface RAGSearchResultFinal {
  tool_name: "rag_search";
  question: null;
  answer: null;
  context: string;
}

export type SearchResultFinal = QNASearchResultFinal | WebSearchResultFinal | RAGSearchResultFinal;

export interface SearchToolFinal {
  tool_name: string;
  context: string;
  struct_data: SearchResultFinal[];
  exec_time: number;
}

export interface SearchSourcesFinal {
  qna_search?: SearchToolFinal;
  web_search?: SearchToolFinal;
  rag_search?: SearchToolFinal;
}

export interface SourceMetadataFinal {
  searches: SearchSourcesFinal;
}

export interface TimingMetadataFinal {
  started_at: string;
  ended_at: string;
  total_thinking_ms: number;
  total_time_ms: number;
}

export interface AgentMetadataFinal {
  type: string;
  use_cache: boolean;
}

// Score metadata for update events
export interface ScoreMetadataFinal {
  sim_query_context: number;
  avg_sim_answer_context: number;
  sim_query_answer: number;
}

export interface UpdateEventMetadataFinal {
  source: string;
  score: ScoreMetadataFinal;
}

// Base metadata union type
export type ItemMetadataFinal = 
  | {
      source: SourceMetadataFinal;
      timing: TimingMetadataFinal;
      tool: null;
      agent: AgentMetadataFinal;
    }
  | UpdateEventMetadataFinal
  | null;

// Search result content for final answers
export interface SearchResultContentFinal {
  searches?: SearchSourcesFinal;
  timing?: TimingMetadataFinal;
}

// Formatted chunk item (renamed from FormattedChunkItem)
export interface RAGResponseItemFinal {
  index: number;
  timestamp: string;
  event: EventType;
  content: string | SearchResultContentFinal | Record<string, unknown>;
  runId: string;
  sequence: number;
  metadata: ItemMetadataFinal;
  isChunk: boolean | null | undefined;
  isFinal: boolean | null | undefined;
  isDuplicate: boolean | null | undefined;
}
"use client"

import type React from "react"

import { useState } from "react"
import { StreamViewer } from "@/components/stream-viewer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatRAGStreamData } from "@/lib/format-rag-stream"
import { Upload, FileJson, ArrowLeft, ArrowRight } from "lucide-react"

const DEFAULT_EXAMPLE = `{
  "chunk_list": [
    {
      "index": 1,
      "chunk": {
        "data": "{\\"event\\": \\"thinking_title\\", \\"content\\": \\"Example Event\\", \\"run_id\\": \\"example-run-id\\", \\"parent_ids\\": [], \\"timestamp\\": \\"2025-11-12T05:00:00.000000\\", \\"sequence\\": 1, \\"metadata\\": {\\"source\\": \\"rag_thinking\\", \\"timing\\": null, \\"tool\\": {\\"name\\": \\"example_tool\\"}, \\"agent\\": null}, \\"is_chunk\\": true, \\"is_final\\": false}",
        "sep": "\\r\\n"
      },
      "timestamp": "2025-11-12T12:00:00.000000",
      "is_duplicate": false
    }
  ]
}`

export default function Home() {
  const [streamData, setStreamData] = useState<ReturnType<typeof formatRAGStreamData> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentData, setCurrentData] = useState<string>("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      const text = await file.text()
      const count = (text.match(/"is_duplicate"/g) || []).length
      console.log("[v0] File uploaded, length:", text.length)
      console.log(`[v0] File contains "is_duplicate": ${count} times`)
      setCurrentData(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const count = (newValue.match(/"is_duplicate"/g) || []).length
    console.log("[v0] Input changed, new length:", newValue.length)
    console.log(`[v0] Contains "is_duplicate": ${count} times`)
    console.log("[v0] First 100 chars:", newValue.substring(0, 100))
    setCurrentData(newValue)
    setError(null)
  }

  const handleSubmit = () => {
    try {
      setError(null)

      const count = (currentData.match(/"is_duplicate"/g) || []).length
      console.log("[v0] === SUBMIT ANALYSIS ===")
      console.log("[v0] currentData length:", currentData.length)
      console.log(`[v0] currentData contains "is_duplicate": ${count} times`)
      console.log("[v0] First 200 chars of data to analyze:", currentData.substring(0, 200))
      console.log("[v0] Last 200 chars of data to analyze:", currentData.substring(currentData.length - 200))

      const formatted = formatRAGStreamData(currentData)
      setStreamData(formatted)
    } catch (err) {
      console.error("[v0] Submit error:", err)
      setError(err instanceof Error ? err.message : "Failed to parse JSON")
    }
  }

  const handleBack = () => {
    setStreamData(null)
  }

  const handleReset = () => {
    setStreamData(null)
    setCurrentData("")
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <FileJson className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">RAG Stream Viewer</h1>
                <p className="text-sm text-muted-foreground">Visualize and analyze streaming data</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!streamData ? (
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/50">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">RAG Stream Data Editor</h2>
                  <p className="text-muted-foreground">Paste, upload, or edit your JSON data</p>
                </div>
                <label>
                  <Button variant="outline" asChild className="cursor-pointer bg-transparent">
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Paste or edit your JSON data below
                  </label>
                  {!currentData && (
                    <Button variant="ghost" size="sm" onClick={() => setCurrentData(DEFAULT_EXAMPLE)}>
                      Load Example
                    </Button>
                  )}
                </div>
                <textarea
                  value={currentData}
                  onChange={handleInputChange}
                  placeholder={`Paste your JSON data here (e.g., {"chunk_list": [ ... ]}) or just "chunk_list": [ ... ])`}
                  className="w-full h-[500px] p-4 rounded-lg bg-background border border-border font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  Current length: {currentData.length} characters
                  {currentData.length > 0 && (
                    <span> | "is_duplicate" count: {(currentData.match(/"is_duplicate"/g) || []).length}</span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                {currentData && (
                  <Button onClick={handleReset} variant="outline" size="lg">
                    Clear All
                  </Button>
                )}
                <Button onClick={handleSubmit} className="flex-1" size="lg" disabled={!currentData}>
                  Submit & Analyze
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Stream Analysis</h2>
                <p className="text-muted-foreground">Displaying {streamData?.length} events</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Edit
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <Upload className="w-4 h-4 mr-2" />
                  Load New Data
                </Button>
              </div>
            </div>

            <StreamViewer items={streamData || []} />
          </div>
        )}
      </main>
    </div>
  )
}

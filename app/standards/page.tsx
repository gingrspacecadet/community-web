"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, X, Merge, Edit, BookOpen } from "lucide-react"
import DatabaseStatus from "@/components/ui/database-status"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import Header from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Standard {
  id: string
  title: string
  description: string
  content: string
  status: string
  created_at: string
  voting_ends_at: string
  created_by: string
  votes?: { vote_type: string; user_id: string }[]
}

export default function StandardsPage() {
  const { user } = useSession()
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [votingLoading, setVotingLoading] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [mergingId, setMergingId] = useState<string | null>(null)
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null)
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(80)

  useEffect(() => {
    fetchStandards()
  }, [])

  const fetchStandards = async () => {
    if (!supabase) {
      setError("Database connection not configured.")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("standards")
        .select(`
          id,
          title,
          description,
          content,
          status,
          created_at,
          voting_ends_at,
          created_by,
          votes (
            vote_type,
            user_id
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setStandards(data || [])
      
      // Debug: Log fetched standards
      console.log("Fetched standards:", data)
    } catch (err: any) {
      console.error("Fetch error:", err)
      setError(err.message || "Failed to fetch standards")
    } finally {
      setLoading(false)
    }
  }

  // ... [keep all other existing functions: handleVote, handleMerge, etc.]

  const mergedStandards = standards.filter(standard => standard.status === "merged")

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-lg">Loading standards...</div>
        </div>
      </div>
    )
  }

  if (error && !supabase) {
    return <DatabaseStatus error={error} />
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Side Panel Toggle Button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className={`fixed ${isPanelOpen ? 'right-80' : 'right-0'} top-1/2 transform -translate-y-1/2 bg-white px-3 py-4 rounded-l-lg shadow-md border border-gray-200 border-r-0 hover:bg-gray-50 z-10 transition-all duration-300`}
        >
          <span className="text-sm font-medium">
            {isPanelOpen ? "Hide" : "View Standards"}
          </span>
        </button>

        {/* Side Panel */}
        <div 
          className={`fixed top-0 right-0 h-full bg-white shadow-lg border-l border-gray-200 transform transition-all duration-300 ease-in-out z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ width: `${panelWidth}vw`, maxWidth: '600px' }}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Merged Standards</h2>
              <div className="flex gap-2">
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                >
                  <Link href="/wiki" className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Wiki
                  </Link>
                </Button>
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {mergedStandards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No merged standards yet. Approve standards to see them here.
                </div>
              ) : (
                <div className="space-y-2">
                  {mergedStandards.map(standard => {
                    const isExpanded = expandedStandard === standard.id
                    const isCreator = user?.id === standard.created_by
                    
                    return (
                      <div 
                        key={standard.id} 
                        className={`border rounded-lg p-3 transition-all ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                      >
                        <div 
                          className="flex justify-between items-center"
                          onClick={() => handleStandardClick(standard.id)}
                        >
                          <h3 className="font-bold">{standard.title}</h3>
                          {isCreator && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditRequest(standard)
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              aria-label="Edit standard"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {standard.description}
                            </p>
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {standard.content}
                              </p>
                            </div>
                            <div className="text-xs text-gray-500 pt-2">
                              Created: {new Date(standard.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Community Standards</h1>
            <p className="mt-2 text-gray-600">Vote on proposed standards and guidelines</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center mb-8">
            <Button asChild>
              <Link href="/standards/create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Propose New Standard
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            {standards.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No standards proposed yet.</div>
                <Button asChild>
                  <Link href="/standards/create">Propose the First Standard</Link>
                </Button>
              </div>
            ) : (
              standards.map((standard) => {
                const voteStats = getVoteStats(standard.votes)
                const userVote = getUserVote(standard.votes)
                const votingActive = isVotingActive(standard.voting_ends_at)
                const isCreator = user?.id === standard.created_by
                const canMerge = isCreator && standard.status === "approved"

                return (
                  <Card key={standard.id}>
                    {/* ... [rest of your card content] ... */}
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}

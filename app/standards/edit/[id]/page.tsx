"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"

export default function EditWikiPost() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useSession()
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPost = async () => {
      if (!supabase || !user) return
      
      try {
        const { data, error } = await supabase
          .from('wiki_posts')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setContent(data.content)
        setTitle(data.title)
      } catch (err: any) {
        setError(err.message || "Failed to fetch post")
      }
    }

    fetchPost()
  }, [id, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user?.id) return

    setLoading(true)
    setError("")

    try {
      await supabase.from('edit_proposals').insert([{
        wiki_post_id: id,
        title,
        content,
        created_by: user.id,
        voting_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }])

      router.push(`/standards/wiki`)
    } catch (err: any) {
      setError(err.message || "Failed to submit edit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Wiki Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                required
              />
            </div>
            <div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content"
                rows={10}
                required
              />
            </div>
            {error && <div className="text-red-500">{error}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Edit Proposal"}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
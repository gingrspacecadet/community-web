"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, FileText, Edit, FileInput, ImageIcon } from "lucide-react"
import DatabaseStatus from "@/components/ui/database-status"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import Header from "@/components/layout/header"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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
  user?: { username: string }
}

interface WikiPost {
  id: string
  title: string
  content: string
  topic: string
  created_at: string
  updated_at: string
  created_by: string
  user?: { username: string }
}

interface EditProposal {
  id: string
  wiki_post_id: string
  title: string
  content: string
  status: string
  created_by: string
  created_at: string
  voting_ends_at: string
  votes?: { vote_type: string; user_id: string }[]
  user?: { username: string }
}

interface Schematic {
  id: string
  name: string
  file_url: string
  file_type: string
  created_at: string
  created_by: string
}

interface WikiImage {
  id: string
  wiki_post_id: string
  image_url: string
  created_at: string
  created_by: string
}

export default function StandardsPage() {
  const { user } = useSession()
  const [standards, setStandards] = useState<Standard[]>([])
  const [wikiPosts, setWikiPosts] = useState<WikiPost[]>([])
  const [editProposals, setEditProposals] = useState<EditProposal[]>([])
  const [schematics, setSchematics] = useState<Schematic[]>([])
  const [wikiImages, setWikiImages] = useState<WikiImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [votingLoading, setVotingLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("voting")
  const [selectedWikiPost, setSelectedWikiPost] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    fetchStandards()
    if (activeTab === "wiki") {
      fetchWikiPosts()
      fetchEditProposals()
      fetchWikiImages()
    }
    if (activeTab === "schematics") fetchSchematics()
  }, [activeTab])

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
          votes:votes(vote_type, user_id),
          user:users(username)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setStandards(data || [])
      await processStuckVotes(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch standards")
    } finally {
      setLoading(false)
    }
  }

  const fetchWikiPosts = async () => {
    if (!supabase || !user) return

    try {
      const { data, error } = await supabase
        .from("wiki_posts")
        .select(`
          *,
          user:users(username)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setWikiPosts(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch wiki posts")
    }
  }

  const fetchEditProposals = async () => {
    if (!supabase || !user) return

    try {
      const { data, error } = await supabase
        .from("edit_proposals")
        .select(`
          *,
          votes:edit_proposal_votes(vote_type, user_id),
          user:users(username)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEditProposals(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch edit proposals")
    }
  }

  const fetchSchematics = async () => {
    if (!supabase || !user) return

    try {
      const { data, error } = await supabase
        .from("schematics")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setSchematics(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch schematics")
    }
  }

  const fetchWikiImages = async () => {
    if (!supabase || !user) return

    try {
      const { data, error } = await supabase
        .from("wiki_images")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setWikiImages(data || [])
    } catch (err: any) {
      console.error("Failed to fetch wiki images:", err.message)
    }
  }

  const processStuckVotes = async (standards: Standard[]) => {
    const now = new Date()
    
    for (const standard of standards) {
      if (standard.status === "voting" && new Date(standard.voting_ends_at) <= now) {
        const voteStats = getVoteStats(standard.votes)
        const newStatus = voteStats.approvePercentage >= 50 ? "approved" : "denied"
        
        try {
          await supabase
            .from("standards")
            .update({ status: newStatus })
            .eq("id", standard.id)
        } catch (err) {
          console.error(`Failed to update stuck vote ${standard.id}:`, err)
        }
      }
    }
    
    fetchStandards()
  }

  const handleVote = async (standardId: string, voteType: "approve" | "deny") => {
    if (!supabase || !user) {
      setError("You must be signed in to vote")
      return
    }

    setVotingLoading(standardId)
    setError("")

    try {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("*")
        .eq("standard_id", standardId)
        .eq("user_id", user.id)
        .single()

      if (existingVote) {
        await supabase
          .from("votes")
          .update({ vote_type: voteType })
          .eq("standard_id", standardId)
          .eq("user_id", user.id)
      } else {
        const { error } = await supabase.from("votes").insert([
          {
            standard_id: standardId,
            user_id: user.id,
            vote_type: voteType,
          },
        ])
        if (error) throw error
      }

      fetchStandards()
    } catch (err: any) {
      setError(err.message || "Failed to submit vote")
    } finally {
      setVotingLoading(null)
    }
  }

  const handleMergeToWiki = async (standard: Standard) => {
    if (!supabase || !user?.id) {
      setError("Authentication required")
      return
    }

    try {
      // Verify user exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (userError || !userData) {
        throw new Error("User verification failed")
      }

      // Delete votes first
      await supabase
        .from("votes")
        .delete()
        .eq("standard_id", standard.id)

      // Create wiki post
      const { data: wikiPost, error: wikiError } = await supabase
        .from("wiki_posts")
        .insert([{
          title: standard.title,
          content: standard.content,
          topic: "General",
          created_by: user.id
        }])
        .select()
        .single()

      if (wikiError || !wikiPost) throw wikiError || new Error("Failed to create wiki post")

      // Delete standard
      await supabase
        .from("standards")
        .delete()
        .eq("id", standard.id)

      // Set the newly created wiki post as selected for image upload
      setSelectedWikiPost(wikiPost.id)

      // Refresh data
      await Promise.all([fetchStandards(), fetchWikiPosts()])
    } catch (err: any) {
      setError(err.message || "Failed to merge to wiki")
    }
  }

  const handleRemoveVote = async (standardId: string) => {
    if (!supabase || !user) return

    try {
      // Delete votes first
      await supabase
        .from("votes")
        .delete()
        .eq("standard_id", standardId)

      // Then delete standard
      await supabase
        .from("standards")
        .delete()
        .eq("id", standardId)

      fetchStandards()
    } catch (err: any) {
      setError(err.message || "Failed to remove vote")
    }
  }

  const handleVoteOnEdit = async (proposalId: string, voteType: "approve" | "deny") => {
    if (!supabase || !user?.id) {
      setError("You must be signed in to vote")
      return
    }

    try {
      const { data: existingVote } = await supabase
        .from("edit_proposal_votes")
        .select("*")
        .eq("edit_proposal_id", proposalId)
        .eq("user_id", user.id)
        .single()

      if (existingVote) {
        await supabase
          .from("edit_proposal_votes")
          .update({ vote_type: voteType })
          .eq("edit_proposal_id", proposalId)
          .eq("user_id", user.id)
      } else {
        await supabase.from("edit_proposal_votes").insert([{
          edit_proposal_id: proposalId,
          user_id: user.id,
          vote_type: voteType,
        }])
      }

      fetchEditProposals()
    } catch (err: any) {
      setError(err.message || "Failed to submit vote")
    }
  }

  const handleApproveEdit = async (proposalId: string) => {
    if (!supabase || !user?.id) return

    try {
      // Get full proposal
      const { data: proposal, error: proposalError } = await supabase
        .from("edit_proposals")
        .select("*")
        .eq("id", proposalId)
        .single()

      if (proposalError || !proposal) throw new Error("Proposal not found")

      // Update wiki post
      const { error: updateError } = await supabase
        .from("wiki_posts")
        .update({
          title: proposal.title,
          content: proposal.content,
          updated_at: new Date().toISOString()
        })
        .eq("id", proposal.wiki_post_id)

      if (updateError) throw updateError

      // Delete all votes for this proposal
      await supabase
        .from("edit_proposal_votes")
        .delete()
        .eq("edit_proposal_id", proposalId)

      // Update proposal status
      await supabase
        .from("edit_proposals")
        .update({ status: "approved" })
        .eq("id", proposalId)

      // Refresh data
      await Promise.all([fetchWikiPosts(), fetchEditProposals()])
    } catch (err: any) {
      setError(err.message || "Failed to approve edit")
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, wikiPostId: string) => {
    if (!event.target.files || event.target.files.length === 0 || !supabase || !user) {
      return;
    }

    setImageUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `wiki_images/${fileName}`;

    try {
      // Upload the image using the regular client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wiki-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wiki-images')
        .getPublicUrl(filePath);

      // Create a record in the wiki_images table
      const { error: insertError } = await supabase
        .from('wiki_images')
        .insert({
          wiki_post_id: wikiPostId,
          image_url: publicUrl,
          created_by: user.id
        });

      if (insertError) throw insertError;

      // Refresh the images
      await fetchWikiImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || "Failed to upload image");
    } finally {
      setImageUploading(false);
      setSelectedWikiPost(null);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "voting": return "bg-blue-100 text-blue-800"
      case "approved": return "bg-green-100 text-green-800"
      case "denied": return "bg-red-100 text-red-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getVoteStats = (votes: { vote_type: string; user_id: string }[] = []) => {
    const approveCount = votes.filter((v) => v.vote_type === "approve").length
    const denyCount = votes.filter((v) => v.vote_type === "deny").length
    const total = approveCount + denyCount
    const approvePercentage = total > 0 ? (approveCount / total) * 100 : 0
    return { approveCount, denyCount, total, approvePercentage }
  }

  const getUserVote = (votes: { vote_type: string; user_id: string }[] = []) => {
    if (!user) return null
    const userVote = votes.find((v) => v.user_id === user.id)
    return userVote?.vote_type || null
  }

  const isVotingActive = (votingEndsAt: string) => {
    return new Date(votingEndsAt) > new Date()
  }

  const getTimeRemaining = (votingEndsAt: string) => {
    const now = new Date()
    const end = new Date(votingEndsAt)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Voting ended"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  const getWikiImages = (wikiPostId: string) => {
    return wikiImages.filter(img => img.wiki_post_id === wikiPostId)
  }

  const renderVotingTab = () => (
    <div className="space-y-6">
      {standards.map((standard) => {
        const voteStats = getVoteStats(standard.votes)
        const userVote = getUserVote(standard.votes)
        const votingActive = standard.status === "voting" && isVotingActive(standard.voting_ends_at)
        const isCreator = user?.id === standard.created_by

        return (
          <Card key={standard.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{standard.title}</CardTitle>
                  <CardDescription className="mt-2">{standard.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(standard.status)}>
                  {standard.status.charAt(0).toUpperCase() + standard.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{standard.content}</p>
                </div>

                {standard.status === "voting" && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {getTimeRemaining(standard.voting_ends_at)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {voteStats.total} vote{voteStats.total !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {voteStats.total > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-600">Approve: {voteStats.approveCount}</span>
                          <span className="text-red-600">Deny: {voteStats.denyCount}</span>
                        </div>
                        <Progress value={voteStats.approvePercentage} className="h-2" />
                      </div>
                    )}

                    {userVote && (
                      <div className="mb-3 text-sm text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {userVote === "approve" ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              You voted to approve
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              You voted to deny
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    {votingActive && user && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleVote(standard.id, "approve")}
                          disabled={votingLoading === standard.id}
                          className={`flex-1 ${userVote === "approve" ? "bg-green-700" : "bg-green-600 hover:bg-green-700"}`}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          {userVote === "approve" ? "Approved" : "Approve"}
                        </Button>
                        <Button
                          onClick={() => handleVote(standard.id, "deny")}
                          disabled={votingLoading === standard.id}
                          variant={userVote === "deny" ? "default" : "destructive"}
                          className="flex-1"
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          {userVote === "deny" ? "Denied" : "Deny"}
                        </Button>
                      </div>
                    )}

                    {votingActive && !user && (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-3">Sign in to vote on this standard</p>
                        <Button asChild>
                          <Link href="/auth/signin">Sign In to Vote</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {(standard.status === "approved" || standard.status === "denied") && isCreator && (
                  <div className="flex gap-3 mt-4">
                    {standard.status === "approved" && (
                      <Button
                        onClick={() => handleMergeToWiki(standard)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Merge to Wiki
                      </Button>
                    )}
                    {standard.status === "denied" && (
                      <Button
                        onClick={() => handleRemoveVote(standard.id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        Remove Vote
                      </Button>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 border-t pt-2">
                  Proposed by {standard.user?.username || "unknown"} on {new Date(standard.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderWikiTab = () => {
    if (!user) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">You must be signed in to access the wiki.</div>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      )
    }

    const topics = [...new Set(wikiPosts.map(post => post.topic))]

    return (
      <div className="space-y-8">
        {/* Wiki Posts Section */}
        <div className="space-y-6">
          {topics.map(topic => (
            <div key={topic} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">{topic}</h2>
              <div className="space-y-4">
                {wikiPosts
                  .filter(post => post.topic === topic)
                  .map(post => {
                    const postImages = getWikiImages(post.id)
                    return (
                      <Card key={post.id}>
                        <CardHeader>
                          <CardTitle>{post.title}</CardTitle>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              Last updated {new Date(post.updated_at).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/standards/edit/${post.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Suggest Edit
                                </Link>
                              </Button>
                              {post.created_by === user.id && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <ImageIcon className="w-4 h-4 mr-2" />
                                      Add Image
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add Image to {post.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleImageUpload(e, post.id)}
                                        disabled={imageUploading}
                                      />
                                      {imageUploading && <p>Uploading image...</p>}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {postImages.length > 0 && (
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {postImages.map(image => (
                                <img 
                                  key={image.id} 
                                  src={image.image_url} 
                                  alt="Wiki illustration" 
                                  className="rounded-md object-cover max-h-48"
                                />
                              ))}
                            </div>
                          )}
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Edit Proposals Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Pending Edits</h2>
          {editProposals
            .filter(proposal => proposal.status === 'pending')
            .map(proposal => {
              const voteStats = getVoteStats(proposal.votes)
              const userVote = getUserVote(proposal.votes)
              const votingActive = isVotingActive(proposal.voting_ends_at)
              const isCreator = user?.id === proposal.created_by

              return (
                <Card key={proposal.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>Edit Proposal for: {proposal.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getTimeRemaining(proposal.voting_ends_at)}
                      </Badge>
                      {voteStats.total > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">
                            {voteStats.approveCount} Approve{voteStats.approveCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-red-600">
                            {voteStats.denyCount} Deny{voteStats.denyCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{proposal.content}</p>
                    </div>

                    {votingActive && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleVoteOnEdit(proposal.id, "approve")}
                          variant={userVote === "approve" ? "default" : "outline"}
                        >
                          Approve Edit
                        </Button>
                        <Button
                          onClick={() => handleVoteOnEdit(proposal.id, "deny")}
                          variant={userVote === "deny" ? "destructive" : "outline"}
                        >
                          Reject Edit
                        </Button>
                      </div>
                    )}

                    {isCreator && (
                      <Button
                        onClick={() => handleApproveEdit(proposal.id)}
                        className="mt-2"
                      >
                        Approve Edit
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>

        {/* Image Upload Modal for newly merged standards */}
        {selectedWikiPost && (
          <Dialog open={!!selectedWikiPost} onOpenChange={(open) => !open && setSelectedWikiPost(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Images to Your Wiki Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Your standard has been merged to the wiki. Would you like to add images?</p>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, selectedWikiPost)}
                  disabled={imageUploading}
                />
                {imageUploading && <p>Uploading image...</p>}
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedWikiPost(null)}
                  disabled={imageUploading}
                >
                  Skip
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  const renderEditorTab = () => {
    if (!user) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">You must be signed in to access the editor.</div>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      )
    }

    const userWikiPosts = wikiPosts.filter(post => post.created_by === user.id)

    return (
      <div className="space-y-6">
        {userWikiPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">You haven't created any wiki posts yet.</div>
          </div>
        )}
        
        {userWikiPosts.map(post => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>Topic: {post.topic}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/standards/edit/${post.id}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Post
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderSchematicsTab = () => {
    if (!user) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">You must be signed in to access schematics.</div>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/standards/schematics/upload" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Upload Schematic
            </Link>
          </Button>
        </div>

        {schematics.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No schematics uploaded yet.</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schematics.map(schematic => (
            <Card key={schematic.id}>
              <CardHeader>
                <CardTitle>{schematic.name}</CardTitle>
                <CardDescription>
                  {schematic.file_type} • {new Date(schematic.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href={schematic.file_url} target="_blank" rel="noopener noreferrer">
                    <FileInput className="w-4 h-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (loading && activeTab === "voting") {
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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

          <Tabs defaultValue="voting" className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="voting" onClick={() => setActiveTab("voting")}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Voting
              </TabsTrigger>
              <TabsTrigger value="wiki" onClick={() => setActiveTab("wiki")}>
                <FileText className="w-4 h-4 mr-2" />
                Wiki
              </TabsTrigger>
              <TabsTrigger value="editor" onClick={() => setActiveTab("editor")}>
                <Edit className="w-4 h-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="schematics" onClick={() => setActiveTab("schematics")}>
                <FileInput className="w-4 h-4 mr-2" />
                Schematics
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "voting" && (
            <>
              <div className="flex justify-center mb-8">
                <Button asChild>
                  <Link href="/standards/create" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Propose New Standard
                  </Link>
                </Button>
              </div>
              {renderVotingTab()}
            </>
          )}

          {activeTab === "wiki" && renderWikiTab()}
          {activeTab === "editor" && renderEditorTab()}
          {activeTab === "schematics" && renderSchematicsTab()}

          {standards.length === 0 && activeTab === "voting" && !loading && supabase && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No standards proposed yet.</div>
              <Button asChild>
                <Link href="/standards/create">Propose the First Standard</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

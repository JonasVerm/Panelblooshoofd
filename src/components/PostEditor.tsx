import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PostEditorProps {
  postId: string;
  onClose: () => void;
}

export function PostEditor({ postId, onClose }: PostEditorProps) {
  const post = useQuery(api.socialMedia.getPost, { postId: postId as Id<"socialMediaPosts"> });
  const users = useQuery(api.users.listUsers);
  const campaigns = useQuery(api.campaigns.listCampaigns);
  const comments = useQuery(api.socialMedia.getPostComments, { postId: postId as Id<"socialMediaPosts"> });
  
  const updatePost = useMutation(api.socialMedia.updatePost);
  const addComment = useMutation(api.socialMedia.addComment);
  const updatePostStatus = useMutation(api.socialMedia.updatePostStatus);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    platform: "",
    campaignId: "",
    assignedTo: "",
    scheduledDate: "",
    priority: "medium",
    tags: "",
  });

  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<"comment" | "feedback" | "approval">("comment");

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        content: post.content || "",
        platform: post.platform || "",
        campaignId: post.campaignId || "",
        assignedTo: post.assignedTo || "",
        scheduledDate: post.scheduledDate ? new Date(post.scheduledDate).toISOString().slice(0, 16) : "",
        priority: post.priority || "medium",
        tags: post.tags?.join(", ") || "",
      });
    }
  }, [post]);

  const handleSave = async () => {
    if (!post) return;

    try {
      await updatePost({
        postId: post._id,
        title: formData.title,
        content: formData.content,
        platform: formData.platform || undefined,
        campaignId: formData.campaignId ? formData.campaignId as Id<"campaigns"> : undefined,
        assignedTo: formData.assignedTo ? formData.assignedTo as Id<"users"> : undefined,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).getTime() : undefined,
        priority: formData.priority as "low" | "medium" | "high",
        tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
      });
      
      toast.success("Post bijgewerkt");
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken post");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!post) return;

    try {
      await updatePostStatus({
        postId: post._id,
        status: newStatus as any,
      });
      toast.success("Status bijgewerkt");
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken status");
    }
  };

  const handleAddComment = async () => {
    if (!post || !newComment.trim()) return;

    try {
      await addComment({
        postId: post._id,
        content: newComment.trim(),
        type: commentType,
      });
      
      setNewComment("");
      toast.success("Reactie toegevoegd");
    } catch (error: any) {
      toast.error(error.message || "Fout bij toevoegen reactie");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "idea": return "bg-gray-100 text-gray-800";
      case "concept": return "bg-blue-100 text-blue-800";
      case "review": return "bg-yellow-100 text-yellow-800";
      case "ready": return "bg-green-100 text-green-800";
      case "posted": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case "feedback": return "bg-yellow-100 text-yellow-800";
      case "approval": return "bg-green-100 text-green-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  if (!post) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Post laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Post Editor</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
              {post.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={post.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="idea">Idee</option>
              <option value="concept">Concept</option>
              <option value="review">Review</option>
              <option value="ready">Klaar</option>
              <option value="posted">Gepost</option>
            </select>
            
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Opslaan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Post Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Schrijf je post content hier..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Selecteer platform</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Twitter">Twitter</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioriteit
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">Laag</option>
                      <option value="medium">Gemiddeld</option>
                      <option value="high">Hoog</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campagne
                    </label>
                    <select
                      value={formData.campaignId}
                      onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Geen campagne</option>
                      {campaigns?.map(campaign => (
                        <option key={campaign._id} value={campaign._id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Toewijzen aan
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Selecteer gebruiker</option>
                      {users?.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geplande datum
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (gescheiden door komma's)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="marketing, promo, nieuws"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Post Info</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Gemaakt door:</span>
                  <div className="font-medium">{post.creator?.name || post.creator?.email}</div>
                </div>
                
                {post.assignedUser && (
                  <div>
                    <span className="text-gray-500">Toegewezen aan:</span>
                    <div className="font-medium">{post.assignedUser.name || post.assignedUser.email}</div>
                  </div>
                )}
                
                {post.campaign && (
                  <div>
                    <span className="text-gray-500">Campagne:</span>
                    <div className="font-medium">{post.campaign.name}</div>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-500">Aangemaakt:</span>
                  <div className="font-medium">{new Date(post.createdAt).toLocaleDateString('nl-NL')}</div>
                </div>
                
                <div>
                  <span className="text-gray-500">Laatst bijgewerkt:</span>
                  <div className="font-medium">{new Date(post.updatedAt).toLocaleDateString('nl-NL')}</div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reacties ({comments?.length || 0})
              </h3>
              
              {/* Add Comment */}
              <div className="mb-4 space-y-3">
                <div>
                  <select
                    value={commentType}
                    onChange={(e) => setCommentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="comment">Reactie</option>
                    <option value="feedback">Feedback</option>
                    <option value="approval">Goedkeuring</option>
                  </select>
                </div>
                
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Voeg een reactie toe..."
                />
                
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Reactie Toevoegen
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments?.map(comment => (
                  <div key={comment._id} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author?.name || comment.author?.email}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${getCommentTypeColor(comment.type || "comment")}`}>
                          {comment.type || "comment"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
                
                {(!comments || comments.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nog geen reacties
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

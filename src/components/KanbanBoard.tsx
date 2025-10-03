import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface KanbanBoardProps {
  onEditPost: (postId: string) => void;
}

export function KanbanBoard({ onEditPost }: KanbanBoardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const ideaPosts = useQuery(api.socialMedia.getPostsByStatus, { status: "idea" });
  const conceptPosts = useQuery(api.socialMedia.getPostsByStatus, { status: "concept" });
  const reviewPosts = useQuery(api.socialMedia.getPostsByStatus, { status: "review" });
  const readyPosts = useQuery(api.socialMedia.getPostsByStatus, { status: "ready" });
  const postedPosts = useQuery(api.socialMedia.getPostsByStatus, { status: "posted" });
  
  const createPost = useMutation(api.socialMedia.createPost);
  const updatePostStatus = useMutation(api.socialMedia.updatePostStatus);
  const deletePost = useMutation(api.socialMedia.deletePost);

  const columns = [
    { 
      id: "idea", 
      title: "Ideas", 
      posts: ideaPosts || [], 
      color: "bg-gray-50 border-gray-200",
      headerColor: "text-gray-700"
    },
    { 
      id: "concept", 
      title: "Concept", 
      posts: conceptPosts || [], 
      color: "bg-blue-50 border-blue-200",
      headerColor: "text-blue-700"
    },
    { 
      id: "review", 
      title: "Review", 
      posts: reviewPosts || [], 
      color: "bg-yellow-50 border-yellow-200",
      headerColor: "text-yellow-700"
    },
    { 
      id: "ready", 
      title: "Ready", 
      posts: readyPosts || [], 
      color: "bg-green-50 border-green-200",
      headerColor: "text-green-700"
    },
    { 
      id: "posted", 
      title: "Posted", 
      posts: postedPosts || [], 
      color: "bg-purple-50 border-purple-200",
      headerColor: "text-purple-700"
    },
  ];

  const handleCreatePost = async (formData: any) => {
    try {
      await createPost({
        title: formData.title,
        content: formData.content,
        status: "idea",
        platform: formData.platform,
        priority: formData.priority,
      });
      toast.success("Post created successfully");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    }
  };

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      await updatePostStatus({
        postId: postId as Id<"socialMediaPosts">,
        status: newStatus as any,
      });
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost({ postId: postId as Id<"socialMediaPosts"> });
        toast.success("Post deleted");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete post");
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-300";
    }
  };

  return (
    <div className="h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Content Pipeline</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Create Post
        </button>
      </div>

      <div className="flex space-x-6 h-full overflow-x-auto">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className={`${column.color} border rounded-lg h-full flex flex-col`}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${column.headerColor}`}>
                    {column.title}
                  </h3>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                    {column.posts.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {column.posts.map((post) => (
                  <div
                    key={post._id}
                    className={`bg-white rounded-lg border-l-4 ${getPriorityColor(post.priority || "medium")} p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => onEditPost(post._id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post._id);
                          }}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Delete post"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {post.content && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {post.content}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {post.platform && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {post.platform}
                          </span>
                        )}
                        {post.campaign && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {post.campaign.name}
                          </span>
                        )}
                      </div>
                      
                      {post.assignedUser && (
                        <div className="flex items-center space-x-1">
                          <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {(post.assignedUser.name || post.assignedUser.email || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {post.scheduledDate && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(post.scheduledDate).toLocaleDateString()}
                      </div>
                    )}
                    
                    {/* Status Change Buttons */}
                    <div className="mt-3 flex space-x-1">
                      {column.id !== "idea" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const prevStatus = columns[columns.findIndex(c => c.id === column.id) - 1]?.id;
                            if (prevStatus) handleStatusChange(post._id, prevStatus);
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          title="Move back"
                        >
                          ←
                        </button>
                      )}
                      {column.id !== "posted" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus = columns[columns.findIndex(c => c.id === column.id) + 1]?.id;
                            if (nextStatus) handleStatusChange(post._id, nextStatus);
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          title="Move forward"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {column.posts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <p className="text-sm">No posts in {column.title.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Post Modal */}
      {showCreateForm && (
        <CreatePostModal
          onSubmit={handleCreatePost}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

interface CreatePostModalProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

function CreatePostModal({ onSubmit, onClose }: CreatePostModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    platform: "",
    priority: "medium",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your post content..."
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select platform</option>
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
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function IdeaBox() {
  const [newIdea, setNewIdea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const ideas = useQuery(api.socialMedia.getPostsByStatus, { status: "idea" });
  const createPost = useMutation(api.socialMedia.createPost);
  const updatePostStatus = useMutation(api.socialMedia.updatePostStatus);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim()) return;

    try {
      await createPost({
        title: newIdea.trim(),
        status: "idea",
        priority: "medium",
      });
      setNewIdea("");
      toast.success("Idea added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add idea");
    }
  };

  const handlePromoteIdea = async (ideaId: string) => {
    try {
      await updatePostStatus({
        postId: ideaId as any,
        status: "concept",
      });
      toast.success("Idea promoted to concept");
    } catch (error: any) {
      toast.error(error.message || "Failed to promote idea");
    }
  };

  const categories = [
    "All",
    "Marketing",
    "Product",
    "Educational",
    "Entertainment",
    "News",
    "Behind the Scenes",
    "User Generated",
    "Promotional"
  ];

  const filteredIdeas = ideas?.filter(idea => {
    if (!selectedCategory || selectedCategory === "All") return true;
    return idea.tags?.includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="h-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Idea Box</h2>
          <div className="text-sm text-gray-500">
            {ideas?.length || 0} ideas collected
          </div>
        </div>

        {/* Add New Idea */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Idea</h3>
          <form onSubmit={handleAddIdea} className="space-y-4">
            <div>
              <textarea
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                placeholder="What's your content idea? Be as creative as you want..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newIdea.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Idea
              </button>
            </div>
          </form>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === "All" ? "" : category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  (selectedCategory === category) || (selectedCategory === "" && category === "All")
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas?.map((idea) => (
            <div
              key={idea._id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900 line-clamp-2 flex-1">
                  {idea.title}
                </h4>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handlePromoteIdea(idea._id)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Promote to concept"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {idea.content && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {idea.content}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  {idea.priority && (
                    <span className={`px-2 py-1 rounded ${
                      idea.priority === "high" ? "bg-red-100 text-red-800" :
                      idea.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {idea.priority}
                    </span>
                  )}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex space-x-1">
                      {idea.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {idea.tags.length > 2 && (
                        <span className="text-gray-400">+{idea.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {idea.creator && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {(idea.creator.name || idea.creator.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {idea.creator.name || idea.creator.email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {(!filteredIdeas || filteredIdeas.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedCategory ? "No ideas in this category" : "No ideas yet"}
            </h3>
            <p className="text-gray-600">
              {selectedCategory 
                ? "Try selecting a different category or add a new idea"
                : "Start brainstorming and add your first content idea!"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

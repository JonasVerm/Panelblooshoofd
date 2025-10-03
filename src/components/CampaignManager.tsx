import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function CampaignManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  const campaigns = useQuery(api.campaigns.listCampaigns);
  const selectedCampaignData = useQuery(
    api.campaigns.getCampaignWithPosts,
    selectedCampaign ? { campaignId: selectedCampaign as Id<"campaigns"> } : "skip"
  );
  
  const createCampaign = useMutation(api.campaigns.createCampaign);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);

  const handleCreateCampaign = async (formData: any) => {
    try {
      await createCampaign(formData);
      toast.success("Campagne aangemaakt");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken campagne");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm("Weet je zeker dat je deze campagne wilt verwijderen?")) {
      try {
        await deleteCampaign({ campaignId: campaignId as Id<"campaigns"> });
        toast.success("Campagne verwijderd");
        if (selectedCampaign === campaignId) {
          setSelectedCampaign(null);
        }
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen campagne");
      }
    }
  };

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Campagne Manager</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          + Nieuwe Campagne
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Campaigns List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 h-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                Alle Campagnes ({campaigns?.length || 0})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {campaigns?.map((campaign) => (
                <div
                  key={campaign._id}
                  onClick={() => setSelectedCampaign(campaign._id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedCampaign === campaign._id ? "bg-purple-50 border-r-2 border-purple-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {campaign.postCount} posts
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCampaign(campaign._id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Verwijder campagne"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {campaign.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      {campaign.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: campaign.color }}
                        />
                      )}
                      <span>
                        {new Date(campaign.createdAt).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                    
                    {campaign.tags && campaign.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {campaign.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {campaign.tags.length > 2 && (
                          <span className="text-gray-400">+{campaign.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {(!campaigns || campaigns.length === 0) && (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen campagnes</h3>
                  <p className="text-gray-600">
                    Maak je eerste campagne aan om je content te organiseren!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="lg:col-span-2">
          {selectedCampaignData ? (
            <div className="bg-white rounded-lg border border-gray-200 h-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedCampaignData.color && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedCampaignData.color }}
                      />
                    )}
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedCampaignData.name}
                    </h3>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {selectedCampaignData.posts.length} posts
                  </div>
                </div>
                
                {selectedCampaignData.description && (
                  <p className="text-gray-600 mt-2">{selectedCampaignData.description}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                  {selectedCampaignData.startDate && (
                    <span>
                      Start: {new Date(selectedCampaignData.startDate).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                  {selectedCampaignData.endDate && (
                    <span>
                      Einde: {new Date(selectedCampaignData.endDate).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                  <span>
                    Door: {selectedCampaignData.creator?.name || selectedCampaignData.creator?.email}
                  </span>
                </div>
                
                {selectedCampaignData.tags && selectedCampaignData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedCampaignData.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Posts in Campaign */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Posts in deze campagne</h4>
                
                {selectedCampaignData.posts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCampaignData.posts.map((post) => (
                      <div key={post._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{post.title}</h5>
                            {post.content && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {post.content}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded ${
                                post.status === "idea" ? "bg-gray-100 text-gray-800" :
                                post.status === "concept" ? "bg-blue-100 text-blue-800" :
                                post.status === "review" ? "bg-yellow-100 text-yellow-800" :
                                post.status === "ready" ? "bg-green-100 text-green-800" :
                                "bg-purple-100 text-purple-800"
                              }`}>
                                {post.status}
                              </span>
                              
                              {post.platform && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {post.platform}
                                </span>
                              )}
                              
                              {post.assignedUser && (
                                <span>
                                  Toegewezen aan: {post.assignedUser.name || post.assignedUser.email}
                                </span>
                              )}
                              
                              {post.scheduledDate && (
                                <span>
                                  📅 {new Date(post.scheduledDate).toLocaleDateString('nl-NL')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <h5 className="text-lg font-medium text-gray-900 mb-2">Nog geen posts</h5>
                    <p className="text-gray-600">
                      Deze campagne heeft nog geen posts. Maak een nieuwe post aan en wijs deze toe aan deze campagne.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een campagne</h3>
                <p className="text-gray-600">
                  Kies een campagne uit de lijst om de details te bekijken
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <CreateCampaignModal
          onSubmit={handleCreateCampaign}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

interface CreateCampaignModalProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

function CreateCampaignModal({ onSubmit, onClose }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    color: "#3B82F6",
    tags: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
      tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Nieuwe Campagne</h2>
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
              Naam *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Beschrijf je campagne..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Startdatum
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Einddatum
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kleur
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              placeholder="marketing, promo, zomer"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Campagne Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

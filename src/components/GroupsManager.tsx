import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface GroupFormData {
  naam: string;
  beschrijving: string;
  kleur: string;
}

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

export function GroupsManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Id<"memberGroups"> | null>(null);

  const groups = useQuery(api.memberGroups.getGroups, { isActive: true });
  const createGroup = useMutation(api.memberGroups.createGroup);
  const updateGroup = useMutation(api.memberGroups.updateGroup);
  const deleteGroup = useMutation(api.memberGroups.deleteGroup);

  const [formData, setFormData] = useState<GroupFormData>({
    naam: "",
    beschrijving: "",
    kleur: PRESET_COLORS[0],
  });

  const resetForm = () => {
    setFormData({
      naam: "",
      beschrijving: "",
      kleur: PRESET_COLORS[0],
    });
    setEditingGroup(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGroup) {
        await updateGroup({
          id: editingGroup,
          ...formData,
        });
      } else {
        await createGroup(formData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  const handleEdit = (group: any) => {
    setFormData({
      naam: group.naam,
      beschrijving: group.beschrijving || "",
      kleur: group.kleur,
    });
    setEditingGroup(group._id);
    setShowForm(true);
  };

  const handleDelete = async (groupId: Id<"memberGroups">) => {
    if (confirm("Weet je zeker dat je deze groep wilt verwijderen? Alle leden worden uit de groep verwijderd.")) {
      try {
        await deleteGroup({ id: groupId });
      } catch (error) {
        console.error("Error deleting group:", error);
      }
    }
  };

  if (!groups) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Groepen</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nieuwe Groep
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group._id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div 
              className="h-4"
              style={{ backgroundColor: group.kleur }}
            ></div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {group.naam}
                  </h3>
                  {group.beschrijving && (
                    <p className="text-sm text-gray-600 mt-1">
                      {group.beschrijving}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(group)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(group._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {group.memberIds?.length || 0} leden
                </span>
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: group.kleur }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Group Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingGroup ? "Groep Bewerken" : "Nieuwe Groep"}
              </h3>
              <button
                onClick={resetForm}
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
                  required
                  value={formData.naam}
                  onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving
                </label>
                <textarea
                  value={formData.beschrijving}
                  onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kleur
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, kleur: color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.kleur === color ? "border-gray-800" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.kleur}
                  onChange={(e) => setFormData({ ...formData, kleur: e.target.value })}
                  className="mt-2 w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingGroup ? "Bijwerken" : "Toevoegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

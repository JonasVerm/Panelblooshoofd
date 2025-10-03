import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ActivityFormData {
  naam: string;
  beschrijving: string;
  datum: string;
  startTijd: string;
  eindTijd: string;
  locatie: string;
  kleur: string;
  type: "eenmalig" | "herhalend";
  herhalingType?: "wekelijks" | "tweewekelijks" | "maandelijks";
  herhalingEinde?: string;
  targetGroupIds: Id<"memberGroups">[];
  targetMemberIds: Id<"members">[];
}

export function ActivitiesManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Id<"activities"> | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [pendingRecurringEdit, setPendingRecurringEdit] = useState<any>(null);

  // Get activities for the selected month
  const startOfMonth = new Date(selectedDate);
  startOfMonth.setDate(1);
  const endOfMonth = new Date(selectedDate);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);

  const activities = useQuery(api.memberActivities.getActivities, {
    startDate: startOfMonth.getTime(),
    endDate: endOfMonth.getTime(),
    isActive: true,
  });
  const groups = useQuery(api.memberGroups.getGroups, { isActive: true });
  const members = useQuery(api.members.getMembers, { isActive: true });

  const createActivity = useMutation(api.memberActivities.createActivity);
  const updateActivity = useMutation(api.memberActivities.updateActivity);
  const updateRecurringActivity = useMutation(api.memberActivities.updateRecurringActivity);
  const deleteActivity = useMutation(api.memberActivities.deleteActivity);
  const fixRecurringActivities = useMutation(api.memberActivities.fixRecurringActivities);

  const [formData, setFormData] = useState<ActivityFormData>({
    naam: "",
    beschrijving: "",
    datum: new Date().toISOString().split('T')[0],
    startTijd: "10:00",
    eindTijd: "11:00",
    locatie: "",
    kleur: "#3B82F6", // Default blue color
    type: "eenmalig",
    targetGroupIds: [],
    targetMemberIds: [],
  });

  const resetForm = () => {
    setFormData({
      naam: "",
      beschrijving: "",
      datum: new Date().toISOString().split('T')[0],
      startTijd: "10:00",
      eindTijd: "11:00",
      locatie: "",
      kleur: "#3B82F6", // Default blue color
      type: "eenmalig",
      targetGroupIds: [],
      targetMemberIds: [],
    });
    setEditingActivity(null);
    setShowForm(false);
    setShowRecurringDialog(false);
    setPendingRecurringEdit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingActivity) {
        const activity = activities?.find(a => a._id === editingActivity);
        
        // Check if this is a recurring activity or part of a recurring series
        if (activity && (activity.type === "herhalend" || activity.parentActivityId)) {
          // Store the form data and show the recurring dialog
          setPendingRecurringEdit({
            id: editingActivity,
            formData: { ...formData },
            activity
          });
          setShowRecurringDialog(true);
          return;
        }
        
        // For non-recurring activities, proceed normally
        await updateActivity({
          id: editingActivity,
          naam: formData.naam,
          beschrijving: formData.beschrijving,
          datum: new Date(formData.datum).getTime(),
          startTijd: formData.startTijd,
          eindTijd: formData.eindTijd,
          locatie: formData.locatie,
          kleur: formData.kleur,
          targetGroupIds: formData.targetGroupIds,
          targetMemberIds: formData.targetMemberIds,
        });
      } else {
        const activityData = {
          ...formData,
          datum: new Date(formData.datum).getTime(),
          herhalingEinde: formData.herhalingEinde ? new Date(formData.herhalingEinde).getTime() : undefined,
        };
        await createActivity(activityData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving activity:", error);
    }
  };

  const handleRecurringEditConfirm = async (updateAll: boolean) => {
    if (!pendingRecurringEdit) return;

    try {
      if (updateAll) {
        // Update all future instances
        await updateRecurringActivity({
          id: pendingRecurringEdit.id,
          naam: pendingRecurringEdit.formData.naam,
          beschrijving: pendingRecurringEdit.formData.beschrijving,
          startTijd: pendingRecurringEdit.formData.startTijd,
          eindTijd: pendingRecurringEdit.formData.eindTijd,
          locatie: pendingRecurringEdit.formData.locatie,
          kleur: pendingRecurringEdit.formData.kleur,
          targetGroupIds: pendingRecurringEdit.formData.targetGroupIds,
          targetMemberIds: pendingRecurringEdit.formData.targetMemberIds,
          updateAllFuture: true,
        });
      } else {
        // Update only this instance
        await updateActivity({
          id: pendingRecurringEdit.id,
          naam: pendingRecurringEdit.formData.naam,
          beschrijving: pendingRecurringEdit.formData.beschrijving,
          datum: new Date(pendingRecurringEdit.formData.datum).getTime(),
          startTijd: pendingRecurringEdit.formData.startTijd,
          eindTijd: pendingRecurringEdit.formData.eindTijd,
          locatie: pendingRecurringEdit.formData.locatie,
          kleur: pendingRecurringEdit.formData.kleur,
          targetGroupIds: pendingRecurringEdit.formData.targetGroupIds,
          targetMemberIds: pendingRecurringEdit.formData.targetMemberIds,
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error updating recurring activity:", error);
    }
  };

  const handleEdit = (activity: any) => {
    setFormData({
      naam: activity.naam,
      beschrijving: activity.beschrijving || "",
      datum: new Date(activity.datum).toISOString().split('T')[0],
      startTijd: activity.startTijd,
      eindTijd: activity.eindTijd,
      locatie: activity.locatie || "",
      kleur: activity.kleur || "#3B82F6",
      type: activity.type,
      herhalingType: activity.herhalingType,
      herhalingEinde: activity.herhalingEinde ? new Date(activity.herhalingEinde).toISOString().split('T')[0] : undefined,
      targetGroupIds: activity.targetGroupIds || [],
      targetMemberIds: activity.targetMemberIds || [],
    });
    setEditingActivity(activity._id);
    setShowForm(true);
  };

  const handleDelete = async (activityId: Id<"activities">) => {
    const activity = activities?.find(a => a._id === activityId);
    
    if (activity && (activity.type === "herhalend" || activity.parentActivityId)) {
      const deleteAll = confirm(
        "Deze activiteit is onderdeel van een herhalende reeks. Wil je alle toekomstige activiteiten verwijderen of alleen deze?"
      );
      
      if (confirm("Weet je zeker dat je deze activiteit wilt verwijderen?")) {
        try {
          await deleteActivity({ 
            id: activityId, 
            deleteRecurring: deleteAll 
          });
        } catch (error) {
          console.error("Error deleting activity:", error);
        }
      }
    } else {
      if (confirm("Weet je zeker dat je deze activiteit wilt verwijderen?")) {
        try {
          await deleteActivity({ id: activityId });
        } catch (error) {
          console.error("Error deleting activity:", error);
        }
      }
    }
  };

  if (!activities || !groups || !members) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Activiteiten</h2>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              try {
                const result = await fixRecurringActivities();
                alert(result.message);
              } catch (error) {
                console.error("Error fixing recurring activities:", error);
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Herstel Herhalende
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nieuwe Activiteit
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <input
          type="month"
          value={selectedDate.substring(0, 7)}
          onChange={(e) => setSelectedDate(e.target.value + "-01")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities
          .sort((a, b) => a.datum - b.datum)
          .map((activity) => (
            <div key={activity._id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: activity.kleur || "#3B82F6" }}
                    ></div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {activity.naam}
                    </h3>
                    {(activity.type === "herhalend" || activity.parentActivityId) && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {activity.type === "herhalend" ? "Herhalend (Hoofd)" : "Herhalend"}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Datum:</strong> {new Date(activity.datum).toLocaleDateString('nl-NL')}
                    </div>
                    <div>
                      <strong>Tijd:</strong> {activity.startTijd} - {activity.eindTijd}
                    </div>
                    {activity.locatie && (
                      <div>
                        <strong>Locatie:</strong> {activity.locatie}
                      </div>
                    )}
                  </div>

                  {activity.beschrijving && (
                    <p className="text-gray-600 mt-2">{activity.beschrijving}</p>
                  )}

                  {/* Target Groups */}
                  {activity.targetGroupIds && activity.targetGroupIds.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">Groepen: </span>
                      <div className="inline-flex flex-wrap gap-1">
                        {activity.targetGroupIds.map((groupId) => {
                          const group = groups.find(g => g._id === groupId);
                          return group ? (
                            <span
                              key={groupId}
                              className="inline-block px-2 py-1 text-xs rounded-full text-white"
                              style={{ backgroundColor: group.kleur }}
                            >
                              {group.naam}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(activity)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(activity._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Recurring Edit Confirmation Dialog */}
      {showRecurringDialog && pendingRecurringEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Herhalende Activiteit Bewerken
              </h3>
              <p className="text-gray-600">
                Deze activiteit is onderdeel van een herhalende reeks. Wat wil je bijwerken?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleRecurringEditConfirm(false)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left"
              >
                <div className="font-medium">Alleen deze activiteit</div>
                <div className="text-sm text-blue-100">
                  Wijzig alleen de geselecteerde activiteit op {new Date(pendingRecurringEdit.activity.datum).toLocaleDateString('nl-NL')}
                </div>
              </button>
              
              <button
                onClick={() => handleRecurringEditConfirm(true)}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-left"
              >
                <div className="font-medium">Alle toekomstige activiteiten</div>
                <div className="text-sm text-orange-100">
                  Wijzig deze en alle toekomstige activiteiten in de reeks
                </div>
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingActivity ? "Activiteit Bewerken" : "Nieuwe Activiteit"}
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.datum}
                    onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Tijd *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTijd}
                    onChange={(e) => setFormData({ ...formData, startTijd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eind Tijd *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.eindTijd}
                    onChange={(e) => setFormData({ ...formData, eindTijd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locatie
                </label>
                <input
                  type="text"
                  value={formData.locatie}
                  onChange={(e) => setFormData({ ...formData, locatie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kleur
                </label>
                <input
                  type="color"
                  value={formData.kleur}
                  onChange={(e) => setFormData({ ...formData, kleur: e.target.value })}
                  className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "eenmalig" | "herhalend" })}
                  disabled={!!editingActivity}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="eenmalig">Eenmalig</option>
                  <option value="herhalend">Herhalend</option>
                </select>
                {editingActivity && (
                  <p className="text-xs text-gray-500 mt-1">
                    Het type kan niet worden gewijzigd bij bewerken
                  </p>
                )}
              </div>

              {formData.type === "herhalend" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Herhaling Type
                    </label>
                    <select
                      value={formData.herhalingType || ""}
                      onChange={(e) => setFormData({ ...formData, herhalingType: e.target.value as any })}
                      disabled={!!editingActivity}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecteer...</option>
                      <option value="wekelijks">Wekelijks</option>
                      <option value="tweewekelijks">Tweewekelijks</option>
                      <option value="maandelijks">Maandelijks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Einde Herhaling
                    </label>
                    <input
                      type="date"
                      value={formData.herhalingEinde || ""}
                      onChange={(e) => setFormData({ ...formData, herhalingEinde: e.target.value })}
                      disabled={!!editingActivity}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doelgroepen
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {groups.map((group) => (
                    <label key={group._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.targetGroupIds.includes(group._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              targetGroupIds: [...formData.targetGroupIds, group._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              targetGroupIds: formData.targetGroupIds.filter(id => id !== group._id),
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-1"
                        style={{ backgroundColor: group.kleur }}
                      ></span>
                      <span className="text-sm">{group.naam}</span>
                    </label>
                  ))}
                </div>
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
                  {editingActivity ? "Bijwerken" : "Toevoegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

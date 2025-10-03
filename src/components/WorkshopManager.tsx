import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { WorkshopForm } from "./WorkshopForm";

export function WorkshopManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const workshops = useQuery(api.workshops.listWorkshops, {
    category: selectedCategory || undefined,
  });
  const deleteWorkshop = useMutation(api.workshops.deleteWorkshop);

  const categories = [
    "Algemeen",
    "Technologie",
    "Kunst & Creativiteit",
    "Sport & Beweging",
    "Wetenschap",
    "Talen",
    "Muziek",
    "Andere"
  ];

  const handleDelete = async (workshopId: Id<"workshops">) => {
    if (confirm("Weet je zeker dat je deze workshop wilt verwijderen?")) {
      try {
        await deleteWorkshop({ workshopId });
        toast.success("Workshop succesvol verwijderd");
      } catch (error) {
        toast.error("Fout bij verwijderen workshop");
      }
    }
  };

  const handleEdit = (workshop: any) => {
    setEditingWorkshop(workshop);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingWorkshop(null);
  };

  if (showForm) {
    return (
      <WorkshopForm
        workshop={editingWorkshop}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workshop Beheer</h2>
          <p className="text-gray-600">Maak en beheer workshops</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nieuwe Workshop</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter op categorie:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Alle Categorieën</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workshops List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {workshops === undefined ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-2">Workshops laden...</p>
          </div>
        ) : workshops.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen workshops gevonden</h3>
            <p className="text-gray-600 mb-4">Begin met het maken van je eerste workshop.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Workshop Maken
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Titel</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tijd</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Locatie</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Categorie</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Prijs</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workshops.map((workshop) => (
                  <tr key={workshop._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{workshop.title}</div>
                        {workshop.description && (
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {workshop.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {workshop.date ? new Date(workshop.date).toLocaleDateString('nl-NL') : "N.v.t."}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {workshop.startTime && workshop.endTime 
                        ? `${workshop.startTime} - ${workshop.endTime}`
                        : "N.v.t."
                      }
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {workshop.location || "N.v.t."}
                    </td>
                    <td className="py-3 px-4">
                      {workshop.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {workshop.category}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {workshop.price ? `€${workshop.price}` : "Gratis"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(workshop)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Workshop bewerken"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(workshop._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Workshop verwijderen"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

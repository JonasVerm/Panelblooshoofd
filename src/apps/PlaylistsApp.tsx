import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function PlaylistsApp() {
  const [selectedView, setSelectedView] = useState<"overview" | "create">("overview");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Afspeellijsten</h1>
        <p className="text-gray-600">Beheer je muziek afspeellijsten</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSelectedView("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === "overview"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overzicht
          </button>
          <button
            onClick={() => setSelectedView("create")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === "create"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Nieuwe Afspeellijst
          </button>
        </div>

        {selectedView === "overview" && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Geen afspeellijsten gevonden
            </h3>
            <p className="text-gray-600 mb-4">
              Maak je eerste afspeellijst aan om te beginnen.
            </p>
            <button
              onClick={() => setSelectedView("create")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nieuwe Afspeellijst
            </button>
          </div>
        )}

        {selectedView === "create" && (
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nieuwe Afspeellijst
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Voer afspeellijst naam in..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optionele beschrijving..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aanmaken
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedView("overview")}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

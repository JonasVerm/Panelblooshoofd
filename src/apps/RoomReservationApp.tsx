import { useState } from "react";
import { BookRoomPage } from "../components/BookRoomPage";
import { RoomReservationAdmin } from "../components/RoomReservationAdmin";

type ViewType = "book" | "admin";

export function RoomReservationApp() {
  const [currentView, setCurrentView] = useState<ViewType>("book");

  const renderCurrentView = () => {
    switch (currentView) {
      case "book":
        return <BookRoomPage />;
      case "admin":
        return <RoomReservationAdmin />;
      default:
        return <BookRoomPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView("book")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "book"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Ruimte Reserveren
            </button>
            <button
              onClick={() => setCurrentView("admin")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "admin"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Beheer
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {renderCurrentView()}
    </div>
  );
}

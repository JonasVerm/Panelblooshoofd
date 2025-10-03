interface SharedDocumentViewProps {
  token: string;
}

export function SharedDocumentView({ token }: SharedDocumentViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gedeelde documenten</h1>
        <p className="text-gray-600">Deze functie is tijdelijk uitgeschakeld voor onderhoud.</p>
      </div>
    </div>
  );
}

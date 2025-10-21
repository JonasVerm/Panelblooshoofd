import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function PasswordsApp() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const passwords = useQuery(api.passwords.getPasswords);
  
  const createPassword = useMutation(api.passwords.createPassword);
  const updatePassword = useMutation(api.passwords.updatePassword);
  const deletePassword = useMutation(api.passwords.deletePassword);

  // Filter passwords based on search only
  const filteredPasswords = passwords?.filter(password => {
    const matchesSearch = !searchTerm || 
      password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.website?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleCreatePassword = async (formData: any) => {
    try {
      await createPassword(formData);
      toast.success("Wachtwoord succesvol aangemaakt");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken wachtwoord");
    }
  };

  const handleUpdatePassword = async (formData: any) => {
    try {
      await updatePassword({
        id: editingPassword._id,
        ...formData,
      });
      toast.success("Wachtwoord succesvol bijgewerkt");
      setEditingPassword(null);
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken wachtwoord");
    }
  };

  const handleDeletePassword = async (passwordId: string) => {
    if (confirm("Weet je zeker dat je dit wachtwoord wilt verwijderen?")) {
      try {
        await deletePassword({ id: passwordId as Id<"passwords"> });
        toast.success("Wachtwoord verwijderd");
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen wachtwoord");
      }
    }
  };

  const handleEdit = (password: any) => {
    setEditingPassword(password);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingPassword(null);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} gekopieerd naar klembord`);
    } catch (error) {
      toast.error("Kon niet kopiëren naar klembord");
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "weak": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case "strong": return "Sterk";
      case "medium": return "Gemiddeld";
      case "weak": return "Zwak";
      default: return "Onbekend";
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            <div className="py-4 px-1 border-b-2 border-blue-500 font-medium text-sm flex items-center space-x-2">
              <span className="text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <span className="text-blue-600">Wachtwoordbeheer</span>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto p-6">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wachtwoorden</h1>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Wachtwoord Toevoegen
              </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Zoek wachtwoorden..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Passwords List */}
            <div className="bg-white rounded-lg border border-gray-200">
              {filteredPasswords && filteredPasswords.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredPasswords.map((password) => (
                    <div key={password._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {password.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStrengthColor(password.strength)}`}>
                              {getStrengthLabel(password.strength)}
                            </span>
                          </div>

                          {password.website && (
                            <p className="text-sm text-blue-600 hover:text-blue-800 mb-2">
                              <a href={password.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span>{password.website}</span>
                              </a>
                            </p>
                          )}

                          {password.username && (
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm text-gray-600">Gebruikersnaam:</span>
                              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                {password.username}
                              </span>
                              <button
                                onClick={() => copyToClipboard(password.username, "Gebruikersnaam")}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Kopieer gebruikersnaam"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-sm text-gray-600">Wachtwoord:</span>
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              ••••••••
                            </span>
                            <button
                              onClick={() => copyToClipboard(password.password, "Wachtwoord")}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Kopieer wachtwoord"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>

                          {password.notes && (
                            <p className="text-sm text-gray-600 mb-3">
                              {password.notes}
                            </p>
                          )}

                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span>Aangemaakt: {new Date(password.createdAt).toLocaleDateString('nl-NL')}</span>
                            <span>Bijgewerkt: {new Date(password.updatedAt).toLocaleDateString('nl-NL')}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(password)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Wachtwoord bewerken"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePassword(password._id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Wachtwoord verwijderen"
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
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen wachtwoorden gevonden</h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? "Geen wachtwoorden gevonden die voldoen aan je zoekcriteria"
                      : "Voeg je eerste wachtwoord toe om te beginnen"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Password Modal */}
      {showCreateForm && (
        <PasswordModal
          password={editingPassword}
          onSubmit={editingPassword ? handleUpdatePassword : handleCreatePassword}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

interface PasswordModalProps {
  password?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

function PasswordModal({ password, onSubmit, onClose }: PasswordModalProps) {
  const [formData, setFormData] = useState({
    title: password?.title || "",
    username: password?.username || "",
    password: password?.password || "",
    website: password?.website || "",
    notes: password?.notes || "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {password ? "Wachtwoord Bewerken" : "Nieuw Wachtwoord"}
          </h2>
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
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gebruikersnaam
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wachtwoord *
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Genereer
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notities
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Extra notities..."
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {password ? "Bijwerken" : "Toevoegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

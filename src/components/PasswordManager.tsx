import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

export function PasswordManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const currentUser = useQuery(api.users.getCurrentUserQuery);
  const permissions = useQuery(api.permissions.getUserPermissions, {});
  const allUsers = useQuery(api.users.listUsers);
  const passwords = useQuery(api.passwords.listPasswords, {});
  const searchResults = useQuery(
    api.passwords.listPasswords,
    searchTerm.trim() ? { searchTerm: searchTerm.trim() } : "skip"
  );

  const displayPasswords = searchTerm.trim() ? searchResults : passwords;

  const createPassword = useMutation(api.passwords.createPassword);
  const updatePassword = useMutation(api.passwords.updatePassword);
  const deletePassword = useMutation(api.passwords.deletePassword);

  const togglePasswordVisibility = (passwordId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(passwordId)) {
      newVisible.delete(passwordId);
    } else {
      newVisible.add(passwordId);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${type} gekopieerd naar klembord!`);
  };

  // Helper function to check if user can view a specific password
  const canViewPassword = (password: any) => {
    if (!currentUser || !permissions) return false;
    
    // Admin or user with view all permissions can see everything
    if (permissions.canViewAllPasswords) return true;
    
    // Owner can always see their own passwords
    if (password.createdBy === currentUser._id) return true;
    
    // Check if user is in allowed users list
    if (password.allowedUserIds?.includes(currentUser._id)) return true;
    
    // Check if user's role is in allowed roles
    if (password.allowedRoles?.includes("admin") && permissions.canAccessManagement) return true;
    
    return false;
  };

  // Helper function to check if user can edit a specific password
  const canEditPassword = (password: any) => {
    if (!currentUser || !permissions) return false;
    
    // Admin or user with edit all permissions can edit everything
    if (permissions.canEditAllPasswords) return true;
    
    // Owner can always edit their own passwords
    if (password.createdBy === currentUser._id) return true;
    
    return false;
  };

  // Helper function to check if user can delete a specific password
  const canDeletePassword = (password: any) => {
    if (!currentUser || !permissions) return false;
    
    // Admin or user with delete all permissions can delete everything
    if (permissions.canDeleteAllPasswords) return true;
    
    // Owner can always delete their own passwords
    if (password.createdBy === currentUser._id) return true;
    
    return false;
  };

  if (!currentUser || !permissions || !allUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-cyan-600"></div>
      </div>
    );
  }

  // Filter passwords based on permissions
  const filteredPasswords = displayPasswords?.filter(password => canViewPassword(password)) || [];

  const categoryFilteredPasswords = filteredPasswords;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔐 Wachtwoorden</h2>
          <p className="text-gray-600">Beheer bedrijfsaccounts en wachtwoorden veilig</p>
        </div>
        {(permissions?.canCreatePasswords ?? true) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
          >
            Nieuw Wachtwoord
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{filteredPasswords.length}</div>
          <div className="text-sm text-gray-600">Totaal wachtwoorden</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-cyan-600">
            {filteredPasswords.filter(p => p.createdBy === currentUser._id).length}
          </div>
          <div className="text-sm text-gray-600">Mijn wachtwoorden</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {filteredPasswords.filter(p => p.sharedWith?.includes(currentUser._id)).length}
          </div>
          <div className="text-sm text-gray-600">Gedeeld met mij</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {filteredPasswords.filter(p => p.url).length}
          </div>
          <div className="text-sm text-gray-600">Met URL</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Zoek wachtwoorden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <div className="flex items-center text-sm text-gray-600">
            <span>Toegankelijke wachtwoorden: {categoryFilteredPasswords.length}</span>
          </div>
        </div>
      </div>

      {/* Password List */}
      <div className="bg-white rounded-lg shadow">
        {categoryFilteredPasswords && categoryFilteredPasswords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gebruikersnaam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wachtwoord
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryFilteredPasswords.map((password) => (
                  <tr key={password._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                          🔐
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {password.title}
                          </div>

                          {password.notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {password.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 font-mono">{password.username}</span>
                        <button
                          onClick={() => copyToClipboard(password.username || "", "Gebruikersnaam")}
                          className="text-gray-400 hover:text-gray-600"
                          title="Kopieer gebruikersnaam"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 font-mono">
                          {visiblePasswords.has(password._id) 
                            ? password.password 
                            : "••••••••"
                          }
                        </span>
                        <button 
                          onClick={() => togglePasswordVisibility(password._id)} 
                          className="text-gray-400 hover:text-gray-600" 
                          title={visiblePasswords.has(password._id) ? "Verberg wachtwoord" : "Toon wachtwoord"}
                        >
                          {visiblePasswords.has(password._id) ? "🙈" : "👁️"}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(password.password, "Wachtwoord")} 
                          className="text-gray-400 hover:text-gray-600" 
                          title="Kopieer wachtwoord"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {password.url ? (
                        <div className="flex items-center space-x-2">
                          <a
                            href={password.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-cyan-600 hover:text-cyan-800 truncate max-w-xs"
                          >
                            {password.url}
                          </a>
                          <button
                            onClick={() => copyToClipboard(password.url!, "URL")}
                            className="text-gray-400 hover:text-gray-600"
                            title="Kopieer URL"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {canEditPassword(password) && (
                          <button
                            onClick={() => setEditingPassword(password)}
                            className="text-cyan-600 hover:text-cyan-900"
                          >
                            Bewerken
                          </button>
                        )}
                        {canDeletePassword(password) && (
                          <button
                            onClick={async () => {
                              if (confirm("Weet je zeker dat je dit wachtwoord wilt verwijderen?")) {
                                try {
                                  await deletePassword({ passwordId: password._id });
                                  toast.success("Wachtwoord verwijderd");
                                } catch (error: any) {
                                  toast.error(error.message || "Fout bij verwijderen wachtwoord");
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Verwijderen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen wachtwoorden</h3>
            <p className="text-gray-500">
              {searchTerm ? "Geen wachtwoorden gevonden voor je zoekopdracht." : "Voeg je eerste wachtwoord toe of je hebt geen toegang tot bestaande wachtwoorden."}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingPassword) && (
        <PasswordForm
          password={editingPassword}
          users={allUsers}
          onClose={() => {
            setShowCreateForm(false);
            setEditingPassword(null);
          }}
          onSubmit={async (data) => {
            try {
              if (editingPassword) {
                await updatePassword({
                  passwordId: editingPassword._id,
                  ...data,
                });
                toast.success("Wachtwoord bijgewerkt");
              } else {
                await createPassword(data);
                toast.success("Wachtwoord aangemaakt");
              }
              setShowCreateForm(false);
              setEditingPassword(null);
            } catch (error: any) {
              toast.error(error.message || "Fout bij opslaan wachtwoord");
            }
          }}
        />
      )}
    </div>
  );
}

interface PasswordFormProps {
  password?: any;
  users: any[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

function PasswordForm({ password, users, onClose, onSubmit }: PasswordFormProps) {
  const [formData, setFormData] = useState({
    title: password?.title || "",
    username: password?.username || "",
    password: password?.password || "",
    url: password?.url || "",
    description: password?.description || "",

    allowedUserIds: password?.allowedUserIds || [],
    allowedRoles: password?.allowedRoles || ["user"],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {password ? "Wachtwoord Bewerken" : "Nieuw Wachtwoord"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Naam *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="bijv. Google Workspace"
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gebruikersnaam *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="gebruikersnaam of email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wachtwoord *
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="wachtwoord"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="px-3 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                title="Genereer veilig wachtwoord"
              >
                🎲
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows={3}
              placeholder="Extra informatie over dit account"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Toegestane Gebruikers
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {users.map((user) => (
                <label key={user._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowedUserIds.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          allowedUserIds: [...formData.allowedUserIds, user._id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          allowedUserIds: formData.allowedUserIds.filter((id: string) => id !== user._id),
                        });
                      }
                    }}
                    className="h-4 w-4 text-cyan-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {user.username} ({user.role})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Toegestane Rollen
            </label>
            <div className="space-y-2">
              {["admin", "user"].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowedRoles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          allowedRoles: [...formData.allowedRoles, role],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          allowedRoles: formData.allowedRoles.filter((r: string) => r !== role),
                        });
                      }
                    }}
                    className="h-4 w-4 text-cyan-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Opslaan..." : (password ? "Bijwerken" : "Aanmaken")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

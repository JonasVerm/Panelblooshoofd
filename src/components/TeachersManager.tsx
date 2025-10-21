import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function TeachersManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    specialties: [] as string[],
    notes: "",
  });

  const teachers = useQuery(api.teachers.listTeachers, {});
  const createTeacher = useMutation(api.teachers.createTeacher);
  const updateTeacher = useMutation(api.teachers.updateTeacher);
  const deleteTeacher = useMutation(api.teachers.deleteTeacher);
  const ensureCalendarTokens = useMutation(api.teachers.ensureCalendarTokens);
  const regenerateCalendarToken = useMutation(api.teachers.regenerateCalendarToken);

  // Ensure all teachers have calendar tokens when component loads
  useEffect(() => {
    if (teachers && teachers.length > 0) {
      ensureCalendarTokens().catch(console.error);
    }
  }, [teachers, ensureCalendarTokens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTeacher) {
        await updateTeacher({
          id: editingTeacher._id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          isActive: true,
        });
        toast.success("Docent succesvol bijgewerkt");
      } else {
        await createTeacher({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
        });
        toast.success("Docent succesvol aangemaakt");
      }
      
      resetForm();
    } catch (error) {
      toast.error(editingTeacher ? "Fout bij bijwerken docent" : "Fout bij aanmaken docent");
    }
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      bio: teacher.bio || "",
      specialties: teacher.specialties || [],
      notes: teacher.notes || "",
    });
    setShowForm(true);
  };

  const handleRegenerateToken = async (teacherId: Id<"teachers">) => {
    if (confirm("Weet je zeker dat je een nieuwe kalender token wilt genereren? De oude link werkt dan niet meer.")) {
      try {
        await regenerateCalendarToken({ id: teacherId });
        toast.success("Nieuwe kalender token gegenereerd");
      } catch (error) {
        toast.error("Fout bij genereren nieuwe token");
      }
    }
  };

  const handleDelete = async (teacherId: Id<"teachers">) => {
    if (confirm("Weet je zeker dat je deze docent wilt verwijderen?")) {
      try {
        await deleteTeacher({ id: teacherId });
        toast.success("Docent succesvol verwijderd");
      } catch (error) {
        toast.error("Fout bij verwijderen docent");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      bio: "",
      specialties: [],
      notes: "",
    });
    setEditingTeacher(null);
    setShowForm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  if (showForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {editingTeacher ? "Docent Bewerken" : "Nieuwe Docent Toevoegen"}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naam *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefoon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>



              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biografie
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notities
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingTeacher ? "Docent Bijwerken" : "Docent Aanmaken"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Docenten Beheer</h2>
          <p className="text-gray-600">Beheer workshop docenten en instructeurs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Docent Toevoegen</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {teachers === undefined ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-2">Docenten laden...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen docenten gevonden</h3>
            <p className="text-gray-600 mb-4">Begin met het toevoegen van je eerste docent.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Docent Toevoegen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Naam</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">E-mail</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Telefoon</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Kalender</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{teacher.name}</div>
                        {teacher.bio && (
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {teacher.bio}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {teacher.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {teacher.phone || "N.v.t."}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {teacher.calendarToken ? (
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/api/calendar?token=${teacher.calendarToken}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Kalender link gekopieerd!");
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Kopieer kalender link"
                        >
                          📅 ICS Link
                        </button>
                      ) : (
                        <span className="text-gray-400">Geen token</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Docent bewerken"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRegenerateToken(teacher._id)}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title="Nieuwe kalender token genereren"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Docent verwijderen"
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

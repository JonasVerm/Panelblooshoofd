import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import * as XLSX from 'xlsx';

interface MemberFormData {
  naam: string;
  voornaam: string;
  gsmNummer: string;
  emailAdres: string;
  naamOuders: string;
  emailOuders: string;
  gsmOuders: string;
  adres: string;
  rijksregisternummer: string;
  opmerkingen: string;
  groupIds: Id<"memberGroups">[];
}

export function MembersManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Id<"members"> | null>(null);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Id<"memberGroups"> | "">("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importGroupId, setImportGroupId] = useState<Id<"memberGroups"> | "">("");
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const members = useQuery(api.members.getMembers, {
    search: searchTerm || undefined,
    groupId: selectedGroup || undefined,
    isActive: true,
  });
  const groups = useQuery(api.memberGroups.getGroups, { isActive: true });

  const createMember = useMutation(api.members.createMember);
  const updateMember = useMutation(api.members.updateMember);
  const deleteMember = useMutation(api.members.deleteMember);

  const [formData, setFormData] = useState<MemberFormData>({
    naam: "",
    voornaam: "",
    gsmNummer: "",
    emailAdres: "",
    naamOuders: "",
    emailOuders: "",
    gsmOuders: "",
    adres: "",
    rijksregisternummer: "",
    opmerkingen: "",
    groupIds: [],
  });

  const resetForm = () => {
    setFormData({
      naam: "",
      voornaam: "",
      gsmNummer: "",
      emailAdres: "",
      naamOuders: "",
      emailOuders: "",
      gsmOuders: "",
      adres: "",
      rijksregisternummer: "",
      opmerkingen: "",
      groupIds: [],
    });
    setEditingMember(null);
    setShowForm(false);
  };

  const handleViewMember = (member: any) => {
    setViewingMember(member);
  };

  const resetImport = () => {
    setShowImportDialog(false);
    setImportGroupId("");
    setImportData([]);
    setImportPreview([]);
    setIsProcessingImport(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMember) {
        await updateMember({
          id: editingMember,
          ...formData,
        });
      } else {
        await createMember(formData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving member:", error);
    }
  };

  const handleEdit = (member: any) => {
    setFormData({
      naam: member.naam,
      voornaam: member.voornaam,
      gsmNummer: member.gsmNummer || "",
      emailAdres: member.emailAdres || "",
      naamOuders: member.naamOuders || "",
      emailOuders: member.emailOuders || "",
      gsmOuders: member.gsmOuders || "",
      adres: member.adres || "",
      rijksregisternummer: member.rijksregisternummer || "",
      opmerkingen: member.opmerkingen || "",
      groupIds: member.groupIds || [],
    });
    setEditingMember(member._id);
    setShowForm(true);
  };

  const handleDelete = async (memberId: Id<"members">) => {
    if (confirm("Weet je zeker dat je dit lid wilt verwijderen?")) {
      try {
        await deleteMember({ id: memberId });
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const exportTemplate = () => {
    const template = [{
      naam: "Achternaam",
      voornaam: "Voornaam", 
      gsmNummer: "0123456789",
      emailAdres: "email@example.com", 
      naamOuders: "Naam Ouders", 
      emailOuders: "ouders@example.com", 
      gsmOuders: "0987654321",
      adres: "Straat 123, 1000 Brussel", 
      rijksregisternummer: "12345678901",
      opmerkingen: "Eventuele opmerkingen"
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leden Template");
    XLSX.writeFile(wb, "leden_template.xlsx");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validate and clean the data
        const cleanedData = jsonData.map((row: any) => ({
          naam: row.naam || row.Naam || "",
          voornaam: row.voornaam || row.Voornaam || "",
          gsmNummer: row.gsmNummer || row.GSMNummer || row["GSM Nummer"] || "",
          emailAdres: row.emailAdres || row.EmailAdres || row["Email Adres"] || "",
          naamOuders: row.naamOuders || row.NaamOuders || row["Naam Ouders"] || "",
          emailOuders: row.emailOuders || row.EmailOuders || row["Email Ouders"] || "",
          gsmOuders: row.gsmOuders || row.GSMOuders || row["GSM Ouders"] || "",
          adres: row.adres || row.Adres || "",
          rijksregisternummer: row.rijksregisternummer || row.Rijksregisternummer || "",
          opmerkingen: row.opmerkingen || row.Opmerkingen || "",
        })).filter(row => row.naam && row.voornaam); // Only include rows with name and first name

        setImportData(cleanedData);
        setImportPreview(cleanedData.slice(0, 5)); // Show first 5 rows as preview
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Fout bij het lezen van het bestand. Zorg ervoor dat het een geldig Excel-bestand is.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImport = async () => {
    if (!importGroupId || importData.length === 0) {
      alert("Selecteer een groep en upload een bestand met leden.");
      return;
    }

    setIsProcessingImport(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const memberData of importData) {
        try {
          await createMember({
            ...memberData,
            groupIds: [importGroupId],
          });
          successCount++;
        } catch (error) {
          console.error("Error creating member:", memberData, error);
          errorCount++;
        }
      }
      
      alert(`Import voltooid!\nSuccesvol: ${successCount}\nFouten: ${errorCount}`);
      resetImport();
    } catch (error) {
      console.error("Error during bulk import:", error);
      alert("Er is een fout opgetreden tijdens de import.");
    } finally {
      setIsProcessingImport(false);
    }
  };

  if (!members || !groups) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Leden</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportTemplate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Template</span>
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nieuw Lid
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek leden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value as Id<"memberGroups"> | "")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Alle groepen</option>
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.naam}
            </option>
          ))}
        </select>
      </div>

      {/* Members List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <div 
                className="flex-1"
                onClick={() => handleViewMember(member)}
              >
                <h3 className="font-semibold text-gray-900">
                  {member.voornaam} {member.naam}
                </h3>
                {member.emailAdres && (
                  <p className="text-sm text-gray-600">{member.emailAdres}</p>
                )}
                {member.gsmNummer && (
                  <p className="text-sm text-gray-600">{member.gsmNummer}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(member._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Groups */}
            {member.groupIds && member.groupIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {member.groupIds.map((groupId) => {
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
            )}

            {/* Parent info */}
            {member.naamOuders && (
              <div 
                className="text-sm text-gray-600"
                onClick={() => handleViewMember(member)}
              >
                <p><strong>Ouders:</strong> {member.naamOuders}</p>
                {member.emailOuders && <p>{member.emailOuders}</p>}
                {member.gsmOuders && <p>{member.gsmOuders}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Leden Importeren
              </h3>
              <button
                onClick={resetImport}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1: Select Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Selecteer de groep waar de leden aan toegevoegd moeten worden *
                </label>
                <select
                  value={importGroupId}
                  onChange={(e) => setImportGroupId(e.target.value as Id<"memberGroups"> | "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecteer een groep...</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.naam}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Upload File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Upload Excel bestand *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ondersteunde formaten: .xlsx, .xls. Download eerst de template om de juiste kolommen te hebben.
                </p>
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    Voorvertoning ({importData.length} leden gevonden)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Voornaam</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GSM</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ouders</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importPreview.map((member, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{member.naam}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{member.voornaam}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{member.emailAdres}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{member.gsmNummer}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{member.naamOuders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importData.length > 5 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        ... en nog {importData.length - 5} leden
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isProcessingImport}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!importGroupId || importData.length === 0 || isProcessingImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessingImport && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  <span>{isProcessingImport ? "Importeren..." : `${importData.length} Leden Importeren`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingMember ? "Lid Bewerken" : "Nieuw Lid"}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voornaam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.voornaam}
                    onChange={(e) => setFormData({ ...formData, voornaam: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSM Nummer
                  </label>
                  <input
                    type="tel"
                    value={formData.gsmNummer}
                    onChange={(e) => setFormData({ ...formData, gsmNummer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    value={formData.emailAdres}
                    onChange={(e) => setFormData({ ...formData, emailAdres: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam Ouders/Voogd
                </label>
                <input
                  type="text"
                  value={formData.naamOuders}
                  onChange={(e) => setFormData({ ...formData, naamOuders: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail Ouders
                  </label>
                  <input
                    type="email"
                    value={formData.emailOuders}
                    onChange={(e) => setFormData({ ...formData, emailOuders: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSM Ouders
                  </label>
                  <input
                    type="tel"
                    value={formData.gsmOuders}
                    onChange={(e) => setFormData({ ...formData, gsmOuders: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <textarea
                  value={formData.adres}
                  onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rijksregisternummer
                </label>
                <input
                  type="text"
                  value={formData.rijksregisternummer}
                  onChange={(e) => setFormData({ ...formData, rijksregisternummer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Groepen
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {groups.map((group) => (
                    <label key={group._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.groupIds.includes(group._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              groupIds: [...formData.groupIds, group._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              groupIds: formData.groupIds.filter(id => id !== group._id),
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opmerkingen
                </label>
                <textarea
                  value={formData.opmerkingen}
                  onChange={(e) => setFormData({ ...formData, opmerkingen: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  {editingMember ? "Bijwerken" : "Toevoegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {viewingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Lid Details
              </h3>
              <button
                onClick={() => setViewingMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voornaam
                  </label>
                  <p className="text-gray-900">{viewingMember.voornaam}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam
                  </label>
                  <p className="text-gray-900">{viewingMember.naam}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSM Nummer
                  </label>
                  <p className="text-gray-900">{viewingMember.gsmNummer || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres
                  </label>
                  <p className="text-gray-900">{viewingMember.emailAdres || '-'}</p>
                </div>
              </div>

              {viewingMember.naamOuders && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam Ouders/Voogd
                    </label>
                    <p className="text-gray-900">{viewingMember.naamOuders}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail Ouders
                      </label>
                      <p className="text-gray-900">{viewingMember.emailOuders || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GSM Ouders
                      </label>
                      <p className="text-gray-900">{viewingMember.gsmOuders || '-'}</p>
                    </div>
                  </div>
                </>
              )}

              {viewingMember.adres && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres
                  </label>
                  <p className="text-gray-900">{viewingMember.adres}</p>
                </div>
              )}

              {viewingMember.rijksregisternummer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rijksregisternummer
                  </label>
                  <p className="text-gray-900">{viewingMember.rijksregisternummer}</p>
                </div>
              )}

              {viewingMember.groupIds && viewingMember.groupIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Groepen
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {viewingMember.groupIds.map((groupId) => {
                      const group = groups?.find(g => g._id === groupId);
                      return group ? (
                        <span
                          key={groupId}
                          className="inline-block px-3 py-1 text-sm rounded-full text-white"
                          style={{ backgroundColor: group.kleur }}
                        >
                          {group.naam}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {viewingMember.opmerkingen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opmerkingen
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">{viewingMember.opmerkingen}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lid sinds
                </label>
                <p className="text-gray-900">
                  {new Date(viewingMember._creationTime).toLocaleDateString('nl-NL')}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => {
                  setViewingMember(null);
                  handleEdit(viewingMember);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Bewerken
              </button>
              <button
                onClick={() => setViewingMember(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

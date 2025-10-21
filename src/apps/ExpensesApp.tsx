import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function ExpensesApp() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const expenses = useQuery(api.expenses.listExpenses, {});
  
  const createExpense = useMutation(api.expenses.createExpense);
  const updateExpense = useMutation(api.expenses.updateExpense);
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const updateExpenseStatus = useMutation(api.expenses.updateExpenseStatus);
  const generateUploadUrl = useMutation(api.expenses.generateUploadUrl);

  // Filter expenses based on search only
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = !searchTerm || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleCreateExpense = async (formData: any) => {
    try {
      await createExpense(formData);
      toast.success("Uitgave succesvol aangemaakt");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken uitgave");
    }
  };

  const handleUpdateExpense = async (formData: any) => {
    try {
      await updateExpense({
        expenseId: editingExpense._id,
        ...formData,
      });
      toast.success("Uitgave succesvol bijgewerkt");
      setEditingExpense(null);
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken uitgave");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm("Weet je zeker dat je deze uitgave wilt verwijderen?")) {
      try {
        await deleteExpense({ expenseId: expenseId as Id<"expenses"> });
        toast.success("Uitgave verwijderd");
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen uitgave");
      }
    }
  };

  const handleStatusUpdate = async (expenseId: string, status: "approved" | "rejected") => {
    try {
      await updateExpenseStatus({
        expenseId: expenseId as Id<"expenses">,
        status,
      });
      toast.success(`Uitgave ${status === "approved" ? "goedgekeurd" : "afgewezen"}`);
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken status");
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingExpense(null);
  };

  const stats = {
    total: expenses?.length || 0,
    totalAmount: expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0,
    pending: expenses?.filter(e => e.status === "pending").length || 0,
    approved: expenses?.filter(e => e.status === "approved").length || 0,
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <span className="text-blue-600">Uitgavenbeheer</span>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto p-6">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Uitgaven</h1>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Uitgave Toevoegen
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Totaal Uitgaven</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Totaal Bedrag</p>
                    <p className="text-2xl font-bold text-gray-900">€{stats.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Behandeling</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Goedgekeurd</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </div>
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
                      placeholder="Zoek uitgaven..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg border border-gray-200">
              {filteredExpenses && filteredExpenses.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense._id}
                      expense={expense}
                      onEdit={handleEdit}
                      onDelete={handleDeleteExpense}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen uitgaven gevonden</h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? "Geen uitgaven gevonden die voldoen aan je zoekcriteria"
                      : "Voeg je eerste uitgave toe om te beginnen"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Expense Modal */}
      {showCreateForm && (
        <ExpenseModal
          expense={editingExpense}
          onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
          onClose={handleFormClose}
          generateUploadUrl={generateUploadUrl}
        />
      )}
    </div>
  );
}

interface ExpenseItemProps {
  expense: any;
  onEdit: (expense: any) => void;
  onDelete: (expenseId: string) => void;
  onStatusUpdate: (expenseId: string, status: "approved" | "rejected") => void;
}

function ExpenseItem({ expense, onEdit, onDelete, onStatusUpdate }: ExpenseItemProps) {
  const receiptUrl = useQuery(api.expenses.getReceiptUrl, 
    expense.receipt ? { receiptId: expense.receipt } : "skip"
  );
  
  const creator = useQuery(api.users.listUsers)?.find(user => user._id === expense.createdBy);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600 bg-green-50 border-green-200";
      case "pending": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "rejected": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Goedgekeurd";
      case "pending": return "In behandeling";
      case "rejected": return "Afgewezen";
      default: return "Onbekend";
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {expense.description}
            </h3>
            {expense.status && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(expense.status)}`}>
                {getStatusLabel(expense.status)}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-6 mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Bedrag:</span>
              <span className="text-lg font-semibold text-gray-900">
                €{expense.amount.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Datum:</span>
              <span className="text-sm text-gray-900">
                {new Date(expense.date).toLocaleDateString('nl-NL')}
              </span>
            </div>

            {expense.receipt && receiptUrl && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Bon:</span>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>Bekijk bon</span>
                </a>
              </div>
            )}
          </div>

          {expense.notes && (
            <p className="text-sm text-gray-600 mb-3">
              {expense.notes}
            </p>
          )}

          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <span>Toegevoegd door: {creator?.name || creator?.email || "Onbekend"}</span>
            <span>Aangemaakt: {new Date(expense.createdAt).toLocaleDateString('nl-NL')}</span>
            <span>Bijgewerkt: {new Date(expense.updatedAt).toLocaleDateString('nl-NL')}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {/* Status Update Buttons - Only show for pending expenses */}
          {expense.status === "pending" && (
            <>
              <button
                onClick={() => onStatusUpdate(expense._id, "approved")}
                className="text-gray-400 hover:text-green-600 p-1"
                title="Uitgave goedkeuren"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => onStatusUpdate(expense._id, "rejected")}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Uitgave afwijzen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          
          <button
            onClick={() => onEdit(expense)}
            className="text-gray-400 hover:text-blue-600 p-1"
            title="Uitgave bewerken"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(expense._id)}
            className="text-gray-400 hover:text-red-600 p-1"
            title="Uitgave verwijderen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ExpenseModalProps {
  expense?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  generateUploadUrl: any;
}

function ExpenseModal({ expense, onSubmit, onClose, generateUploadUrl }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    description: expense?.description || "",
    amount: expense?.amount || 0,
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: expense?.notes || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let receiptId = expense?.receipt;

      // Upload file if selected
      if (selectedFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        
        if (!result.ok) {
          throw new Error("Upload failed");
        }
        
        const { storageId } = await result.json();
        receiptId = storageId;
      }

      await onSubmit({
        ...formData,
        date: new Date(formData.date).getTime(),
        receipt: receiptId,
      });
    } catch (error) {
      toast.error("Fout bij uploaden bestand");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Bestand is te groot. Maximum 10MB toegestaan.");
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Alleen afbeeldingen (JPG, PNG, GIF) en PDF bestanden zijn toegestaan.");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {expense ? "Uitgave Bewerken" : "Nieuwe Uitgave"}
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
              Beschrijving *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrag (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bon/Factuur
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload een bestand</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">of sleep en zet neer</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, PDF tot 10MB
                </p>
              </div>
            </div>
            {selectedFile && (
              <div className="mt-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
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
              disabled={isUploading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
            >
              {isUploading ? "Uploaden..." : expense ? "Bijwerken" : "Toevoegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

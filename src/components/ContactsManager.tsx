import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Contact {
  _id: Id<"contacts">;
  name: string;
  phoneNumber?: string;
  email?: string;
  company?: string;
  categoryId?: Id<"contactCategories">;
  notes?: string;
  category?: {
    _id: Id<"contactCategories">;
    name: string;
    color: string;
  } | null;
}

interface ContactCategory {
  _id: Id<"contactCategories">;
  name: string;
  description?: string;
  color: string;
}

export function ContactsManager() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ContactCategory | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3B82F6");

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactCategoryId, setContactCategoryId] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  const categories = useQuery(api.contacts.getContactCategories) || [];
  const contacts = useQuery(
    api.contacts.getContacts,
    selectedCategoryId ? { categoryId: selectedCategoryId as Id<"contactCategories"> } : {}
  ) || [];
  
  const searchResults = useQuery(
    api.contacts.searchContacts,
    searchTerm.length >= 2 ? { 
      searchTerm,
      categoryId: selectedCategoryId ? selectedCategoryId as Id<"contactCategories"> : undefined
    } : "skip"
  ) || [];

  const createCategory = useMutation(api.contacts.createContactCategory);
  const updateCategory = useMutation(api.contacts.updateContactCategory);
  const deleteCategory = useMutation(api.contacts.deleteContactCategory);
  const createContact = useMutation(api.contacts.createContact);
  const updateContact = useMutation(api.contacts.updateContact);
  const deleteContact = useMutation(api.contacts.deleteContact);

  const displayedContacts = searchTerm.length >= 2 ? searchResults : contacts;

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryColor("#3B82F6");
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetContactForm = () => {
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setContactCompany("");
    setContactCategoryId("");
    setContactNotes("");
    setEditingContact(null);
    setShowContactForm(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory({
          categoryId: editingCategory._id,
          name: categoryName,
          description: categoryDescription,
          color: categoryColor,
        });
        toast.success("Categorie bijgewerkt");
      } else {
        await createCategory({
          name: categoryName,
          description: categoryDescription,
          color: categoryColor,
        });
        toast.success("Categorie aangemaakt");
      }
      resetCategoryForm();
    } catch (error: any) {
      toast.error(error.message || "Fout bij opslaan categorie");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        await updateContact({
          contactId: editingContact._id,
          name: contactName,
          phoneNumber: contactPhone || undefined,
          email: contactEmail || undefined,
          company: contactCompany || undefined,
          categoryId: contactCategoryId ? contactCategoryId as Id<"contactCategories"> : undefined,
          notes: contactNotes || undefined,
        });
        toast.success("Contact bijgewerkt");
      } else {
        await createContact({
          name: contactName,
          phoneNumber: contactPhone || undefined,
          email: contactEmail || undefined,
          company: contactCompany || undefined,
          categoryId: contactCategoryId ? contactCategoryId as Id<"contactCategories"> : undefined,
          notes: contactNotes || undefined,
        });
        toast.success("Contact aangemaakt");
      }
      resetContactForm();
    } catch (error: any) {
      toast.error(error.message || "Fout bij opslaan contact");
    }
  };

  const handleEditCategory = (category: ContactCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setCategoryColor(category.color);
    setShowCategoryForm(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactPhone(contact.phoneNumber || "");
    setContactEmail(contact.email || "");
    setContactCompany(contact.company || "");
    setContactCategoryId(contact.categoryId || "");
    setContactNotes(contact.notes || "");
    setShowContactForm(true);
  };

  const handleDeleteCategory = async (categoryId: Id<"contactCategories">) => {
    if (!confirm("Weet je zeker dat je deze categorie wilt verwijderen?")) {
      return;
    }

    try {
      await deleteCategory({ categoryId });
      toast.success("Categorie verwijderd");
    } catch (error: any) {
      toast.error(error.message || "Fout bij verwijderen categorie");
    }
  };

  const handleDeleteContact = async (contactId: Id<"contacts">) => {
    if (!confirm("Weet je zeker dat je dit contact wilt verwijderen?")) {
      return;
    }

    try {
      await deleteContact({ contactId });
      toast.success("Contact verwijderd");
    } catch (error: any) {
      toast.error(error.message || "Fout bij verwijderen contact");
    }
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Contacten</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCategoryForm(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Nieuwe Categorie
              </button>
              <button
                onClick={() => setShowContactForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nieuw Contact
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Zoek contacten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Alle categorieën</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorieën</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategoryId("")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategoryId === "" 
                    ? "bg-blue-100 text-blue-800" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Alle contacten ({contacts.length})
              </button>
              {categories.map((category) => (
                <div key={category._id} className="flex items-center justify-between group">
                  <button
                    onClick={() => setSelectedCategoryId(category._id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategoryId === category._id 
                        ? "bg-blue-100 text-blue-800" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {displayedContacts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen contacten</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? "Geen contacten gevonden voor je zoekopdracht." : "Voeg je eerste contact toe om te beginnen."}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Eerste Contact Toevoegen
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {displayedContacts.map((contact) => (
                    <div key={contact._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{contact.name}</h3>
                            {contact.category && (
                              <span 
                                className="px-2 py-1 text-xs rounded-full text-white"
                                style={{ backgroundColor: contact.category.color }}
                              >
                                {contact.category.name}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            {contact.company && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>{contact.company}</span>
                              </div>
                            )}
                            {contact.phoneNumber && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <a href={`tel:${contact.phoneNumber}`} className="hover:text-blue-600">
                                  {contact.phoneNumber}
                                </a>
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.notes && (
                              <div className="mt-2 text-gray-500 text-sm">
                                {contact.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="p-2 text-gray-400 hover:text-blue-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact._id)}
                            className="p-2 text-gray-400 hover:text-red-600"
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
              )}
            </div>
          </div>
        </div>

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCategory ? "Categorie Bewerken" : "Nieuwe Categorie"}
              </h2>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kleur
                  </label>
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCategory ? "Bijwerken" : "Aanmaken"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingContact ? "Contact Bewerken" : "Nieuw Contact"}
              </h2>
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefoonnummer
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrijf
                  </label>
                  <input
                    type="text"
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categorie
                  </label>
                  <select
                    value={contactCategoryId}
                    onChange={(e) => setContactCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Geen categorie</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notities
                  </label>
                  <textarea
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetContactForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingContact ? "Bijwerken" : "Aanmaken"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

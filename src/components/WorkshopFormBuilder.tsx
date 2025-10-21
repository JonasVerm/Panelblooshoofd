import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface FormField {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "email" | "tel" | "number" | "date";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  order: number;
}

interface WorkshopFormBuilderProps {
  onClose: () => void;
}

export function WorkshopFormBuilder({ onClose }: WorkshopFormBuilderProps) {
  const [templateName, setTemplateName] = useState("Nieuw Workshop Formulier");
  const [templateDescription, setTemplateDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [draggedField, setDraggedField] = useState<number | null>(null);
  const [showAddField, setShowAddField] = useState(false);

  const defaultTemplate = useQuery(api.workshopFormTemplates.getDefaultFormTemplate);
  const saveTemplate = useMutation(api.workshopFormTemplates.saveFormTemplate);

  useEffect(() => {
    if (defaultTemplate && fields.length === 0) {
      setFields(defaultTemplate.fields.sort((a, b) => a.order - b.order));
      setTemplateName(defaultTemplate.name);
    }
  }, [defaultTemplate, fields.length]);

  const handleSave = async () => {
    try {
      // If we have a default template, update it instead of creating a new one
      const templateId = defaultTemplate && '_id' in defaultTemplate ? defaultTemplate._id : undefined;
      
      await saveTemplate({
        id: templateId,
        name: templateName,
        description: templateDescription,
        fields: fields.map((field, index) => ({ ...field, order: index + 1 })),
        isDefault: true,
      });
      toast.success("Formulier template opgeslagen");
      onClose();
    } catch (error) {
      toast.error("Fout bij opslaan template");
    }
  };

  const addTeacherField = () => {
    const teacherField: FormField = {
      id: "teacherId",
      type: "select",
      label: "Docent",
      placeholder: "Selecteer een docent",
      required: false,
      order: fields.length + 1,
    };
    setFields([...fields, teacherField]);
  };

  const addField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `Nieuw ${type} veld`,
      placeholder: "",
      required: false,
      options: type === "select" || type === "radio" ? ["Optie 1", "Optie 2"] : undefined,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
    setShowAddField(false);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);
    setFields(updatedFields);
  };

  const handleDragStart = (index: number) => {
    setDraggedField(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedField !== null && draggedField !== index) {
      moveField(draggedField, index);
      setDraggedField(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const fieldTypes = [
    { type: "text" as const, label: "Tekst", icon: "📝" },
    { type: "textarea" as const, label: "Tekst Gebied", icon: "📄" },
    { type: "select" as const, label: "Dropdown", icon: "📋" },
    { type: "radio" as const, label: "Keuze Rondje", icon: "🔘" },
    { type: "checkbox" as const, label: "Checkbox", icon: "☑️" },
    { type: "email" as const, label: "E-mail", icon: "📧" },
    { type: "tel" as const, label: "Telefoon", icon: "📞" },
    { type: "number" as const, label: "Nummer", icon: "🔢" },
    { type: "date" as const, label: "Datum", icon: "📅" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Workshop Formulier Editor</h2>
            <p className="text-gray-600">Pas de velden van het workshop formulier aan</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Form Builder */}
          <div className="w-2/3 p-6 overflow-y-auto">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Naam
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschrijving
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Formulier Velden</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={addTeacherField}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    + Docent Veld
                  </button>
                  <button
                    onClick={() => setShowAddField(!showAddField)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    + Veld Toevoegen
                  </button>
                </div>
              </div>

              {showAddField && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Selecteer veld type:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {fieldTypes.map((fieldType) => (
                      <button
                        key={fieldType.type}
                        onClick={() => addField(fieldType.type)}
                        className="p-3 border border-gray-300 rounded-md hover:bg-white hover:border-blue-500 text-sm flex items-center space-x-2"
                      >
                        <span>{fieldType.icon}</span>
                        <span>{fieldType.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  onUpdate={(updates) => updateField(index, updates)}
                  onRemove={() => removeField(index)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedField === index}
                />
              ))}

              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Geen velden toegevoegd. Klik op "Veld Toevoegen" om te beginnen.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/3 bg-gray-50 p-6 border-l border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Voorbeeld</h3>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="text-md font-medium text-gray-900 mb-4">{templateName}</h4>
              <div className="space-y-4">
                {fields.map((field) => (
                  <FieldPreview key={field.id} field={field} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Template Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldEditorProps {
  field: FormField;
  index: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function FieldEditor({ field, index, onUpdate, onRemove, onDragStart, onDragOver, onDragEnd, isDragging }: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const addOption = () => {
    const newOptions = [...(field.options || []), `Optie ${(field.options?.length || 0) + 1}`];
    onUpdate({ options: newOptions });
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[optionIndex] = value;
    onUpdate({ options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = field.options?.filter((_, i) => i !== optionIndex) || [];
    onUpdate({ options: newOptions });
  };

  return (
    <div
      className={`border border-gray-300 rounded-lg p-4 ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="cursor-move text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">{field.type}</span>
          <span className="text-xs text-gray-500">#{index + 1}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className={`w-4 h-4 transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-2">
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full text-sm font-medium border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
          placeholder="Veld label"
        />
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="mr-2"
            />
            <label className="text-xs font-medium text-gray-700">Verplicht veld</label>
          </div>

          {(field.type === "select" || field.type === "radio") && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Opties
              </label>
              <div className="space-y-2">
                {field.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeOption(optionIndex)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Optie toevoegen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FieldPreviewProps {
  field: FormField;
}

function FieldPreview({ field }: FieldPreviewProps) {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
      case "date":
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            disabled
          />
        );
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            disabled
          />
        );
      case "select":
        return (
          <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" disabled>
            <option>{field.placeholder || "Selecteer een optie"}</option>
            {field.options?.map((option, index) => (
              <option key={index}>{option}</option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input type="radio" name={field.id} disabled />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <label className="flex items-center space-x-2">
            <input type="checkbox" disabled />
            <span className="text-sm">{field.placeholder || "Checkbox optie"}</span>
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
    </div>
  );
}

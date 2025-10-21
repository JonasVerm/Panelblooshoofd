import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface WorkshopFormProps {
  workshop?: any;
  onClose: () => void;
}

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

export function WorkshopForm({ workshop, onClose }: WorkshopFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWorkshop = useMutation(api.workshops.createWorkshop);
  const updateWorkshop = useMutation(api.workshops.updateWorkshop);
  const teachers = useQuery(api.teachers.listTeachers, {});
  const formTemplate = useQuery(api.workshopFormTemplates.getDefaultFormTemplate);

  // Initialize form data when workshop or template changes
  useEffect(() => {
    if (workshop && formTemplate) {
      // When editing, initialize with workshop data for all template fields
      const initialData: Record<string, any> = {};
      formTemplate.fields.forEach(field => {
        // Use workshop data if available, otherwise use default values
        if (workshop[field.id] !== undefined) {
          if (field.type === "date" && workshop[field.id]) {
            initialData[field.id] = new Date(workshop[field.id]).toISOString().split('T')[0];
          } else {
            initialData[field.id] = workshop[field.id];
          }
        } else {
          initialData[field.id] = field.defaultValue || (field.type === "number" ? 0 : field.type === "checkbox" ? false : "");
        }
      });
      setFormData(initialData);
    } else if (!workshop && formTemplate) {
      // Initialize with default values from template
      const initialData: Record<string, any> = {};
      formTemplate.fields.forEach(field => {
        if (field.defaultValue) {
          initialData[field.id] = field.defaultValue;
        } else {
          switch (field.type) {
            case "number":
              initialData[field.id] = 0;
              break;
            case "checkbox":
              initialData[field.id] = false;
              break;
            default:
              initialData[field.id] = "";
          }
        }
      });
      setFormData(initialData);
    }
  }, [workshop, formTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (formTemplate) {
        for (const field of formTemplate.fields) {
          if (field.required && (!formData[field.id] || formData[field.id] === "")) {
            toast.error(`${field.label} is verplicht`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      const workshopData = {
        title: formData.title || "",
        description: formData.description || "",
        date: new Date(formData.date).getTime(),
        startTime: formData.startTime || "",
        endTime: formData.endTime || "",
        location: formData.location || "",
        maxParticipants: Number(formData.maxParticipants) || 0,
        price: Number(formData.price) || 0,
        teacherId: formData.teacherId && formData.teacherId !== "" ? formData.teacherId : undefined,
      };

      if (workshop) {
        await updateWorkshop({
          workshopId: workshop._id,
          ...workshopData,
          teacherId: workshopData.teacherId,
        });
        toast.success("Workshop succesvol bijgewerkt");
      } else {
        await createWorkshop(workshopData);
        toast.success("Workshop succesvol aangemaakt");
      }

      onClose();
    } catch (error) {
      toast.error(workshop ? "Fout bij bijwerken workshop" : "Fout bij aanmaken workshop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || "";

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, Number(e.target.value))}
            required={field.required}
            placeholder={field.placeholder}
            min={field.id === "maxParticipants" ? "1" : "0"}
            step={field.id === "price" ? "0.01" : "1"}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case "select":
        // Special handling for teacherId field
        if (field.id === "teacherId") {
          return (
            <select
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Geen docent toegewezen</option>
              {teachers?.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          );
        }

        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{field.placeholder || "Selecteer een optie"}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              required={field.required}
            />
            <span>{field.placeholder || field.label}</span>
          </label>
        );

      default:
        return null;
    }
  };

  if (!formTemplate) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Formulier laden...</p>
        </div>
      </div>
    );
  }

  const sortedFields = formTemplate.fields.sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {workshop ? "Workshop Bewerken" : "Nieuwe Workshop Maken"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedFields.map((field) => (
              <div key={field.id} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Opslaan..." : workshop ? "Workshop Bijwerken" : "Workshop Maken"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function TodoApp() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  const users = useQuery(api.todos.getAllUsers);
  const currentUser = useQuery(api.auth.loggedInUser);
  const todos = useQuery(api.todos.getUserTodos, 
    selectedUserId ? { userId: selectedUserId as Id<"users"> } : {}
  );
  
  const createTodo = useMutation(api.todos.createTodo);
  const updateTodo = useMutation(api.todos.updateTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  // Filter todos based on completion status
  const filteredTodos = todos?.filter(todo => {
    const statusMatch = filter === "all" || 
      (filter === "active" && !todo.isCompleted) || 
      (filter === "completed" && todo.isCompleted);
    
    return statusMatch;
  });

  const handleCreateTodo = async (formData: any) => {
    try {
      await createTodo(formData);
      toast.success("Taak succesvol aangemaakt");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken taak");
    }
  };

  const handleToggleComplete = async (todoId: string, isCompleted: boolean) => {
    try {
      await updateTodo({
        id: todoId as Id<"todos">,
        isCompleted: !isCompleted,
      });
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken taak");
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (confirm("Weet je zeker dat je deze taak wilt verwijderen?")) {
      try {
        await deleteTodo({ id: todoId as Id<"todos"> });
        toast.success("Taak verwijderd");
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen taak");
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Hoog";
      case "medium": return "Gemiddeld";
      case "low": return "Laag";
      default: return priority;
    }
  };

  const stats = {
    total: todos?.length || 0,
    active: todos?.filter(t => !t.isCompleted).length || 0,
    completed: todos?.filter(t => t.isCompleted).length || 0,
  };

  const selectedUserName = selectedUserId 
    ? users?.find(u => u._id === selectedUserId)?.name || "Onbekende gebruiker"
    : currentUser?.name || "Jij";

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            <div className="py-4 px-1 border-b-2 border-blue-500 font-medium text-sm flex items-center space-x-2">
              <span className="text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              <span className="text-blue-600">Takenbeheer</span>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto p-6">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">To-do</h1>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Taak Maken
              </button>
            </div>

            {/* User Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Bekijk taken van:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Mijn taken</option>
                  {users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  Toont taken van: <strong>{selectedUserName}</strong>
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Totaal Taken</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                    <p className="text-sm font-medium text-gray-600">Actief</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
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
                    <p className="text-sm font-medium text-gray-600">Voltooid</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex space-x-1">
                {[
                  { id: "all", label: "Alle Taken" },
                  { id: "active", label: "Actief" },
                  { id: "completed", label: "Voltooid" },
                ].map((filterOption) => (
                  <button
                    key={filterOption.id}
                    onClick={() => setFilter(filterOption.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      filter === filterOption.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-lg border border-gray-200">
              {filteredTodos && filteredTodos.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredTodos.map((todo) => (
                    <div key={todo._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={() => handleToggleComplete(todo._id, todo.isCompleted)}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            todo.isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-green-500"
                          }`}
                        >
                          {todo.isCompleted && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-medium ${
                              todo.isCompleted ? "text-gray-500 line-through" : "text-gray-900"
                            }`}>
                              {todo.title}
                            </h3>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(todo.priority)}`}>
                                {getPriorityLabel(todo.priority)}
                              </span>
                              
                              <button
                                onClick={() => handleDeleteTodo(todo._id)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Taak verwijderen"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {todo.description && (
                            <p className={`mt-2 text-sm ${
                              todo.isCompleted ? "text-gray-400" : "text-gray-600"
                            }`}>
                              {todo.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center text-xs text-gray-500 space-x-4">
                            <span>Aangemaakt: {new Date(todo.createdAt).toLocaleDateString('nl-NL')}</span>
                            {todo.creator && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Gemaakt door: {todo.creator.name || todo.creator.email}</span>
                              </span>
                            )}
                            {todo.owner && todo.owner._id !== todo.creator?._id && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Toegewezen aan: {todo.owner.name || todo.owner.email}</span>
                              </span>
                            )}
                            {todo.dueDate && (
                              <span className={`flex items-center space-x-1 ${
                                new Date(todo.dueDate) < new Date() && !todo.isCompleted
                                  ? "text-red-600 font-medium"
                                  : ""
                              }`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Deadline: {new Date(todo.dueDate).toLocaleDateString('nl-NL')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen taken gevonden</h3>
                  <p className="text-gray-600">
                    {filter === "all" 
                      ? selectedUserId 
                        ? `${selectedUserName} heeft nog geen taken`
                        : "Maak je eerste taak om te beginnen"
                      : `Geen ${filter === "active" ? "actieve" : "voltooide"} taken op dit moment`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateForm && (
        <CreateTaskModal
          onSubmit={handleCreateTodo}
          onClose={() => setShowCreateForm(false)}
          users={users || []}
        />
      )}
    </div>
  );
}

interface CreateTaskModalProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  users: Array<{ _id: string; name: string; email: string }>;
}

function CreateTaskModal({ onSubmit, onClose, users }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    ownerId: "", // User to assign the task to
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
      ownerId: formData.ownerId || undefined, // If empty, will default to current user
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Nieuwe Taak Maken</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Beschrijf de taak..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toewijzen aan
            </label>
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Mijzelf</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioriteit
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Laag</option>
                <option value="medium">Gemiddeld</option>
                <option value="high">Hoog</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              Taak Maken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

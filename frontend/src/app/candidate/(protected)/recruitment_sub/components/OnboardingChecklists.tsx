'use client';

import { useState, useEffect } from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { recruitmentApi, OnboardingTaskDto } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

interface TaskInput extends OnboardingTaskDto {
  id: string;
}

export function OnboardingChecklists() {
  const toast = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [contractId, setContractId] = useState('');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<TaskInput[]>([
    { id: '1', name: '', department: '', deadline: '', notes: '' }
  ]);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getAllOnboardingChecklists();
      setChecklists(response.data.checklists || []);
    } catch (error: any) {
      toast.error('Failed to load checklists');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => {
    setTasks([...tasks, {
      id: Date.now().toString(),
      name: '',
      department: '',
      deadline: '',
      notes: ''
    }]);
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const updateTask = (id: string, field: keyof OnboardingTaskDto, value: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      toast.error('Employee ID is required');
      return;
    }

    if (!contractId) {
      toast.error('Contract ID is required');
      return;
    }

    const validTasks = tasks.filter(task => task.name.trim() !== '');
    if (validTasks.length === 0) {
      toast.error('At least one task is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const checklistData = {
        employeeId,
        contractId,
        tasks: validTasks.map(({ id, ...task }) => task),
        notes: notes || undefined,
      };

      await recruitmentApi.createOnboardingChecklist(checklistData);
      toast.success('Onboarding checklist created successfully!');
      setShowCreateForm(false);

      // Reset form
      setEmployeeId('');
      setContractId('');
      setNotes('');
      setTasks([{ id: '1', name: '', department: '', deadline: '', notes: '' }]);

      fetchChecklists();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create checklist';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (employeeId: string, taskName: string, status: string) => {
    try {
      // Ensure employeeId is a string (it could be an ObjectId object from MongoDB)
      const empId = typeof employeeId === 'object' ? (employeeId as any).toString() : String(employeeId);

      await recruitmentApi.updateTaskStatus({
        employeeId: empId,
        taskName: taskName,
        status: status,
      });
      toast.success(`Task "${taskName}" updated to ${status.replace('_', ' ')}!`);

      // Refresh checklists and update selected checklist if modal is open
      const response = await recruitmentApi.getAllOnboardingChecklists();
      const newChecklists = response.data.checklists || [];
      setChecklists(newChecklists);

      // Update selected checklist if modal is open
      if (selectedChecklist) {
        const updatedChecklist = newChecklists.find(
          (item: any) => item.onboarding._id === selectedChecklist.onboarding._id
        );
        if (updatedChecklist) {
          setSelectedChecklist(updatedChecklist);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">Onboarding Checklists</h3>
          <p className="text-sm text-gray-600">Create and manage onboarding task checklists for new hires</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <AddIcon sx={{ fontSize: 16 }} />
          Create Checklist
        </button>
      </div>

      {/* Checklist Templates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-gray-900 font-medium mb-4">Active Onboarding Checklists</h4>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <CircularProgress size={24} />
          </div>
        ) : (
          <div className="space-y-4">
            {checklists.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No onboarding checklists yet. Create one to get started!</p>
            ) : (
              checklists.map((item: any) => {
                const onboarding = item.onboarding;
                const progress = item.progress;

                return (
                  <div key={onboarding._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-gray-900 font-medium">Employee ID: {onboarding.employeeId}</h5>
                          {onboarding.completed ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {progress.totalTasks} tasks • {progress.completedTasks} completed • {progress.pendingTasks} pending
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{progress.progressPercentage}%</div>
                        <p className="text-xs text-gray-500">Complete</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Task Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-700">{progress.completedTasks}</div>
                        <div className="text-green-600">Completed</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="font-semibold text-yellow-700">{progress.inProgressTasks}</div>
                        <div className="text-yellow-600">In Progress</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-700">{progress.pendingTasks}</div>
                        <div className="text-gray-600">Pending</div>
                      </div>
                    </div>

                    {/* Task List Preview */}
                    {onboarding.tasks && onboarding.tasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Recent Tasks:</p>
                        <div className="space-y-1">
                          {onboarding.tasks.slice(0, 3).map((task: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                  task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                                }`}></span>
                              <span className="text-gray-700">{task.name}</span>
                              {task.department && (
                                <span className="text-gray-500">({task.department})</span>
                              )}
                            </div>
                          ))}
                          {onboarding.tasks.length > 3 && (
                            <p className="text-xs text-gray-500 ml-4">... and {onboarding.tasks.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSelectedChecklist(item);
                          setShowDetailsModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        <VisibilityIcon sx={{ fontSize: 16 }} />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedChecklist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Onboarding Details</h3>
                <p className="text-sm text-gray-500">Employee ID: {selectedChecklist.onboarding.employeeId}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedChecklist(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <CloseIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Progress Overview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Progress Overview</h4>
                    <p className="text-sm text-gray-600">
                      {selectedChecklist.onboarding.completed ? 'All tasks completed' : 'Onboarding in progress'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{selectedChecklist.progress.progressPercentage}%</div>
                    <p className="text-xs text-gray-500">Complete</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${selectedChecklist.progress.progressPercentage}%` }}
                  ></div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xl font-bold text-gray-900">{selectedChecklist.progress.totalTasks}</div>
                    <div className="text-xs text-gray-500">Total Tasks</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xl font-bold text-green-700">{selectedChecklist.progress.completedTasks}</div>
                    <div className="text-xs text-green-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-xl font-bold text-yellow-700">{selectedChecklist.progress.inProgressTasks}</div>
                    <div className="text-xs text-yellow-600">In Progress</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xl font-bold text-gray-700">{selectedChecklist.progress.pendingTasks}</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>
                </div>
              </div>

              {/* Contract Info */}
              {selectedChecklist.onboarding.contractId && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Contract ID:</span> {selectedChecklist.onboarding.contractId}
                  </p>
                </div>
              )}

              {/* All Tasks */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">All Tasks ({selectedChecklist.onboarding.tasks?.length || 0})</h4>
                <div className="space-y-3">
                  {selectedChecklist.onboarding.tasks?.map((task: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${task.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : task.status === 'in_progress'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Status Icon */}
                          <div className="mt-0.5">
                            {task.status === 'completed' ? (
                              <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                            ) : task.status === 'in_progress' ? (
                              <AccessTimeIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                            ) : (
                              <WarningIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900">{task.name}</h5>
                              <span className={`px-2 py-0.5 text-xs rounded capitalize ${task.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : task.status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                {task.status?.replace('_', ' ') || 'pending'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                              {task.department && (
                                <div>
                                  <span className="text-gray-500">Department:</span>{' '}
                                  <span className="text-gray-900">{task.department}</span>
                                </div>
                              )}
                              {task.deadline && (
                                <div>
                                  <span className="text-gray-500">Deadline:</span>{' '}
                                  <span className="text-gray-900">{new Date(task.deadline).toLocaleDateString()}</span>
                                </div>
                              )}
                              {task.completedAt && (
                                <div>
                                  <span className="text-gray-500">Completed:</span>{' '}
                                  <span className="text-green-700">{new Date(task.completedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {task.notes && (
                              <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                                <span className="text-gray-500">Notes:</span>{' '}
                                <span className="text-gray-700">{task.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Update Status Button */}
                        {task.status !== 'completed' && (
                          <div className="ml-3">
                            <select
                              value={task.status || 'pending'}
                              onChange={(e) => {
                                handleUpdateTaskStatus(
                                  selectedChecklist.onboarding.employeeId,
                                  task.name,
                                  e.target.value
                                );
                              }}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm text-gray-500">
                {selectedChecklist.onboarding.createdAt && (
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(selectedChecklist.onboarding.createdAt).toLocaleString()}
                  </div>
                )}
                {selectedChecklist.onboarding.completedAt && (
                  <div>
                    <span className="font-medium">Completed:</span>{' '}
                    {new Date(selectedChecklist.onboarding.completedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedChecklist(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-gray-900 text-xl font-semibold mb-6">Create Onboarding Checklist</h3>
            <form onSubmit={handleCreateChecklist} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter employee ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter contract ID"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Add any general notes for the onboarding checklist"
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Tasks <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addTask}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Task
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Task {index + 1}</h4>
                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(task.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Task Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                            placeholder="e.g. Complete IT setup"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Department</label>
                          <input
                            type="text"
                            value={task.department || ''}
                            onChange={(e) => updateTask(task.id, 'department', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                            placeholder="e.g. IT"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Deadline</label>
                          <input
                            type="date"
                            value={task.deadline || ''}
                            onChange={(e) => updateTask(task.id, 'deadline', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Notes</label>
                          <textarea
                            value={task.notes || ''}
                            onChange={(e) => updateTask(task.id, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                            placeholder="Add any notes for this task"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEmployeeId('');
                    setContractId('');
                    setNotes('');
                    setTasks([{ id: '1', name: '', department: '', deadline: '', notes: '' }]);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={16} sx={{ color: 'inherit' }} />
                      Creating...
                    </>
                  ) : (
                    'Create Checklist'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

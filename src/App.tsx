import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useLabels } from './hooks/useLabels';
import { isConfigured } from './lib/supabase';
import { Task, Status, Label } from './types';
import { Header } from './components/Header/Header';
import { Board } from './components/Board/Board';
import { CreateTaskModal } from './components/Modals/CreateTaskModal';
import { TaskDetailPanel } from './components/TaskDetail/TaskDetailPanel';
import { SetupScreen } from './components/UI/SetupScreen';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, moveTask, logActivity } = useTasks(user);
  const { labels, createLabel } = useLabels(user);

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [createModal, setCreateModal] = useState<{ open: boolean; status: Status }>({ open: false, status: 'todo' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!isConfigured) return <SetupScreen />;

  if (authLoading || (user && tasksLoading)) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Setting up your board...</span>
      </div>
    );
  }

  const openCreate = (status: Status) => setCreateModal({ open: true, status });

  const handleCreate = async (data: {
    title: string; description: string; priority: any;
    due_date: string; status: Status; labelIds: string[];
  }) => {
    await createTask(data);
  };

  const handleUpdate = async (id: string, updates: Partial<Task> & { labelIds?: string[] }) => {
    await updateTask(id, updates);
    // Refresh selected task if open
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, ...updates } : prev);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    setSelectedTask(null);
  };

  const handleCreateLabel = async (name: string, color: string): Promise<Label | undefined> => {
    return await createLabel(name, color) as Label | undefined;
  };

  return (
    <div className="app">
      <Header
        tasks={tasks}
        labels={labels}
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onFilterPriority={setFilterPriority}
        filterLabel={filterLabel}
        onFilterLabel={setFilterLabel}
      />

      <Board
        tasks={tasks}
        search={search}
        filterPriority={filterPriority}
        filterLabel={filterLabel}
        onMoveTask={moveTask}
        onAddTask={openCreate}
        onTaskClick={setSelectedTask}
      />

      {createModal.open && (
        <CreateTaskModal
          defaultStatus={createModal.status}
          labels={labels}
          onClose={() => setCreateModal(m => ({ ...m, open: false }))}
          onCreate={handleCreate}
          onCreateLabel={handleCreateLabel}
        />
      )}

      {selectedTask && user && (
        <TaskDetailPanel
          task={selectedTask}
          user={user}
          labels={labels}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCreateLabel={handleCreateLabel}
          logActivity={logActivity}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, Status, COLUMNS } from '../../types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface BoardProps {
  tasks: Task[];
  search: string;
  filterPriority: string;
  filterLabel: string;
  onMoveTask: (taskId: string, newStatus: Status, newPosition: number) => void;
  onAddTask: (status: Status) => void;
  onTaskClick: (task: Task) => void;
}

export function Board({ tasks, search, filterPriority, filterLabel, onMoveTask, onAddTask, onTaskClick }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter tasks
  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !filterPriority || t.priority === filterPriority;
    const matchLabel = !filterLabel || t.labels?.some(l => l.id === filterLabel);
    return matchSearch && matchPriority && matchLabel;
  });

  const getColumnTasks = (status: Status) =>
    filtered.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine target status
    let targetStatus: Status = task.status;
    let targetPosition = 0;

    const overData = over.data.current;
    if (overData?.type === 'column') {
      targetStatus = overData.status as Status;
      targetPosition = getColumnTasks(targetStatus).length;
    } else if (overData?.type === 'task') {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
        const colTasks = getColumnTasks(targetStatus);
        const overIdx = colTasks.findIndex(t => t.id === over.id);
        targetPosition = overIdx >= 0 ? overIdx : colTasks.length;
      }
    }

    onMoveTask(taskId, targetStatus, targetPosition);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handled in dragEnd for simplicity / Supabase persistence
  };

  const activeColumn = activeTask ? COLUMNS.find(c => c.id === activeTask.status) : null;

  return (
    <div className="board-wrapper">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="board">
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              tasks={getColumnTasks(col.id)}
              onAddTask={() => onAddTask(col.id)}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && activeColumn ? (
            <div className="drag-overlay-card">
              <TaskCard
                task={activeTask}
                columnColor={activeColumn.color}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

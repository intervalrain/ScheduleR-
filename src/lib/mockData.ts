import { addDays, subDays } from 'date-fns';

// Mock Sprint Data
export const mockSprints = [
  {
    id: "mock-sprint-1",
    name: "Demo Project Sprint",
    startDate: subDays(new Date(), 3).toISOString(),
    endDate: addDays(new Date(), 11).toISOString(),
    type: "PROJECT" as const,
    defaultWorkDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkHours: { start: "08:30", end: "17:30" },
    teamId: "mock-team-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mock-sprint-2", 
    name: "Personal Tasks Sprint",
    startDate: addDays(new Date(), 14).toISOString(),
    endDate: addDays(new Date(), 28).toISOString(),
    type: "CASUAL" as const,
    defaultWorkDays: [1, 2, 3, 4, 5, 6, 7], // All days
    defaultWorkHours: { start: "00:00", end: "23:59" },
    teamId: "mock-team-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Mock Task Data
export const mockTasks = [
  {
    id: "mock-task-1",
    sprintId: "mock-sprint-1",
    title: "Welcome to ScheduleR 👋",
    description: "This is a demo task to showcase the project management features. You can drag this between columns in Kanban view!",
    estimatedHours: 2,
    priority: 500000,
    tags: ["demo", "welcome"],
    labels: ["important"],
    status: "TODO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assigneeId: "mock-user-1",
    createdById: "mock-user-1",
    assignee: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@example.com",
      image: null,
    }
  },
  {
    id: "mock-task-2",
    sprintId: "mock-sprint-1", 
    title: "Explore Gantt Chart 📊",
    description: "Check out the automatic scheduling algorithm in the Gantt view. Tasks are scheduled based on work hours and dependencies.",
    estimatedHours: 4,
    priority: 400000,
    tags: ["demo", "gantt"],
    labels: ["feature"],
    status: "IN_PROGRESS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assigneeId: "mock-user-1",
    createdById: "mock-user-1",
    assignee: {
      id: "mock-user-1",
      name: "Demo User", 
      email: "demo@example.com",
      image: null,
    }
  },
  {
    id: "mock-task-3",
    sprintId: "mock-sprint-1",
    title: "Try Calendar Features 📅",
    description: "View your busy hours and schedule events in the calendar. Perfect for time management!",
    estimatedHours: 3,
    priority: 300000,
    tags: ["demo", "calendar"],
    labels: ["feature"],
    status: "REVIEW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assigneeId: "mock-user-1",
    createdById: "mock-user-1",
    assignee: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@example.com", 
      image: null,
    }
  },
  {
    id: "mock-task-4",
    sprintId: "mock-sprint-1",
    title: "Setup Your Account ✅",
    description: "Sign in to create your own sprints, tasks, and customize your workflow. This demo task will be replaced with your data!",
    estimatedHours: 1,
    priority: 200000,
    tags: ["setup", "account"],
    labels: ["important"],
    status: "DONE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assigneeId: "mock-user-1",
    createdById: "mock-user-1",
    assignee: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@example.com",
      image: null,
    }
  },
  {
    id: "mock-task-5",
    sprintId: "mock-sprint-2",
    title: "Personal Goal: Learn New Technology 🚀",
    description: "This is an example of a personal task in a CASUAL sprint. These can be scheduled 24/7!",
    estimatedHours: 8,
    priority: 100000,
    tags: ["personal", "learning"],
    labels: ["goal"],
    status: "TODO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assigneeId: "mock-user-1", 
    createdById: "mock-user-1",
    assignee: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@example.com",
      image: null,
    }
  }
];

// Mock SubTasks
export const mockSubTasks = [
  {
    id: "mock-subtask-1",
    taskId: "mock-task-1",
    title: "Read the documentation",
    isCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: "mock-user-1",
  },
  {
    id: "mock-subtask-2", 
    taskId: "mock-task-1",
    title: "Explore different views",
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: "mock-user-1",
  },
  {
    id: "mock-subtask-3",
    taskId: "mock-task-2",
    title: "Check auto-scheduling",
    isCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), 
    createdById: "mock-user-1",
  },
  {
    id: "mock-subtask-4",
    taskId: "mock-task-2",
    title: "View task dependencies",
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: "mock-user-1",
  }
];

// Mock Notes
export const mockNotes = [
  {
    id: "mock-note-1",
    taskId: "mock-task-1",
    content: "Welcome to ScheduleR! This is a demo note. You can add notes to track progress and important information.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: "mock-user-1",
    createdBy: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@example.com",
    }
  }
];

// Mock Busy Hours for Calendar
export const mockBusyHours = [
  {
    id: "mock-busy-1",
    title: "Team Meeting",
    startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    userId: "mock-user-1",
    categoryId: "mock-category-1",
    category: {
      id: "mock-category-1",
      name: "Meetings",
      color: "#3b82f6",
      userId: "mock-user-1",
    }
  },
  {
    id: "mock-busy-2",
    title: "Focus Time",
    startTime: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    userId: "mock-user-1",
    categoryId: "mock-category-2",
    category: {
      id: "mock-category-2", 
      name: "Deep Work",
      color: "#10b981",
      userId: "mock-user-1",
    }
  }
];

// Mock Busy Hour Categories
export const mockBusyHourCategories = [
  {
    id: "mock-category-1",
    name: "Meetings",
    color: "#3b82f6",
    userId: "mock-user-1",
  },
  {
    id: "mock-category-2",
    name: "Deep Work", 
    color: "#10b981",
    userId: "mock-user-1",
  },
  {
    id: "mock-category-3",
    name: "Personal",
    color: "#f59e0b",
    userId: "mock-user-1",
  }
];

// Helper function to get tasks for a specific sprint
export const getMockTasksBySprintId = (sprintId: string) => {
  return mockTasks.filter(task => task.sprintId === sprintId);
};

// Helper function to get tasks by status
export const getMockTasksByStatus = (status: string, sprintId?: string) => {
  let filteredTasks = mockTasks.filter(task => task.status === status);
  if (sprintId) {
    filteredTasks = filteredTasks.filter(task => task.sprintId === sprintId);
  }
  return filteredTasks;
};

// Helper function to get subtasks for a task
export const getMockSubTasksByTaskId = (taskId: string) => {
  return mockSubTasks.filter(subtask => subtask.taskId === taskId);
};

// Helper function to get notes for a task
export const getMockNotesByTaskId = (taskId: string) => {
  return mockNotes.filter(note => note.taskId === taskId);
};
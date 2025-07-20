/**
 * Widget Components Index
 * 
 * All 16 widgets organized by category for better maintainability
 */

// Progress tracking widgets (2)
export { default as SprintCompletionWidget } from './progress/SprintCompletionWidget';
export { default as SprintProgressWidget } from './progress/SprintProgressWidget';

// Task management widgets (3)
export { default as TaskSummaryWidget } from './tasks/TaskSummaryWidget';
export { default as TaskDistributionWidget } from './tasks/TaskDistributionWidget';
export { default as RecentActivityWidget } from './tasks/RecentActivityWidget';

// Time management widgets (3)
export { default as WorkHoursWidget } from './time/WorkHoursWidget';
export { default as HoursSummaryWidget } from './time/HoursSummaryWidget';
export { default as CalendarOverviewWidget } from './time/CalendarOverviewWidget';

// Analytics widgets (5)
export { default as ProgressChartWidget } from './analytics/ProgressChartWidget';
export { default as SprintHealthWidget } from './analytics/SprintHealthWidget';
export { default as VelocityWidget } from './analytics/VelocityWidget';
export { default as RiskAssessmentWidget } from './analytics/RiskAssessmentWidget';
export { default as BurndownChartWidget } from './analytics/BurndownChartWidget';

// Team management widgets (1)
export { default as TeamWorkloadWidget } from './team/TeamWorkloadWidget';

// External integration widgets (2)
export { default as CodeCommitsWidget } from './external/CodeCommitsWidget';
export { default as TeamCommunicationWidget } from './external/TeamCommunicationWidget';

// Widget configuration and types
export interface WidgetProps {
  className?: string;
}

export interface Task {
  id: string;
  status: string;
  estimatedHours?: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface BusyHour {
  id: string;
  startTime: string;
  endTime: string;
}
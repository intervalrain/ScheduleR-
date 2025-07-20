# Widget Components Organization

This directory organizes widget components by feature category for better maintainability and discoverability.

## Directory Structure

```
src/components/widgets/
├── progress/          # Sprint and project progress widgets
├── tasks/            # Task management and tracking widgets  
├── time/             # Time tracking and hour management widgets
├── analytics/        # Charts, reports, and analytics widgets
├── team/             # Team collaboration and workload widgets
├── external/         # External service integration widgets
└── index.ts          # Central export file
```

## Data Source Categories

Widgets are marked with their data source type:

- **🟢 Real Data**: Uses live API data (e.g., `/api/tasks`, `/api/user/busy-hours`)
- **🔵 Calculated**: Computed from real data (e.g., progress percentages, time calculations)  
- **🟠 Mock**: Uses placeholder/demo data (needs real implementation)

## Widget Categories

### Progress (`/progress/`) - 2 widgets
- **SprintCompletionWidget** 🔵 - Sprint time progress tracking (completion-rate)
- **SprintProgressWidget** 🔵 - Days elapsed/remaining display (sprint-progress)

### Tasks (`/tasks/`) - 3 widgets
- **TaskSummaryWidget** 🟢 - Task completion overview (task-summary)
- **TaskDistributionWidget** 🔵 - Task completion percentages (task-distribution)
- **RecentActivityWidget** 🟠 - Activity tracking (recent-activity)

### Time (`/time/`) - 3 widgets
- **WorkHoursWidget** 🟢 - Available vs busy hours (work-hours)
- **HoursSummaryWidget** 🟢 - Total estimated hours (hours-summary)
- **CalendarOverviewWidget** 🟢 - Time blocks in sprint (calendar-overview)

### Analytics (`/analytics/`) - 5 widgets
- **ProgressChartWidget** 🟢 - Task status breakdown (progress-chart)
- **SprintHealthWidget** 🟠 - Overall sprint health indicator (sprint-health)
- **VelocityWidget** 🟠 - Sprint velocity metrics (velocity)
- **RiskAssessmentWidget** 🟠 - Sprint risk analysis (risk-assessment)
- **BurndownChartWidget** 🟠 - Work remaining over time (burndown-chart)

### Team (`/team/`) - 1 widget
- **TeamWorkloadWidget** 🟠 - Member task distribution (team-workload)

### External (`/external/`) - 2 widgets
- **CodeCommitsWidget** 🟠 - GitHub/GitLab integration (code-commits)
- **TeamCommunicationWidget** 🟠 - Chat/comments integration (team-communication)

## Usage Example

```tsx
import { TaskSummaryWidget, SprintCompletionWidget } from '@/components/widgets';

// In your dashboard component
<TaskSummaryWidget tasks={tasks} />
<SprintCompletionWidget 
  sprintStartDate={sprint.startDate} 
  sprintEndDate={sprint.endDate} 
/>
```

## Contributing

When adding new widgets:

1. Choose the appropriate category directory
2. Create the widget component with proper TypeScript interfaces
3. Add JSDoc comments indicating data source type
4. Export the widget in the category's index file
5. Update the main `index.ts` file
6. Update this README if adding new categories
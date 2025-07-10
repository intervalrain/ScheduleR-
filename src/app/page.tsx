export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Welcome to ScheduleR</h1>
      <p className="text-muted-foreground">
        Manage your sprints, tasks, and team collaboration in one place.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="task-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Recent Tasks</h3>
          <p className="text-sm text-muted-foreground">
            View and manage your recent tasks
          </p>
        </div>
        
        <div className="task-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Sprint Overview</h3>
          <p className="text-sm text-muted-foreground">
            Track your current sprint progress
          </p>
        </div>
        
        <div className="task-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Team Activity</h3>
          <p className="text-sm text-muted-foreground">
            See what your team is working on
          </p>
        </div>
      </div>
    </div>
  );
}
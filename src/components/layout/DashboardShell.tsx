import { Sidebar } from "./Sidebar";
import { Topnav } from "./Topnav";

interface DashboardShellProps {
  userName: string;
  userRole: string;
  title: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, userRole, title, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-[var(--bg-base)]">
      <Sidebar userName={userName} userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topnav title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

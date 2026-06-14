import { Sidebar } from './Sidebar'
import { PageHeader } from '../shared/PageHeader'

export function AppLayout({ children, currentPath, role, employee, onNavigate, onLogout, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Sidebar currentPath={currentPath} role={role} employee={employee} onNavigate={onNavigate} />
      <div className="md:ml-[220px] min-h-screen">
        <main className="p-6">
          <PageHeader title={title} subtitle={subtitle} onLogout={onLogout} />
          {children}
        </main>
      </div>
    </div>
  )
}

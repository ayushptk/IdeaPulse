import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex selection:bg-indigo-500/30">
      <Sidebar />
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

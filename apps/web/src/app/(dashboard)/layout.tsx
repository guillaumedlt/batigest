import BottomNav from '@/components/layout/bottom-nav';
import Sidebar from '@/components/layout/sidebar';
import FAB from '@/components/layout/fab';
import TopBar from '@/components/layout/top-bar';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex overflow-x-hidden max-w-[100vw]">
      {/* Sidebar — desktop uniquement */}
      <Sidebar />

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 lg:h-screen min-w-0">
        {/* Top bar — desktop uniquement */}
        <TopBar />

        {/* Contenu — scroll independant sur desktop */}
        <main className="flex-1 pb-20 lg:pb-6 pt-4 lg:pt-6 px-4 lg:px-8 max-w-6xl w-full mx-auto overflow-x-hidden lg:overflow-y-auto">
          {children}
        </main>
      </div>

      {/* FAB — mobile uniquement */}
      <FAB />

      {/* Bottom nav — mobile uniquement */}
      <BottomNav />
    </div>
  );
}

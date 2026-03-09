import BottomNav from '@/components/layout/bottom-nav';
import FAB from '@/components/layout/fab';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenu principal avec padding pour la bottom nav */}
      <main className="pb-20 pt-4 px-4 max-w-lg mx-auto">
        {children}
      </main>

      <FAB />
      <BottomNav />
    </div>
  );
}

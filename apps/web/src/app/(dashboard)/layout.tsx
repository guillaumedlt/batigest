import BottomNav from '@/components/layout/bottom-nav';
import Sidebar from '@/components/layout/sidebar';
import FAB from '@/components/layout/fab';
import TopBar from '@/components/layout/top-bar';
import VoiceButton from '@/components/voice/voice-button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop uniquement */}
      <Sidebar />

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar — desktop uniquement */}
        <TopBar />

        {/* Contenu */}
        <main className="flex-1 pb-20 lg:pb-6 pt-4 lg:pt-6 px-4 lg:px-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* FAB — mobile uniquement */}
      <FAB />

      {/* Voice button — mobile uniquement */}
      <VoiceButton />

      {/* Bottom nav — mobile uniquement */}
      <BottomNav />
    </div>
  );
}

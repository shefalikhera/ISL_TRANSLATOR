import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ISLChatbot from "@/components/ISLChatbot";
import { useLang } from "@/contexts/LangContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 bg-card/60 backdrop-blur-xl px-4 gap-3 shrink-0 relative z-20">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-sm font-black text-primary-foreground tracking-tighter">B</span>
              </div>
              <span className="font-black text-foreground text-lg tracking-tight">Beyond</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <ISLChatbot />
    </SidebarProvider>
  );
}

import { Home, Languages, Hand, MapPin, MessageCircle, Settings, GraduationCap, History, LogIn } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import ThemeToggle from "@/components/ThemeToggle";
import { useLang } from "@/contexts/LangContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { en: "Dashboard", hi: "डैशबोर्ड", url: "/", icon: Home },
  { en: "Text/Speech → ISL", hi: "टेक्स्ट/स्पीच → ISL", url: "/text-to-isl", icon: Languages },
  { en: "isl-text/speech", hi: "ISL → टेक्स्ट/स्पीच", url: "/isl-to-text", icon: Hand },
  { en: "Tutors", hi: "ट्यूटर", url: "/tutors", icon: GraduationCap },
  { en: "Word History", hi: "शब्द इतिहास", url: "/history", icon: History },
  { en: "Places", hi: "स्थान", url: "/places", icon: MapPin },
  { en: "Help", hi: "सहायता", url: "/help", icon: MessageCircle },
  { en: "Settings", hi: "सेटिंग्स", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { t } = useLang();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {!collapsed && (
          <div className="px-4 py-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
              <span className="text-lg font-black text-primary-foreground tracking-tighter">B</span>
            </div>
            <div>
              <h2 className="font-black text-sidebar-foreground text-lg leading-none tracking-tight">Beyond</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("ISL Platform", "ISL प्लेटफ़ॉर्म")}</p>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{t("Navigation", "नेविगेशन")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{t(item.en, item.hi)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("Account", "खाता")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/auth" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-semibold">
                    <LogIn className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{t("Sign In", "साइन इन")}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className={`flex ${collapsed ? "justify-center" : "justify-between items-center"}`}>
          {!collapsed && <span className="text-xs text-muted-foreground">{t("Theme", "थीम")}</span>}
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

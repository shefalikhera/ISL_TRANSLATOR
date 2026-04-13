import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/contexts/LangContext";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import TextToISL from "./pages/TextToISL";
import ISLToText from "./pages/ISLToText";
import Places from "./pages/Places";
import Help from "./pages/Help";
import SettingsPage from "./pages/SettingsPage";
import Tutors from "./pages/Tutors";
import WordHistory from "./pages/WordHistory";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LangProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/text-to-isl" element={<TextToISL />} />
              <Route path="/isl-to-text" element={<ISLToText />} />
              <Route path="/places" element={<Places />} />
              <Route path="/help" element={<Help />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/tutors" element={<Tutors />} />
              <Route path="/history" element={<WordHistory />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </LangProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

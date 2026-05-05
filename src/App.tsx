import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthPage } from "@/features/auth";
import { ChatPage } from "@/features/chat";
import { AdminPage } from "@/features/admin";
import { ReportPage } from "@/features/report";
import { DiaryPage } from "@/features/diary";
import Activities from "./pages/Activities";
import Blog from "./pages/Blog";
import ProAccess from "./pages/ProAccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/pro-access" element={<ProAccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

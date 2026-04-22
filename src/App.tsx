import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CavemenProvider } from "@/contexts/CavemenContext";
import { MainNav } from "@/components/MainNav";
import Index from "./pages/Index";
import A2UIDemo from "./pages/A2UIDemo";
import Dashboard from "./pages/Dashboard";
import WikiPage from "./pages/WikiPage";
import FileUploadPage from "./pages/FileUploadPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CavemenProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MainNav />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/a2ui-demo" element={<A2UIDemo />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/upload" element={<FileUploadPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CavemenProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

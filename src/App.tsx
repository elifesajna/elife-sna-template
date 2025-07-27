
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import Index from './pages/Index';
import AddAgents from './pages/AddAgents';
import ViewHierarchy from './pages/ViewHierarchy';
import MemberTaskManagement from './pages/MemberTaskManagement';
import PanchayathNotes from './pages/PanchayathNotes';
import NotFound from './pages/NotFound';

import MembersLogin from './pages/MembersLogin';
import MemberDashboard from './pages/MemberDashboard';
import { AuthProvider } from './components/AuthProvider';
import { AdminAuthProvider } from './components/AdminAuthProvider';
import AdminPanel from './pages/AdminPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AuthProvider>
          <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/add-agents" element={<AddAgents />} />
              <Route path="/view-hierarchy" element={<ViewHierarchy />} />
              <Route path="/task-management" element={<MemberTaskManagement />} />
              <Route path="/panchayath-notes" element={<PanchayathNotes />} />
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route path="/members" element={<MembersLogin />} />
              <Route path="/member-dashboard" element={<MemberDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
          </BrowserRouter>
        </AuthProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

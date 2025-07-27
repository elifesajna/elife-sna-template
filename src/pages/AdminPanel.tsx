import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminAuthProvider, useAdminAuth } from "@/components/AdminAuthProvider";
import AdminLogin from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";
import UserManagement from "@/components/UserManagement";
import MemberApprovals from "@/components/MemberApprovals";
import TeamManagement from "@/components/TeamManagement";
import EnhancedTaskManagement from "@/components/EnhancedTaskManagement";
import PanchayathManagement from "@/components/PanchayathManagement";
import AdminPermissions from "@/components/AdminPermissions";
import AdminReports from "@/components/AdminReports";
import AdminNotifications from "@/components/AdminNotifications";
import AdminSettings from "@/components/AdminSettings";

const AdminPanelContent = () => {
  const { adminUser, logout } = useAdminAuth();

  if (!adminUser) {
    return <AdminLogin />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="font-medium text-gray-900">{adminUser.username}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {adminUser.role}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Link to="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/approvals" element={<MemberApprovals />} />
              <Route path="/teams" element={<TeamManagement />} />
              <Route path="/tasks" element={<EnhancedTaskManagement />} />
              <Route path="/panchayaths" element={<PanchayathManagement />} />
              <Route path="/permissions" element={<AdminPermissions />} />
              <Route path="/reports" element={<AdminReports />} />
              <Route path="/notifications" element={<AdminNotifications />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AdminPanel = () => {
  return (
    <AdminAuthProvider>
      <AdminPanelContent />
    </AdminAuthProvider>
  );
};

export default AdminPanel;
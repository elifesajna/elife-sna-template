import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Bell, 
  UserCheck, 
  LogOut, 
  Shield,
  Phone,
  Building2
} from "lucide-react";

// Import all admin components
import { AdminDashboard } from "@/components/AdminDashboard";
import UserManagement from "@/components/UserManagement";
import TeamManagement from "@/components/TeamManagement";
import AdminReports from "@/components/AdminReports";
import AdminNotifications from "@/components/AdminNotifications";
import AdminPermissions from "@/components/AdminPermissions";
import AdminSettings from "@/components/AdminSettings";
import UserApprovals from "@/components/UserApprovals";

interface AgentAdminPanelProps {
  mobileNumber: string;
  teamData: any;
  onLogout: () => void;
}

const AgentAdminPanel: React.FC<AgentAdminPanelProps> = ({ 
  mobileNumber, 
  teamData, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    onLogout();
  };

  const adminTabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      component: <AdminDashboard /> 
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users, 
      component: <UserManagement /> 
    },
    { 
      id: 'teams', 
      label: 'Team Management', 
      icon: Building2, 
      component: <TeamManagement /> 
    },
    { 
      id: 'approvals', 
      label: 'User Approvals', 
      icon: UserCheck, 
      component: <UserApprovals /> 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: BarChart3, 
      component: <AdminReports /> 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell, 
      component: <AdminNotifications /> 
    },
    { 
      id: 'permissions', 
      label: 'Permissions', 
      icon: Shield, 
      component: <AdminPermissions /> 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      component: <AdminSettings /> 
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-semibold">Agent Admin Panel</h1>
              <p className="text-sm text-muted-foreground">
                Team Management System
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              <span className="font-medium">{mobileNumber}</span>
              {teamData?.management_team && (
                <Badge variant="secondary">
                  {teamData.management_team.team_name}
                </Badge>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {adminTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-xs"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {adminTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>
                    Manage {tab.label.toLowerCase()} for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tab.component}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default AgentAdminPanel;
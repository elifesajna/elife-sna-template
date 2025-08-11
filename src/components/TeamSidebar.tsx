import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  Users, 
  Building2, 
  CheckSquare, 
  BarChart3,
  FileText,
  Bell,
  Calendar,
  UserCheck,
  ClipboardList
} from "lucide-react";
import { useAuth } from "./AuthProvider";

const teamMenuItems = [
  { title: "Dashboard", url: "/team-dashboard", icon: BarChart3 },
  { title: "Team Tasks", url: "/team-tasks", icon: CheckSquare },
  { title: "Task Management", url: "/team-task-management", icon: ClipboardList },
  { title: "Team Members", url: "/team-members", icon: Users },
  { title: "Panchayaths", url: "/team-panchayaths", icon: Building2 },
  { title: "Reports", url: "/team-reports", icon: FileText },
  { title: "Activity Log", url: "/team-activity", icon: Calendar },
  { title: "Notifications", url: "/team-notifications", icon: Bell },
  { title: "Member Approvals", url: "/team-approvals", icon: UserCheck },
];

export function TeamSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, isTeamUser } = useAuth();

  if (!user || !isTeamUser) {
    return null;
  }

  const isActive = (path: string) => currentPath === path;

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className="w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Team Panel</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {teamMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClass}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
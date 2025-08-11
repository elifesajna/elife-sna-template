import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut, Users, CheckSquare, BarChart3, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { TeamNotifications } from "@/components/TeamNotifications";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeamSidebar } from "@/components/TeamSidebar";

const TeamDashboard = () => {
  const { user, logout, isTeamUser } = useAuth();

  if (!user || !isTeamUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. Please log in with team credentials.</p>
            <Link to="/team-login">
              <Button className="mt-4">Go to Team Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamUser = user as any; // Type assertion since we know it's a team user
  const isGuest = user.role === 'guest';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 to-blue-100">
        <TeamSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <Link to="/">
                  <Button variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Welcome,</p>
                    <p className="font-medium">{isGuest ? teamUser.username : teamUser.teamName}</p>
                    <p className="text-sm text-gray-500">Mobile: {teamUser.mobileNumber}</p>
                    {isGuest && teamUser.panchayath && (
                      <p className="text-sm text-gray-500">{teamUser.panchayath.name}, {teamUser.panchayath.district}</p>
                    )}
                  </div>
                  <Button variant="outline" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                {isGuest ? `Guest Dashboard - ${teamUser.username}` : `Team Dashboard - ${teamUser.teamName}`}
              </h1>
              <p className="text-gray-600">Access your team features and manage tasks</p>
            </div>

            <div className="grid gap-6">
              {/* Quick Access Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Link to="/team-task-management">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <CheckSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium">Task Management</h3>
                      <p className="text-sm text-muted-foreground">Manage team tasks</p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/team-reports">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium">Reports</h3>
                      <p className="text-sm text-muted-foreground">View team reports</p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/team-activity">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium">Activity Log</h3>
                      <p className="text-sm text-muted-foreground">Track activities</p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/team-members">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium">Team Members</h3>
                      <p className="text-sm text-muted-foreground">View team members</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <TeamNotifications 
                teamId={isGuest ? 'guest' : teamUser.teamId}
                teamName={isGuest ? teamUser.username : teamUser.teamName}
                mobileNumber={teamUser.mobileNumber}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                  <CardDescription>
                    Your current team access details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{isGuest ? 'Username' : 'Team Name'}</h3>
                      <p className="text-gray-600">{isGuest ? teamUser.username : teamUser.teamName}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Registered Mobile</h3>
                      <p className="text-gray-600">{teamUser.mobileNumber}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Access Level</h3>
                      <p className="text-gray-600">{isGuest ? 'Guest User' : 'Team Member'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Login Time</h3>
                      <p className="text-gray-600">{new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TeamDashboard;
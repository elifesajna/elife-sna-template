import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Users, Calendar, Clock, MapPin, Phone, Mail, LogOut, Home, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PersonalTaskCard from "@/components/PersonalTaskCard";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'normal';
  due_date?: string;
  assigned_to?: string;
  team_id?: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  management_teams?: {
    name: string;
    description?: string;
  };
}

export default function MemberDashboard() {
  const [memberUser, setMemberUser] = useState<any>(null);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in as member
    const storedUser = localStorage.getItem('member_user');
    if (!storedUser) {
      navigate('/members');
      return;
    }

    const user = JSON.parse(storedUser);
    setMemberUser(user);
    fetchData(user);
  }, [navigate]);

  const fetchData = async (user: any) => {
    try {
      setLoading(true);

      // First get agent data, then fetch personal tasks
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('phone', user.mobileNumber)
        .maybeSingle();

      let personalTasksData = [];
      if (agentData && !agentError) {
        // Fetch personal tasks (tasks assigned to this agent ID)
        const { data: tasksData, error: personalError } = await supabase
          .from('tasks')
          .select('*')
          .eq('allocated_to_agent', agentData.id)
          .order('created_at', { ascending: false });

        if (personalError) throw personalError;
        personalTasksData = tasksData || [];
      } else {
        // Also try with mobile number as fallback
        const { data: tasksData, error: personalError } = await supabase
          .from('tasks')
          .select('*')
          .eq('allocated_to_agent', user.mobileNumber)
          .order('created_at', { ascending: false });

        if (!personalError) {
          personalTasksData = tasksData || [];
        }
      }

      setPersonalTasks(personalTasksData || []);

      // Check team memberships for this agent (reuse agentData from above)

      let teamMemberData = [];
      if (agentData && !agentError) {
        const { data: teamMemberQueryData, error: teamMemberError } = await supabase
          .from('management_team_members')
          .select(`
            *,
            management_teams(name, description)
          `)
          .eq('agent_id', agentData.id);

        if (teamMemberError) throw teamMemberError;
        teamMemberData = teamMemberQueryData || [];
      }

      setTeamMemberships(teamMemberData);

      // Fetch team tasks if user is a team member
      if (teamMemberData && teamMemberData.length > 0) {
        const teamIds = teamMemberData.map(tm => tm.team_id);
        
        const { data: teamTasksData, error: teamTasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('allocated_to_team', teamIds[0]) // For now, just check first team
          .order('created_at', { ascending: false });

        if (teamTasksError) throw teamTasksError;
        setTeamTasks(teamTasksData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('member_user');
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingPersonalTasks = personalTasks.filter(task => task.status === 'pending');
  const completedPersonalTasks = personalTasks.filter(task => task.status === 'completed');

  if (!memberUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please log in as a member to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/members">
              <Button className="mt-4">Go to Members Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Member Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">{memberUser.name}</span>
                <Badge variant="secondary">{memberUser.agent?.role}</Badge>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Mobile:</span>
                <span className="font-medium">{memberUser.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Panchayath:</span>
                <span className="font-medium">{memberUser.agent?.panchayaths?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{memberUser.agent?.role}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Teams:</span>
                <span className="font-medium">{teamMemberships.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Tasks ({pendingPersonalTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Tasks ({completedPersonalTasks.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Personal Tasks</CardTitle>
                <CardDescription>
                  Tasks specifically assigned to you that need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPersonalTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pending personal tasks found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPersonalTasks.map((task) => (
                      <PersonalTaskCard 
                        key={task.id} 
                        task={task} 
                        onTaskUpdate={() => fetchData(memberUser)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed Personal Tasks</CardTitle>
                <CardDescription>
                  Your completed tasks with completion details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedPersonalTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No completed personal tasks found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedPersonalTasks.map((task) => (
                      <PersonalTaskCard 
                        key={task.id} 
                        task={task} 
                        onTaskUpdate={() => fetchData(memberUser)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Tasks</CardTitle>
                <CardDescription>
                  Tasks assigned to teams you are a member of
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamMemberships.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      You are not a team member. Contact your administrator to be added to a team.
                    </AlertDescription>
                  </Alert>
                ) : teamTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No team tasks found.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Team Memberships */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Your Teams:</h4>
                      <div className="flex flex-wrap gap-2">
                        {teamMemberships.map((membership) => (
                          <Badge key={membership.id} variant="outline">
                            {membership.management_teams?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Team Tasks */}
                    <div className="space-y-4">
                      {teamTasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(task.status)}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-gray-600 mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

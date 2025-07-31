import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Users, Calendar, Clock, MapPin, Phone, Mail, LogOut, Home, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PersonalTaskCard from "@/components/PersonalTaskCard";
import TeamTaskCard from "@/components/TeamTaskCard";

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
  agents?: {
    name: string;
    phone?: string;
    role?: string;
  };
}

interface TaskRemark {
  id: string;
  task_id: string;
  remark: string;
  updated_by?: string;
  created_at: string;
}

export default function MemberDashboard() {
  const [memberUser, setMemberUser] = useState<any>(null);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMember[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [taskRemarks, setTaskRemarks] = useState<TaskRemark[]>([]);
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

      // Fetch team tasks and related info if user is a team member
      if (teamMemberData && teamMemberData.length > 0) {
        const teamIds = teamMemberData.map(tm => tm.team_id);
        
        // Fetch team tasks
        const { data: teamTasksData, error: teamTasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('allocated_to_team', teamIds[0]) // For now, just check first team
          .order('created_at', { ascending: false });

        if (teamTasksError) throw teamTasksError;
        setTeamTasks(teamTasksData || []);

        // Fetch all team members for the teams this user belongs to
        const { data: allTeamMembersData, error: allTeamMembersError } = await supabase
          .from('management_team_members')
          .select(`
            *,
            management_teams(name, description),
            agents(name, phone, role)
          `)
          .in('team_id', teamIds);

        if (allTeamMembersError) throw allTeamMembersError;
        setAllTeamMembers(allTeamMembersData || []);

        // Fetch task remarks for team tasks
        if (teamTasksData && teamTasksData.length > 0) {
          const taskIds = teamTasksData.map(task => task.id);
          const { data: remarksData, error: remarksError } = await supabase
            .from('task_remarks')
            .select('*')
            .in('task_id', taskIds)
            .order('created_at', { ascending: false });

          if (remarksError) throw remarksError;
          setTaskRemarks(remarksData || []);
        }
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Member Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <span className="font-medium text-gray-900 text-sm sm:text-base">{memberUser.name}</span>
                <Badge variant="secondary" className="text-xs">{memberUser.agent?.role}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Home
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Task Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Task Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-sm text-yellow-600">Pending Personal Tasks</div>
                    <div className="text-2xl font-bold text-yellow-800">{pendingPersonalTasks.length}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600">Completed Personal Tasks</div>
                    <div className="text-2xl font-bold text-green-800">{completedPersonalTasks.length}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600">Team Tasks</div>
                    <div className="text-2xl font-bold text-blue-800">{teamTasks.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="personal" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Personal Tasks</span>
              <span className="sm:hidden">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Team Tasks</span>
              <span className="sm:hidden">Team</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4 sm:mt-6">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Pending ({pendingPersonalTasks.length})</span>
                  <span className="sm:hidden">Pending ({pendingPersonalTasks.length})</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Completed ({completedPersonalTasks.length})</span>
                  <span className="sm:hidden">Done ({completedPersonalTasks.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingPersonalTasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.description || 'No description'}</TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(task.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedPersonalTasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.description || 'No description'}</TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(task.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="team" className="mt-4 sm:mt-6">
            {teamMemberships.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Team Tasks</CardTitle>
                  <CardDescription>
                    You are not a Team Member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription>
                      You are not a team member. Contact your administrator to be added to a team.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Team Tasks</CardTitle>
                  <CardDescription>
                    Tasks assigned to teams you are a member of
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teamTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No team tasks found.
                  </div>
                  ) : (
                    <div className="space-y-6">
                       {/* Team Members Info */}
                       <div className="mb-6">
                         <h4 className="font-medium mb-3">Team Members:</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                           {allTeamMembers.map((member) => (
                             <div key={member.id} className="bg-gray-50 p-3 rounded-lg">
                               <div className="font-medium">{member.agents?.name}</div>
                               <div className="text-sm text-gray-600">{member.agents?.phone}</div>
                               <div className="text-xs text-gray-500">{member.agents?.role}</div>
                               <Badge variant="outline" className="mt-1 text-xs">
                                 {member.management_teams?.name}
                               </Badge>
                             </div>
                           ))}
                         </div>
                       </div>

                       {/* Team Tasks */}
                       <div className="overflow-x-auto">
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead>Title</TableHead>
                               <TableHead>Description</TableHead>
                               <TableHead>Priority</TableHead>
                               <TableHead>Due Date</TableHead>
                               <TableHead>Status</TableHead>
                               <TableHead>Created</TableHead>
                               <TableHead>Remarks</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {teamTasks.map((task) => (
                               <TableRow key={task.id}>
                                 <TableCell className="font-medium">{task.title}</TableCell>
                                 <TableCell className="max-w-xs truncate">{task.description || 'No description'}</TableCell>
                                 <TableCell>
                                   <Badge className={getPriorityColor(task.priority)}>
                                     {task.priority}
                                   </Badge>
                                 </TableCell>
                                 <TableCell>
                                   {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                 </TableCell>
                                 <TableCell>
                                   <Badge className={getStatusColor(task.status)}>
                                     {task.status}
                                   </Badge>
                                 </TableCell>
                                 <TableCell>
                                   {new Date(task.created_at).toLocaleDateString()}
                                 </TableCell>
                                 <TableCell>
                                   <div className="space-y-1">
                                     {taskRemarks
                                       .filter(remark => remark.task_id === task.id)
                                       .map((remark) => (
                                         <div key={remark.id} className="bg-blue-50 p-2 rounded text-xs">
                                           <div className="font-medium">{remark.updated_by}</div>
                                           <div className="text-gray-700">{remark.remark}</div>
                                           <div className="text-xs text-gray-500">
                                             {new Date(remark.created_at).toLocaleDateString()}
                                           </div>
                                         </div>
                                       ))}
                                     {taskRemarks.filter(remark => remark.task_id === task.id).length === 0 && (
                                       <span className="text-gray-400 text-xs">No remarks</span>
                                     )}
                                   </div>
                                 </TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                         </Table>
                       </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

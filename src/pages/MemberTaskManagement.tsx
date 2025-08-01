import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckSquare, Clock, CheckCircle, AlertCircle, Eye, Plus, ListTodo, UserCheck, CircleDot } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddTaskForm } from '@/components/AddTaskForm';
import { useAuth } from '@/components/AuthProvider';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  due_date?: string;
  assigned_to?: string;
  created_by?: string;
}

const MemberTaskManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUserTasks();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      // Check if user is admin
      if (user && (user.role === 'super_admin' || user.role === 'local_admin' || user.role === 'user_admin')) {
        setIsTeamMember(true);
        return;
      }

      // Check if user is a team member
      if (user && user.role === 'team_member') {
        setIsTeamMember(true);
        return;
      }

      // Check if member user is part of any team
      const memberUser = localStorage.getItem('member_user');
      if (memberUser) {
        const userData = JSON.parse(memberUser);
        
        // Get agent ID for this member
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('id')
          .eq('phone', userData.mobileNumber)
          .single();

        if (agentData && !agentError) {
          // Check if this agent is part of any management team
          const { data: teamMemberData, error: teamError } = await supabase
            .from('management_team_members')
            .select('team_id')
            .eq('agent_id', agentData.id)
            .single();

          if (teamMemberData && !teamError) {
            setIsTeamMember(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchUserTasks = async () => {
    try {
      // Get current member user from localStorage
      const memberUser = localStorage.getItem('member_user');
      if (!memberUser) {
        toast({
          title: "Error",
          description: "Please login as a member to view tasks",
          variant: "destructive",
        });
        return;
      }

      const userData = JSON.parse(memberUser);
      
      // Get agent ID for this member
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('phone', userData.mobileNumber)
        .single();

      if (agentError || !agentData) {
        console.error('Error finding agent:', agentError);
        setTasks([]);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('allocated_to_agent', agentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <AlertCircle className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter tasks by status
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const renderTasksTable = (taskList: Task[], emptyMessage: string) => {
    if (taskList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Mobile View */}
        <div className="block md:hidden">
          {taskList.map((task) => (
            <Card key={task.id} className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Created: {formatDate(task.created_at)}</div>
                    {task.due_date && (
                      <div>Due: {formatDate(task.due_date)}</div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedTask(task)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>
                    {task.due_date ? formatDate(task.due_date) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(task.created_at)}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedTask(task)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">ടാസ്ക് മാനേജ്മെൻ്റ്</h1>
            <p className="text-muted-foreground mt-2">Manage your tasks efficiently</p>
          </div>
          
          {isTeamMember && (
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <AddTaskForm />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  All ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pendingTasks.length})
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <CircleDot className="h-4 w-4" />
                  In Progress ({inProgressTasks.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      All Tasks
                    </CardTitle>
                    <CardDescription>
                      Complete overview of all your tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Loading tasks...</div>
                    ) : (
                      renderTasksTable(tasks, "No tasks found")
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Pending Tasks
                    </CardTitle>
                    <CardDescription>
                      Tasks waiting to be started
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Loading pending tasks...</div>
                    ) : (
                      renderTasksTable(pendingTasks, "No pending tasks")
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CircleDot className="h-5 w-5" />
                      In Progress Tasks
                    </CardTitle>
                    <CardDescription>
                      Tasks currently being worked on
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Loading in progress tasks...</div>
                    ) : (
                      renderTasksTable(inProgressTasks, "No tasks in progress")
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Completed Tasks
                    </CardTitle>
                    <CardDescription>
                      Successfully finished tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Loading completed tasks...</div>
                    ) : (
                      renderTasksTable(completedTasks, "No completed tasks")
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Task Details Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTask ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                    </div>
                    
                    {selectedTask.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm mt-1">{selectedTask.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <div className="mt-1">{getPriorityBadge(selectedTask.priority)}</div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                      <p className="text-sm mt-1">{formatDate(selectedTask.created_at)}</p>
                    </div>

                    {selectedTask.due_date && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                        <p className="text-sm mt-1">{formatDate(selectedTask.due_date)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a task to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberTaskManagement;
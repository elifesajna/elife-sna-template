import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    fetchUserTasks();
  }, []);

  const fetchUserTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please login to view tasks",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">ടാസ്ക് മാനേജ്മെൻ്റ്</h1>
          <p className="text-muted-foreground mt-2">View and manage your assigned tasks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Your Tasks ({tasks.length})
                </CardTitle>
                <CardDescription>
                  Tasks assigned to you or created by you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mobile View */}
                    <div className="block md:hidden">
                      {tasks.map((task) => (
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
                          {tasks.map((task) => (
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
                )}
              </CardContent>
            </Card>
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
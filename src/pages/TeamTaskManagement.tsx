import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckSquare, Eye, CheckCircle, XCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'normal';
  due_date?: string;
  allocated_to_team?: string;
  allocated_to_agent?: string;
  created_at: string;
}

interface TaskRemark {
  id: string;
  task_id: string;
  remark: string;
  updated_by?: string;
  created_at: string;
}

export default function TeamTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false);
  const [isViewRemarksDialogOpen, setIsViewRemarksDialogOpen] = useState(false);
  const [existingRemarks, setExistingRemarks] = useState<TaskRemark[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'completed' | 'cancelled' | null>(null);
  
  const { toast } = useToast();
  const { user, isTeamUser } = useAuth();

  useEffect(() => {
    if (user && isTeamUser) {
      fetchTasks();
    }
  }, [user, isTeamUser]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Get team tasks and individual tasks
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`allocated_to_team.eq.${(user as any)?.teamId},allocated_to_agent.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(tasksData || []);
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

  const openRemarksDialog = (task: Task, status?: 'completed' | 'cancelled') => {
    setSelectedTask(task);
    setPendingStatus(status || null);
    setIsRemarksDialogOpen(true);
  };

  const fetchTaskRemarks = async (task: Task) => {
    try {
      const { data, error } = await supabase
        .from('task_remarks')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingRemarks(data || []);
      setSelectedTask(task);
      setIsViewRemarksDialogOpen(true);
    } catch (error) {
      console.error('Error fetching remarks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch task remarks",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (task: Task, newStatus: 'completed' | 'cancelled') => {
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      if (remarks.trim()) {
        const { error: remarkError } = await supabase
          .from('task_remarks')
          .insert({
            task_id: task.id,
            remark: remarks.trim(),
            updated_by: (user as any)?.teamName || (user as any)?.username
          });

        if (remarkError) {
          console.error('Error adding remark:', remarkError);
        }
      }

      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      });
      
      setIsRemarksDialogOpen(false);
      setRemarks('');
      setPendingStatus(null);
      setSelectedTask(null);
      
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  if (!user || !isTeamUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. Please log in with team credentials.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-primary" />
            Team Task Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track team tasks
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Tasks</CardTitle>
          <CardDescription>
            All tasks assigned to your team and available tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {task.description || 'No description'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => fetchTaskRemarks(task)}
                            title="View Remarks"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {task.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openRemarksDialog(task, 'completed')}
                                title="Mark as Completed"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openRemarksDialog(task, 'cancelled')}
                                title="Mark as Cancelled"
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remarks Dialog */}
      <Dialog open={isRemarksDialogOpen} onOpenChange={setIsRemarksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'completed' ? 'Complete Task' : 'Cancel Task'}
            </DialogTitle>
            <DialogDescription>
              Add remarks for {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks about this task..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRemarksDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedTask && pendingStatus && handleStatusChange(selectedTask, pendingStatus)}
                className={pendingStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {pendingStatus === 'completed' ? 'Complete Task' : 'Cancel Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Remarks Dialog */}
      <Dialog open={isViewRemarksDialogOpen} onOpenChange={setIsViewRemarksDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Remarks</DialogTitle>
            <DialogDescription>
              Remarks for: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {existingRemarks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No remarks found for this task.</p>
            ) : (
              existingRemarks.map((remark) => (
                <div key={remark.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{remark.updated_by || 'Unknown'}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(remark.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{remark.remark}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CheckCircle, XCircle, MessageSquare, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'normal';
  due_date?: string;
  created_at: string;
}

interface TeamTaskCardProps {
  task: Task;
  onTaskUpdate: () => void;
  canModify?: boolean; // Whether the user can modify team tasks
}

const TeamTaskCard: React.FC<TeamTaskCardProps> = ({ task, onTaskUpdate, canModify = false }) => {
  const [remarks, setRemarks] = React.useState('');
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = React.useState(false);
  const [isViewRemarksDialogOpen, setIsViewRemarksDialogOpen] = React.useState(false);
  const [isEditRemarksDialogOpen, setIsEditRemarksDialogOpen] = React.useState(false);
  const [existingRemarks, setExistingRemarks] = React.useState<any[]>([]);
  const [pendingStatus, setPendingStatus] = React.useState<'completed' | 'cancelled' | null>(null);
  const [editingRemark, setEditingRemark] = React.useState<any>(null);
  const { toast } = useToast();

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

  const handleStatusChange = async (newStatus: 'completed' | 'cancelled') => {
    try {
      console.log('Updating team task status:', { taskId: task.id, status: newStatus, remarks });
      
      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      // Add remarks if provided
      if (remarks.trim()) {
        const memberUser = JSON.parse(localStorage.getItem('member_user') || '{}');
        const { error: remarkError } = await supabase
          .from('task_remarks')
          .insert({
            task_id: task.id,
            remark: remarks.trim(),
            updated_by: memberUser.name || memberUser.mobileNumber
          });

        if (remarkError) {
          console.error('Error adding remark:', remarkError);
          // Don't throw here, as the main task update succeeded
        }
      }

      toast({
        title: "Success",
        description: `Team task marked as ${newStatus}`,
      });
      
      setIsRemarksDialogOpen(false);
      setRemarks('');
      setPendingStatus(null);
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating team task:', error);
      toast({
        title: "Error",
        description: "Failed to update team task status",
        variant: "destructive",
      });
    }
  };

  const openRemarksDialog = (status: 'completed' | 'cancelled') => {
    setPendingStatus(status);
    setIsRemarksDialogOpen(true);
  };

  const fetchTaskRemarks = async () => {
    try {
      const { data, error } = await supabase
        .from('task_remarks')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingRemarks(data || []);
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

  const handleEditRemark = (remark: any) => {
    setEditingRemark(remark);
    setRemarks(remark.remark);
    setIsEditRemarksDialogOpen(true);
  };

  const handleUpdateRemark = async () => {
    if (!editingRemark) return;
    
    try {
      const { error } = await supabase
        .from('task_remarks')
        .update({ 
          remark: remarks.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRemark.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Remark updated successfully",
      });
      
      setIsEditRemarksDialogOpen(false);
      setRemarks('');
      setEditingRemark(null);
      fetchTaskRemarks();
    } catch (error) {
      console.error('Error updating remark:', error);
      toast({
        title: "Error",
        description: "Failed to update remark",
        variant: "destructive",
      });
    }
  };

  const handleAddRemark = async () => {
    if (!remarks.trim()) return;
    
    try {
      const memberUser = JSON.parse(localStorage.getItem('member_user') || '{}');
      const { error } = await supabase
        .from('task_remarks')
        .insert({
          task_id: task.id,
          remark: remarks.trim(),
          updated_by: memberUser.name || memberUser.mobileNumber
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Remark added successfully",
      });
      
      setIsRemarksDialogOpen(false);
      setRemarks('');
      fetchTaskRemarks();
    } catch (error) {
      console.error('Error adding remark:', error);
      toast({
        title: "Error",
        description: "Failed to add remark",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
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
      
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
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

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchTaskRemarks}
          className="flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          View Remarks
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setRemarks('');
            setIsRemarksDialogOpen(true);
          }}
          className="flex items-center gap-1"
        >
          <MessageSquare className="h-4 w-4" />
          Add Remark
        </Button>
        
        {canModify && task.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => openRemarksDialog('completed')}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => openRemarksDialog('cancelled')}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Remarks Dialog */}
      <Dialog open={isRemarksDialogOpen} onOpenChange={setIsRemarksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {pendingStatus === 'completed' ? 'Complete Team Task' : 
               pendingStatus === 'cancelled' ? 'Cancel Team Task' : 'Add Remark'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus ? 'Add remarks about this team task (optional)' : 'Add a remark to this team task'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter any comments or remarks about this team task..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRemarksDialogOpen(false);
                  setRemarks('');
                  setPendingStatus(null);
                }}
              >
                Cancel
              </Button>
              {pendingStatus ? (
                <Button
                  onClick={() => pendingStatus && handleStatusChange(pendingStatus)}
                  className={pendingStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                  variant={pendingStatus === 'completed' ? 'default' : 'destructive'}
                >
                  {pendingStatus === 'completed' ? 'Complete Task' : 'Cancel Task'}
                </Button>
              ) : (
                <Button 
                  onClick={handleAddRemark}
                  disabled={!remarks.trim()}
                >
                  Add Remark
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Remarks Dialog */}
      <Dialog open={isViewRemarksDialogOpen} onOpenChange={setIsViewRemarksDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Team Task Remarks
            </DialogTitle>
            <DialogDescription>
              View all remarks and comments for this team task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {existingRemarks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No remarks found for this team task.</p>
            ) : (
              existingRemarks.map((remark, index) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {remark.updated_by && (
                        <Badge variant="secondary" className="text-xs">
                          {remark.updated_by}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(remark.created_at).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditRemark(remark)}
                        className="h-6 px-2 text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-700">{remark.remark}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsViewRemarksDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Remark Dialog */}
      <Dialog open={isEditRemarksDialogOpen} onOpenChange={setIsEditRemarksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Edit Remark
            </DialogTitle>
            <DialogDescription>
              Update the remark for this team task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-remarks">Remark</Label>
              <Textarea
                id="edit-remarks"
                placeholder="Enter your remark..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditRemarksDialogOpen(false);
                  setRemarks('');
                  setEditingRemark(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRemark}>
                Update Remark
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TeamTaskCard;
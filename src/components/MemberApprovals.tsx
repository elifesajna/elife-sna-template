import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserCheck, UserX, Eye, Trash2, Users, Phone, MapPin, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MemberRegistration {
  id: string;
  username: string;
  mobile_number: string;
  panchayath_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  panchayaths?: {
    name: string;
    district?: string;
    state?: string;
  };
}

const MemberApprovals = () => {
  const [registrations, setRegistrations] = useState<MemberRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<MemberRegistration | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch registrations from database
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      console.log('Fetching member registrations...');
      
      const { data, error } = await supabase
        .from('user_registration_requests')
        .select(`
          *,
          panchayaths(name, district, state)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        throw error;
      }

      console.log('Fetched registrations:', data);
      setRegistrations(data || []);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch member registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    fetchRegistrations();
    
    console.log('Setting up realtime subscription for user_registration_requests...');
    
    // Create realtime subscription
    const channel = supabase
      .channel('member-approvals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_registration_requests'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              console.log('New registration added:', payload.new);
              setRegistrations(prev => [payload.new as MemberRegistration, ...prev]);
              toast({
                title: "New Registration",
                description: "A new member registration has been submitted",
              });
              break;
              
            case 'UPDATE':
              console.log('Registration updated:', payload.new);
              setRegistrations(prev => 
                prev.map(reg => 
                  reg.id === payload.new.id 
                    ? { ...payload.new as MemberRegistration, panchayaths: reg.panchayaths }
                    : reg
                )
              );
              break;
              
            case 'DELETE':
              console.log('Registration deleted:', payload.old);
              setRegistrations(prev => 
                prev.filter(reg => reg.id !== payload.old.id)
              );
              toast({
                title: "Registration Deleted",
                description: "A member registration has been removed",
              });
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (registrationId: string) => {
    try {
      setProcessingAction(registrationId);
      console.log('Approving registration:', registrationId);
      
      const { error } = await supabase
        .from('user_registration_requests')
        .update({ 
          status: 'approved',
          approved_by: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (error) {
        console.error('Error approving registration:', error);
        throw error;
      }

      console.log('Registration approved successfully');
      toast({
        title: "Success",
        description: "Member registration approved successfully",
      });
    } catch (error) {
      console.error('Failed to approve registration:', error);
      toast({
        title: "Error",
        description: "Failed to approve member registration",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (registrationId: string) => {
    try {
      setProcessingAction(registrationId);
      console.log('Rejecting registration:', registrationId);
      
      const { error } = await supabase
        .from('user_registration_requests')
        .update({ 
          status: 'rejected',
          approved_by: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (error) {
        console.error('Error rejecting registration:', error);
        throw error;
      }

      console.log('Registration rejected successfully');
      toast({
        title: "Success",
        description: "Member registration rejected",
      });
    } catch (error) {
      console.error('Failed to reject registration:', error);
      toast({
        title: "Error",
        description: "Failed to reject member registration",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDelete = async (registrationId: string) => {
    try {
      setProcessingAction(registrationId);
      console.log('Deleting registration:', registrationId);
      
      const { error } = await supabase
        .from('user_registration_requests')
        .delete()
        .eq('id', registrationId);

      if (error) {
        console.error('Error deleting registration:', error);
        throw error;
      }

      console.log('Registration deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      
      toast({
        title: "Success",
        description: "Member registration deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete registration:', error);
      toast({
        title: "Error",
        description: "Failed to delete member registration",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleViewDetails = (registration: MemberRegistration) => {
    setSelectedRegistration(registration);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (registrationId: string) => {
    setDeletingId(registrationId);
    setIsDeleteDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const refreshData = () => {
    fetchRegistrations();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          Loading member registrations...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle>Member Approvals</CardTitle>
                <CardDescription>
                  Review and manage member registration requests ({registrations.length} total)
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No member registrations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Panchayath</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">
                        {registration.username}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {registration.mobile_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {registration.panchayaths?.name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(registration.status)}>
                          {registration.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(registration.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(registration)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {registration.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(registration.id)}
                                disabled={processingAction === registration.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(registration.id)}
                                disabled={processingAction === registration.id}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(registration.id)}
                            disabled={processingAction === registration.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Member Registration Details</DialogTitle>
            <DialogDescription>
              Complete information about the registration request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{selectedRegistration.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={getStatusVariant(selectedRegistration.status)}>
                    {selectedRegistration.status}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Mobile:</span>
                <span>{selectedRegistration.mobile_number}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Panchayath:</span>
                <span>{selectedRegistration.panchayaths?.name}</span>
              </div>

              {selectedRegistration.panchayaths?.district && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">District:</span>
                  <span>{selectedRegistration.panchayaths.district}</span>
                </div>
              )}

              {selectedRegistration.panchayaths?.state && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">State:</span>
                  <span>{selectedRegistration.panchayaths.state}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Registered:</span>
                <span>{new Date(selectedRegistration.created_at).toLocaleString()}</span>
              </div>

              {selectedRegistration.approved_by && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Processed by:</span>
                  <span>{selectedRegistration.approved_by}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this member registration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={processingAction === deletingId}
            >
              {processingAction === deletingId ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MemberApprovals;
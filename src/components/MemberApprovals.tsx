import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserCheck, UserX, Eye, Trash2, Users, Phone, MapPin } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MemberRegistration {
  id: string;
  username: string;
  mobile_number: string;
  panchayath_id: string;
  status: string;
  created_at: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
    
    // Real-time subscription
    const channel = supabase
      .channel('member-registrations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_registrations'
        },
        () => {
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_registration_requests')
        .select(`
          *,
          panchayaths(name, district, state)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch member registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('user_registration_requests')
        .update({ status: 'approved' })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member registration approved successfully",
      });
    } catch (error) {
      console.error('Error approving registration:', error);
      toast({
        title: "Error",
        description: "Failed to approve member registration",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('user_registration_requests')
        .update({ status: 'rejected' })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member registration rejected",
      });
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast({
        title: "Error",
        description: "Failed to reject member registration",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('user_registration_requests')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member registration deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: "Error",
        description: "Failed to delete member registration",
        variant: "destructive",
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading member registrations...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Approvals
          </CardTitle>
          <CardDescription>
            Review and manage member registration requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No member registrations found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Role</TableHead>
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
                    <TableCell>{registration.mobile_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Member
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {registration.panchayaths?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(registration.status)}>
                        {registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(registration.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(registration.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(registration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="font-medium">{selectedRegistration.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedRegistration.status)}>
                    {selectedRegistration.status}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Mobile:</span>
                <span>{selectedRegistration.mobile_number}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Panchayath:</span>
                <span>{selectedRegistration.panchayaths?.name}</span>
              </div>

              {selectedRegistration.panchayaths?.district && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">District:</span>
                  <span>{selectedRegistration.panchayaths.district}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Registered:</span>
                <span>{new Date(selectedRegistration.created_at).toLocaleString()}</span>
              </div>
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
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MemberApprovals;
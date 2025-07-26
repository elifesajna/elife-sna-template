import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Users, Edit, Trash2, UserPlus } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  team_password?: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'coordinator' | 'supervisor' | 'group-leader' | 'pro';
  panchayath_id: string;
}

interface Panchayath {
  id: string;
  name: string;
  district?: string;
  state?: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  agents?: Agent;
}

const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [searchAgent, setSearchAgent] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [manualMemberData, setManualMemberData] = useState({
    name: '',
    phone: '',
    panchayath_id: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_password: '',
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Real-time subscription
    const channel = supabase
      .channel('team-management')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'management_teams'
        },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'management_team_members'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('management_teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('name');

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // Fetch panchayaths
      const { data: panchayathsData, error: panchayathsError } = await supabase
        .from('panchayaths')
        .select('*')
        .order('name');

      if (panchayathsError) throw panchayathsError;
      setPanchayaths(panchayathsData || []);

      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from('management_team_members')
        .select(`
          *,
          agents(id, name, phone, email, role, panchayath_id)
        `);

      if (membersError) throw membersError;
      setTeamMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTeam) {
        // Update team
        const { error } = await supabase
          .from('management_teams')
          .update({
            name: formData.name,
            description: formData.description,
            team_password: formData.team_password,
            is_active: formData.is_active,
          })
          .eq('id', editingTeam.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Team updated successfully",
        });
      } else {
        // Create new team
        const { error } = await supabase
          .from('management_teams')
          .insert([{
            name: formData.name,
            description: formData.description,
            team_password: formData.team_password,
            is_active: formData.is_active,
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Team created successfully",
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Error",
        description: "Failed to save team",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const { error } = await supabase
        .from('management_teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      team_password: '',
      is_active: true,
    });
    setEditingTeam(null);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      team_password: team.team_password || '',
      is_active: team.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleAddMember = async (teamId: string) => {
    setSelectedTeamForMembers(teamId);
    setIsMemberDialogOpen(true);
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let agentId = selectedAgent;
      
      // If no agent selected, create a manual member
      if (!selectedAgent && manualMemberData.name) {
        const { data: newAgent, error: agentError } = await supabase
          .from('agents')
          .insert({
            name: manualMemberData.name,
            phone: manualMemberData.phone,
            role: 'coordinator',
            panchayath_id: manualMemberData.panchayath_id || panchayaths[0]?.id || '',
          })
          .select()
          .single();

        if (agentError) throw agentError;
        agentId = newAgent.id;
      }

      if (!agentId) {
        toast({
          title: "Error",
          description: "Please select an agent or provide manual details",
          variant: "destructive",
        });
        return;
      }

      // Add member to team
      const teamId = selectedTeam || selectedTeamForMembers;
      const { error } = await supabase
        .from('management_team_members')
        .insert([{
          team_id: teamId,
          agent_id: agentId,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member added successfully",
      });

      setIsMemberDialogOpen(false);
      setSelectedAgent('');
      setSearchAgent('');
      setSelectedTeam('');
      setManualMemberData({
        name: '',
        phone: '',
        panchayath_id: '',
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('management_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const getTeamMembers = (teamId: string) => {
    return teamMembers.filter(member => member.team_id === teamId);
  };

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage teams and their settings
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No teams found. Create your first team!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant={team.is_active ? "default" : "secondary"}>
                    {team.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {team.description && (
                  <CardDescription>{team.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Team Password: {team.team_password ? 'Set' : 'Not Set'}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(team.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Team Members:</div>
                  {getTeamMembers(team.id).length > 0 ? (
                    <div className="space-y-1">
                      {getTeamMembers(team.id).map((member) => (
                        <div key={member.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <span>{member.agents?.name || 'Unknown'}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No members added</div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMember(team.id)}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(team)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </DialogTitle>
            <DialogDescription>
              {editingTeam ? 'Update team information' : 'Add a new management team'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_password">Team Password</Label>
              <Input
                id="team_password"
                type="password"
                value={formData.team_password}
                onChange={(e) => setFormData({ ...formData, team_password: e.target.value })}
                placeholder="Set a password for team access"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTeam ? 'Update' : 'Create'} Team
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select an existing agent or add a new member manually
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleMemberSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="existing-agent">Select Existing Agent</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search and select an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search by name or mobile..."
                        value={searchAgent}
                        onChange={(e) => setSearchAgent(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {agents
                        .filter(agent => 
                          agent.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
                          (agent.phone && agent.phone.includes(searchAgent))
                        )
                        .map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} - {agent.role} ({agent.phone || 'No phone'})
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team (Optional)</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-sm text-gray-500 my-4">
              OR
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="text-sm font-medium">Add New Member Manually</div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-name">Name</Label>
                <Input
                  id="manual-name"
                  value={manualMemberData.name}
                  onChange={(e) => setManualMemberData({ ...manualMemberData, name: e.target.value })}
                  placeholder="Enter member name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-phone">Phone</Label>
                <Input
                  id="manual-phone"
                  value={manualMemberData.phone}
                  onChange={(e) => setManualMemberData({ ...manualMemberData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-panchayath">Panchayath</Label>
                <Select 
                  value={manualMemberData.panchayath_id} 
                  onValueChange={(value) => setManualMemberData({ ...manualMemberData, panchayath_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select panchayath" />
                  </SelectTrigger>
                  <SelectContent>
                    {panchayaths.map((panchayath) => (
                      <SelectItem key={panchayath.id} value={panchayath.id}>
                        {panchayath.name} {panchayath.district && `- ${panchayath.district}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
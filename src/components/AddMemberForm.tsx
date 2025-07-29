import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Search } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'coordinator' | 'supervisor' | 'group-leader' | 'pro';
  panchayath_id: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface Panchayath {
  id: string;
  name: string;
  district?: string;
  state?: string;
}

interface AddMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId?: string;
  onMemberAdded: () => void;
}

export const AddMemberForm = ({ isOpen, onClose, selectedTeamId, onMemberAdded }: AddMemberFormProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>(selectedTeamId || '');
  const [searchAgent, setSearchAgent] = useState('');
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    phone: '',
    role: 'pro' as Agent['role'],
    panchayath_id: '',
    team_id: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTeamId) {
      setSelectedTeam(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchData = async () => {
    try {
      const [teamsRes, agentsRes, panchayathsRes] = await Promise.all([
        supabase.from('management_teams').select('*').order('name'),
        supabase.from('agents').select('*').order('name'),
        supabase.from('panchayaths').select('*').order('name')
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (agentsRes.error) throw agentsRes.error;
      if (panchayathsRes.error) throw panchayathsRes.error;

      setTeams(teamsRes.data || []);
      setAgents(agentsRes.data || []);
      setPanchayaths(panchayathsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let agentId = selectedAgent;
      
      // If creating new member
      if (activeTab === 'new' && newMemberData.name) {
        const { data: newAgent, error: agentError } = await supabase
          .from('agents')
          .insert({
            name: newMemberData.name,
            phone: newMemberData.phone,
            role: newMemberData.role,
            panchayath_id: newMemberData.panchayath_id || panchayaths[0]?.id || '',
          })
          .select()
          .single();

        if (agentError) throw agentError;
        agentId = newAgent.id;

        toast({
          title: "Success",
          description: "New agent created successfully",
        });
      }

      if (!agentId) {
        toast({
          title: "Error",
          description: "Please select an agent or provide new member details",
          variant: "destructive",
        });
        return;
      }

      const teamToUse = activeTab === 'new' ? newMemberData.team_id : selectedTeam;
      if (!teamToUse) {
        toast({
          title: "Error",
          description: "Please select a team",
          variant: "destructive",
        });
        return;
      }

      // Add member to team
      const { error } = await supabase
        .from('management_team_members')
        .insert([{
          team_id: teamToUse,
          agent_id: agentId,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member added successfully",
      });

      onMemberAdded();
      handleClose();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAgent('');
    setSearchAgent('');
    setSelectedTeam(selectedTeamId || '');
    setNewMemberData({
      name: '',
      phone: '',
      role: 'pro',
      panchayath_id: '',
      team_id: '',
    });
    setActiveTab('existing');
    onClose();
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
    (agent.phone && agent.phone.includes(searchAgent)) ||
    (agent.email && agent.email.toLowerCase().includes(searchAgent.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Add an existing agent or create a new team member
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'existing' | 'new')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing Agent</TabsTrigger>
              <TabsTrigger value="new">New Member</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <TabsContent value="existing" className="space-y-4 mt-0">
                {/* Team Selection for Existing Agent */}
                <div className="space-y-2">
                  <Label htmlFor="team-select">Select Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <div className="max-h-60 overflow-y-auto">
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                            {team.description && ` - ${team.description}`}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Existing Agent</CardTitle>
                    <CardDescription>
                      Search and select from existing agents in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent-select">Select Agent</Label>
                      <Select value={selectedAgent} onValueChange={setSelectedAgent} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Search and choose an agent..." />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          <div className="p-2 border-b sticky top-0 bg-background">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search by name or mobile number..."
                                value={searchAgent}
                                onChange={(e) => setSearchAgent(e.target.value)}
                                className="pl-10"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {filteredAgents.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No agents found matching your search
                              </div>
                            ) : (
                              filteredAgents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{agent.name}</span>
                                    <span className="text-sm text-gray-500">
                                      {agent.role} + team member • {agent.phone || 'No phone'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create New Member</CardTitle>
                    <CardDescription>
                      Add a new member who doesn't exist in the system yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Full Name</Label>
                        <Input
                          id="new-name"
                          value={newMemberData.name}
                          onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                          placeholder="Enter full name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-phone">Phone Number</Label>
                        <Input
                          id="new-phone"
                          value={newMemberData.phone}
                          onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-team">Select Team</Label>
                        <Select 
                          value={newMemberData.team_id} 
                          onValueChange={(value) => setNewMemberData({ ...newMemberData, team_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a team" />
                          </SelectTrigger>
                          <SelectContent className="z-50">
                            <div className="max-h-60 overflow-y-auto">
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                  {team.description && ` - ${team.description}`}
                                </SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="new-panchayath">Panchayath</Label>
                        <Select 
                          value={newMemberData.panchayath_id} 
                          onValueChange={(value) => setNewMemberData({ ...newMemberData, panchayath_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select panchayath" />
                          </SelectTrigger>
                          <SelectContent className="z-50">
                            <div className="max-h-60 overflow-y-auto">
                              {panchayaths.map((panchayath) => (
                                <SelectItem key={panchayath.id} value={panchayath.id}>
                                  {panchayath.name}
                                  {panchayath.district && ` - ${panchayath.district}`}
                                  {panchayath.state && `, ${panchayath.state}`}
                                </SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
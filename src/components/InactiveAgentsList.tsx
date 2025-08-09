import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserX, Phone, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface InactiveAgent {
  id: string;
  name: string;
  phone: string;
  role: string;
  lastActivity: string | null;
}

interface InactiveAgentsListProps {
  isOpen: boolean;
  onClose: () => void;
  panchayathId: string;
  panchayathName: string;
  selectedRole: string;
}

const InactiveAgentsList: React.FC<InactiveAgentsListProps> = ({
  isOpen,
  onClose,
  panchayathId,
  panchayathName,
  selectedRole
}) => {
  const [inactiveAgents, setInactiveAgents] = useState<InactiveAgent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInactiveAgents = async () => {
    if (!panchayathId || !selectedRole) return;
    
    setLoading(true);
    try {
      const threeDaysAgo = subDays(new Date(), 3);
      
      // Convert role name to match database enum
      let dbRole = selectedRole.toLowerCase();
      if (dbRole === 'group leader') {
        dbRole = 'group_leader';
      }
      
      // Fetch agents of the selected role in this panchayath
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, phone, role')
        .eq('panchayath_id', panchayathId)
        .eq('role', dbRole as any);

      if (agentsError) throw agentsError;

      const inactiveResults: InactiveAgent[] = [];

      // Check each agent's activity in the last 3 days
      for (const agent of agents || []) {
        const { data: recentActivity, error: activityError } = await supabase
          .from('daily_activities')
          .select('activity_date')
          .eq('agent_id', agent.id)
          .gte('activity_date', format(threeDaysAgo, 'yyyy-MM-dd'))
          .order('activity_date', { ascending: false })
          .limit(1);

        if (activityError) {
          console.error('Error checking agent activity:', activityError);
          continue;
        }

        // If no recent activity, this agent is inactive
        if (!recentActivity || recentActivity.length === 0) {
          // Get last activity date
          const { data: lastActivity } = await supabase
            .from('daily_activities')
            .select('activity_date')
            .eq('agent_id', agent.id)
            .order('activity_date', { ascending: false })
            .limit(1);

          inactiveResults.push({
            id: agent.id,
            name: agent.name,
            phone: agent.phone || 'N/A',
            role: agent.role,
            lastActivity: lastActivity?.[0]?.activity_date || null
          });
        }
      }

      setInactiveAgents(inactiveResults);
    } catch (error) {
      console.error('Error fetching inactive agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && panchayathId && selectedRole) {
      fetchInactiveAgents();
    }
  }, [isOpen, panchayathId, selectedRole]);

  const getDaysSinceLastActivity = (lastActivity: string | null) => {
    if (!lastActivity) return null;
    const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Inactive {selectedRole} - {panchayathName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading inactive agents...</div>
        ) : inactiveAgents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All {selectedRole.toLowerCase()} agents are active! 🎉
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {inactiveAgents.length} inactive {selectedRole.toLowerCase()} agents (no activity in last 3 days)
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveAgents.map((agent) => {
                  const daysSince = getDaysSinceLastActivity(agent.lastActivity);
                  return (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {agent.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          Inactive
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {agent.lastActivity ? (
                            <div className="text-sm">
                              <div>{format(new Date(agent.lastActivity), 'MMM dd, yyyy')}</div>
                              <div className="text-xs text-muted-foreground">
                                {daysSince !== null && `${daysSince} days ago`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No activity recorded</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InactiveAgentsList;
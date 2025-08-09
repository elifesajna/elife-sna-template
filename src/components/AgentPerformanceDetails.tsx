import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface RolePerformance {
  role: string;
  totalAgents: number;
  activeAgents: number;
  performancePercentage: number;
}

interface AgentPerformanceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  panchayathId: string;
  panchayathName: string;
}

const AgentPerformanceDetails: React.FC<AgentPerformanceDetailsProps> = ({
  isOpen,
  onClose,
  panchayathId,
  panchayathName
}) => {
  const [rolePerformance, setRolePerformance] = useState<RolePerformance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRolePerformance = async () => {
    if (!panchayathId) return;
    
    setLoading(true);
    try {
      const threeDaysAgo = subDays(new Date(), 3);
      
      // Fetch all agents in this panchayath grouped by role
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, role')
        .eq('panchayath_id', panchayathId);

      if (agentsError) throw agentsError;

      // Group agents by role
      const roleGroups = agents?.reduce((acc, agent) => {
        if (!acc[agent.role]) {
          acc[agent.role] = [];
        }
        acc[agent.role].push(agent);
        return acc;
      }, {} as Record<string, typeof agents>) || {};

      const rolePerformanceResults: RolePerformance[] = [];

      // Calculate performance for each role
      for (const [role, roleAgents] of Object.entries(roleGroups)) {
        const totalAgents = roleAgents.length;
        let activeAgents = 0;

        // Check each agent's activity in the last 3 days
        for (const agent of roleAgents) {
          const { data: recentActivity, error: activityError } = await supabase
            .from('daily_activities')
            .select('id')
            .eq('agent_id', agent.id)
            .gte('activity_date', format(threeDaysAgo, 'yyyy-MM-dd'))
            .limit(1);

          if (activityError) {
            console.error('Error checking agent activity:', activityError);
            continue;
          }

          if (recentActivity && recentActivity.length > 0) {
            activeAgents++;
          }
        }

        const performancePercentage = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;

        rolePerformanceResults.push({
          role: role.charAt(0).toUpperCase() + role.slice(1),
          totalAgents,
          activeAgents,
          performancePercentage
        });
      }

      setRolePerformance(rolePerformanceResults);
    } catch (error) {
      console.error('Error fetching role performance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && panchayathId) {
      fetchRolePerformance();
    }
  }, [isOpen, panchayathId]);

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (percentage >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'coordinator':
        return '👑';
      case 'supervisor':
        return '👥';
      case 'group_leader':
        return '🏆';
      default:
        return '👤';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Details - {panchayathName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading role performance data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {rolePerformance.map((role) => (
              <Card key={role.role} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{getRoleIcon(role.role)}</span>
                    {role.role}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Agents</span>
                    </div>
                    <span className="font-semibold">{role.activeAgents}/{role.totalAgents}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Performance</span>
                    <div className="flex items-center gap-2">
                      {getPerformanceBadge(role.performancePercentage)}
                      <span className="font-semibold">{role.performancePercentage}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        role.performancePercentage >= 80
                          ? 'bg-green-500'
                          : role.performancePercentage >= 60
                          ? 'bg-yellow-500'
                          : role.performancePercentage >= 40
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${role.performancePercentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && rolePerformance.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No agents found in this panchayath
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentPerformanceDetails;
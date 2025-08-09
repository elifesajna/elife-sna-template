import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Users, Eye, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import AgentPerformanceDetails from "./AgentPerformanceDetails";

interface AgentPerformanceData {
  panchayathId: string;
  panchayathName: string;
  coordinatorName: string;
  coordinatorPhone: string;
  totalAgents: number;
  activeAgents: number;
  performancePercentage: number;
}

const AdminReports = () => {
  const [performanceData, setPerformanceData] = useState<AgentPerformanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPanchayath, setSelectedPanchayath] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const fetchAgentPerformance = async () => {
    setLoading(true);
    try {
      // Get current month boundaries
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const threeDaysAgo = subDays(now, 3);

      // Fetch panchayaths with coordinators
      const { data: panchayaths, error: panchayathError } = await supabase
        .from('panchayaths')
        .select(`
          id,
          name,
          agents!inner(
            id,
            name,
            phone,
            role
          )
        `)
        .eq('agents.role', 'coordinator');

      if (panchayathError) throw panchayathError;

      const performanceResults: AgentPerformanceData[] = [];

      for (const panchayath of panchayaths || []) {
        // Get coordinator for this panchayath
        const coordinator = panchayath.agents?.[0];
        if (!coordinator) continue;

        // Get all agents in this panchayath
        const { data: allAgents, error: agentsError } = await supabase
          .from('agents')
          .select('id, name')
          .eq('panchayath_id', panchayath.id);

        if (agentsError) throw agentsError;

        const totalAgents = allAgents?.length || 0;
        let activeAgents = 0;

        // Check each agent's activity in the last 3 days
        for (const agent of allAgents || []) {
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

        performanceResults.push({
          panchayathId: panchayath.id,
          panchayathName: panchayath.name,
          coordinatorName: coordinator.name,
          coordinatorPhone: coordinator.phone || 'N/A',
          totalAgents,
          activeAgents,
          performancePercentage
        });
      }

      setPerformanceData(performanceResults);
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agent performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentPerformance();
  }, []);

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (percentage >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports & Analytics
          </CardTitle>
          <CardDescription>
            Generate and view system reports
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Agent Performance
          </CardTitle>
          <CardDescription>
            Panchayath-wise agent performance based on daily activity updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Performance calculated based on agents active in the last 3 days
            </div>
            <Button onClick={fetchAgentPerformance} disabled={loading}>
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading performance data...</div>
          ) : performanceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No panchayaths with coordinators found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Panchayath Name</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Agents Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((item) => (
                  <TableRow key={item.panchayathId}>
                    <TableCell className="font-medium">{item.panchayathName}</TableCell>
                    <TableCell>{item.coordinatorName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {item.coordinatorPhone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{item.activeAgents}/{item.totalAgents}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPerformanceBadge(item.performancePercentage)}
                        <span className="text-sm">{item.performancePercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setSelectedPanchayath({ id: item.panchayathId, name: item.panchayathName })}
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AgentPerformanceDetails
        isOpen={!!selectedPanchayath}
        onClose={() => setSelectedPanchayath(null)}
        panchayathId={selectedPanchayath?.id || ''}
        panchayathName={selectedPanchayath?.name || ''}
      />
    </div>
  );
};

export default AdminReports;
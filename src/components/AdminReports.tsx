import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Users, Eye, Phone, RefreshCw } from "lucide-react";
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
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchAgentPerformance = useCallback(async (useCache = true) => {
    const CACHE_KEY = 'agent_performance_data';
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    
    // Check localStorage cache first
    if (useCache) {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setPerformanceData(data);
            setLastFetched(new Date(timestamp));
            return;
          }
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    }

    setLoading(true);
    try {
      const threeDaysAgo = subDays(new Date(), 3);
      const threeDaysAgoStr = format(threeDaysAgo, 'yyyy-MM-dd');

      // Optimized query: Get all data in fewer queries
      const { data: panchayathsWithCoordinators, error: panchayathError } = await supabase
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

      // Get all agents and their recent activities in batch
      const panchayathIds = panchayathsWithCoordinators?.map(p => p.id) || [];
      
      const [agentsResponse, activitiesResponse] = await Promise.all([
        supabase
          .from('agents')
          .select('id, name, panchayath_id')
          .in('panchayath_id', panchayathIds),
        
        supabase
          .from('daily_activities')
          .select('agent_id')
          .gte('activity_date', threeDaysAgoStr)
      ]);

      if (agentsResponse.error) throw agentsResponse.error;
      if (activitiesResponse.error) throw activitiesResponse.error;

      // Create lookup sets for performance
      const activeAgentIds = new Set(activitiesResponse.data?.map(a => a.agent_id) || []);
      const agentsByPanchayath = (agentsResponse.data || []).reduce((acc, agent) => {
        if (!acc[agent.panchayath_id]) acc[agent.panchayath_id] = [];
        acc[agent.panchayath_id].push(agent);
        return acc;
      }, {} as Record<string, typeof agentsResponse.data>);

      // Calculate performance for each panchayath
      const performanceResults: AgentPerformanceData[] = (panchayathsWithCoordinators || []).map(panchayath => {
        const coordinator = panchayath.agents?.[0];
        const agents = agentsByPanchayath[panchayath.id] || [];
        const totalAgents = agents.length;
        const activeAgents = agents.filter(agent => activeAgentIds.has(agent.id)).length;
        const performancePercentage = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;

        return {
          panchayathId: panchayath.id,
          panchayathName: panchayath.name,
          coordinatorName: coordinator?.name || 'N/A',
          coordinatorPhone: coordinator?.phone || 'N/A',
          totalAgents,
          activeAgents,
          performancePercentage
        };
      }).filter(result => result.coordinatorName !== 'N/A');

      setPerformanceData(performanceResults);
      const now = new Date();
      setLastFetched(now);
      
      // Cache the results
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: performanceResults,
        timestamp: now.getTime()
      }));
      
      toast({
        title: "Success",
        description: "Performance data updated successfully",
      });
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
  }, [toast]);

  useEffect(() => {
    fetchAgentPerformance(true);
  }, [fetchAgentPerformance]);

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
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Performance calculated based on agents active in the last 3 days
              </div>
              {lastFetched && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {format(lastFetched, 'PPp')}
                </div>
              )}
            </div>
            <Button onClick={() => fetchAgentPerformance(false)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading performance data...</div>
          ) : performanceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No panchayaths with coordinators found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {performanceData.map((item) => (
                <Card 
                  key={item.panchayathId}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary"
                  onClick={() => setSelectedPanchayath({ id: item.panchayathId, name: item.panchayathName })}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg mb-2">{item.panchayathName}</h3>
                        <div className="flex items-center justify-center">
                          {getPerformanceBadge(item.performancePercentage)}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {item.performancePercentage}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Performance Score
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.performancePercentage >= 80
                              ? 'bg-green-500'
                              : item.performancePercentage >= 60
                              ? 'bg-yellow-500'
                              : item.performancePercentage >= 40
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${item.performancePercentage}%` }}
                        />
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-center">
                        Click to view details
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
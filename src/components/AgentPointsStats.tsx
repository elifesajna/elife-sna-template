import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, Download, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AgentStats {
  id: string;
  name: string;
  phone: string;
  role: string;
  panchayath: string;
  district: string;
  state: string;
  totalPoints: number;
  totalActivities: number;
  lastActivity: string;
}

export default function AgentPointsStats() {
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<AgentStats[]>([]);
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    panchayath: '',
    role: '',
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'group-leader', label: 'Group Leader' },
    { value: 'pro', label: 'Pro' }
  ];

  useEffect(() => {
    fetchPanchayaths();
    fetchAgentStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [agentStats, filters]);

  const getRolePoints = (role: string): number => {
    const saved = localStorage.getItem('agent_point_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      const setting = settings.find((s: any) => s.role === role);
      return setting?.points_per_activity || 1;
    }
    
    switch (role) {
      case 'coordinator': return 5;
      case 'supervisor': return 3;
      case 'group-leader': return 2;
      case 'pro': return 1;
      default: return 1;
    }
  };

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from('panchayaths')
        .select('*')
        .order('name');

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error) {
      console.error('Error fetching panchayaths:', error);
    }
  };

  const fetchAgentStats = async () => {
    setIsLoading(true);
    try {
      // Get all agents with their panchayath details
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          phone,
          role,
          panchayath_id
        `)
        .order('name');

      if (agentsError) throw agentsError;

      // Get panchayath details separately
      const panchayathIds = [...new Set(agents.map(agent => agent.panchayath_id))];
      const { data: panchayathData, error: panchayathError } = await supabase
        .from('panchayaths')
        .select('id, name, district, state')
        .in('id', panchayathIds);

      if (panchayathError) throw panchayathError;

      // Create a map for quick lookup
      const panchayathMap = new Map(panchayathData.map(p => [p.id, p]));

      // Get activity counts for each agent
      const statsPromises = agents.map(async (agent) => {
        const panchayath = panchayathMap.get(agent.panchayath_id);
        const pointsPerActivity = getRolePoints(agent.role);

        // Count total activities based on date filter
        let query = supabase
          .from('daily_activities')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id);

        if (filters.startDate) {
          query = query.gte('activity_date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('activity_date', filters.endDate);
        }

        const { count: totalActivities } = await query;

        // Get last activity date
        const { data: lastActivityData } = await supabase
          .from('daily_activities')
          .select('activity_date')
          .eq('agent_id', agent.id)
          .order('activity_date', { ascending: false })
          .limit(1);

        return {
          id: agent.id,
          name: agent.name,
          phone: agent.phone || '',
          role: agent.role,
          panchayath: panchayath?.name || '',
          district: panchayath?.district || '',
          state: panchayath?.state || '',
          totalPoints: (totalActivities || 0) * pointsPerActivity,
          totalActivities: totalActivities || 0,
          lastActivity: lastActivityData?.[0]?.activity_date || 'Never'
        };
      });

      const stats = await Promise.all(statsPromises);
      setAgentStats(stats.sort((a, b) => b.totalPoints - a.totalPoints));

    } catch (error) {
      console.error('Error fetching agent stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agent statistics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...agentStats];

    if (filters.panchayath) {
      filtered = filtered.filter(agent => agent.panchayath === filters.panchayath);
    }

    if (filters.role) {
      filtered = filtered.filter(agent => agent.role === filters.role);
    }

    setFilteredStats(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Role', 'Panchayath', 'District', 'Total Points', 'Total Activities', 'Last Activity'];
    const csvContent = [
      headers.join(','),
      ...filteredStats.map(agent => [
        agent.name,
        agent.phone,
        agent.role,
        agent.panchayath,
        agent.district,
        agent.totalPoints,
        agent.totalActivities,
        agent.lastActivity
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent_points_stats.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'coordinator': return 'default';
      case 'supervisor': return 'secondary';
      case 'group-leader': return 'outline';
      case 'pro': return 'destructive';
      default: return 'default';
    }
  };

  const totalPoints = filteredStats.reduce((sum, agent) => sum + agent.totalPoints, 0);
  const totalActivities = filteredStats.reduce((sum, agent) => sum + agent.totalActivities, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalPoints}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{totalActivities}</div>
                <div className="text-sm text-muted-foreground">Total Activities</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredStats.length}</div>
                <div className="text-sm text-muted-foreground">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.panchayath} onValueChange={(value) => setFilters(prev => ({ ...prev, panchayath: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Panchayath" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Panchayaths</SelectItem>
                {panchayaths.map((panchayath) => (
                  <SelectItem key={panchayath.id} value={panchayath.name}>
                    {panchayath.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />

            <div className="flex gap-2">
              <Button onClick={fetchAgentStats} disabled={isLoading}>
                {isLoading ? "Loading..." : "Apply"}
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Points Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Panchayath</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Activities</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStats.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.phone}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(agent.role)}>
                      {agent.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{agent.panchayath}</TableCell>
                  <TableCell className="font-bold text-primary">{agent.totalPoints}</TableCell>
                  <TableCell>{agent.totalActivities}</TableCell>
                  <TableCell>{agent.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
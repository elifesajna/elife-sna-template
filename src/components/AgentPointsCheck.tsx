import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Award, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AgentPoints {
  agent: {
    id: string;
    name: string;
    phone: string;
    role: string;
    panchayaths: {
      name: string;
      district: string;
      state: string;
    };
  };
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  totalActivities: number;
}

export default function AgentPointsCheck() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [agentPoints, setAgentPoints] = useState<AgentPoints | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getRolePoints = (role: string): number => {
    switch (role) {
      case 'coordinator': return 5;
      case 'supervisor': return 3;
      case 'group-leader': return 2;
      case 'pro': return 1;
      default: return 1;
    }
  };

  const handleCheckPoints = async () => {
    if (!mobileNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mobile number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get agent details
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          phone,
          role,
          panchayaths(name, district, state)
        `)
        .eq('phone', mobileNumber.trim())
        .single();

      if (agentError || !agent) {
        toast({
          title: "Error",
          description: "Agent not found with this mobile number",
          variant: "destructive"
        });
        return;
      }

      const pointsPerActivity = getRolePoints(agent.role);

      // Get activity counts for different periods
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Total activities
      const { count: totalActivities } = await supabase
        .from('daily_activities')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);

      // Monthly activities
      const { count: monthlyActivities } = await supabase
        .from('daily_activities')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .gte('activity_date', startOfMonth.toISOString().split('T')[0]);

      // Weekly activities
      const { count: weeklyActivities } = await supabase
        .from('daily_activities')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .gte('activity_date', startOfWeek.toISOString().split('T')[0]);

      setAgentPoints({
        agent,
        totalPoints: (totalActivities || 0) * pointsPerActivity,
        monthlyPoints: (monthlyActivities || 0) * pointsPerActivity,
        weeklyPoints: (weeklyActivities || 0) * pointsPerActivity,
        totalActivities: totalActivities || 0
      });

    } catch (error) {
      console.error('Error checking points:', error);
      toast({
        title: "Error",
        description: "Failed to fetch points data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Check Agent Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleCheckPoints} disabled={isLoading}>
              {isLoading ? "Checking..." : "Check Points"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {agentPoints && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{agentPoints.agent.name}</span>
              <Badge variant={getRoleBadgeVariant(agentPoints.agent.role)}>
                {agentPoints.agent.role}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {agentPoints.agent.phone}
              <MapPin className="h-4 w-4 ml-2" />
              {agentPoints.agent.panchayaths.name}, {agentPoints.agent.panchayaths.district}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{agentPoints.totalPoints}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{agentPoints.monthlyPoints}</div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{agentPoints.weeklyPoints}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{agentPoints.totalActivities}</div>
                <div className="text-sm text-muted-foreground">Activities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
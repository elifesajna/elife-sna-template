import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganizationChartView } from "@/components/OrganizationChartView";
import { useSupabaseHierarchy } from "@/hooks/useSupabaseHierarchy";
import { Loader2, GitBranch } from "lucide-react";

const HierarchyViewForAdmin = () => {
  const { panchayaths, agents, isLoading } = useSupabaseHierarchy();
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading hierarchy...</span>
      </div>
    );
  }

  const selectedPanchayathData = panchayaths.find(p => p.id === selectedPanchayath);
  const filteredAgents = selectedPanchayath 
    ? agents.filter(agent => agent.panchayath_id === selectedPanchayath)
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Organization Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full max-w-xs">
              <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Panchayath" />
                </SelectTrigger>
                <SelectContent>
                  {panchayaths.map((panchayath) => (
                    <SelectItem key={panchayath.id} value={panchayath.id}>
                      {panchayath.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPanchayath && selectedPanchayathData && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <OrganizationChartView
                  panchayathId={selectedPanchayath}
                  agents={filteredAgents}
                  panchayathName={selectedPanchayathData.name}
                />
              </div>
            )}

            {!selectedPanchayath && (
              <div className="text-center py-8 text-muted-foreground">
                Please select a panchayath to view its organizational hierarchy
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HierarchyViewForAdmin;
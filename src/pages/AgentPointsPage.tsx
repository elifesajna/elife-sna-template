import React from 'react';
import AgentPointsStats from '@/components/AgentPointsStats';
import AdminPointsControl from '@/components/AdminPointsControl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Settings } from "lucide-react";

export default function AgentPointsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Award className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Agent Points Management</h1>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Points Statistics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Points Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="space-y-4">
          <AgentPointsStats />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <AdminPointsControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}
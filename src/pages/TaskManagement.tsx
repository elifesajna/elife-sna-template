
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckSquare, Clock, CheckCircle, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { AddTaskForm } from "@/components/AddTaskForm";
import { ViewTasks } from "@/components/ViewTasks";
import EnhancedTaskManagement from "@/components/EnhancedTaskManagement";

const TaskManagement = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'pending' | 'completed' | 'enhanced'>('enhanced');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-purple-600" />
            Task Management
          </h1>
          <p className="text-gray-600">Create, assign, and track tasks for your teams and agents</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'add' | 'pending' | 'completed' | 'enhanced')} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="enhanced" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View All Tasks
                </TabsTrigger>
                <TabsTrigger value="add" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Add Tasks
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Tasks
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed Tasks
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="enhanced" className="mt-6">
                <EnhancedTaskManagement />
              </TabsContent>
              
              <TabsContent value="add" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Task</CardTitle>
                    <CardDescription>Fill in the details below to create a new task</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AddTaskForm />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Tasks</CardTitle>
                    <CardDescription>View and manage pending tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ViewTasks taskType="pending" />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="completed" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Tasks</CardTitle>
                    <CardDescription>View completed tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ViewTasks taskType="completed" />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskManagement;

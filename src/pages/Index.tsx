import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, TreePine, Users, FileText, ClipboardList, CalendarDays } from "lucide-react";
import { DailyActivityLog } from '@/components/DailyActivityLog';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';
const Index = () => {
  const { user } = useAuth();
  const [guestUser, setGuestUser] = useState(null);
  const [memberUser, setMemberUser] = useState(null);
  
  useEffect(() => {
    // Check for guest user session
    const storedGuestUser = localStorage.getItem('guest_user');
    if (storedGuestUser) {
      setGuestUser(JSON.parse(storedGuestUser));
    }
    
    // Check for member user session
    const storedMemberUser = localStorage.getItem('member_user');
    if (storedMemberUser) {
      setMemberUser(JSON.parse(storedMemberUser));
    }
  }, []);
  
  const isAuthenticated = user || guestUser || memberUser;
  const currentPanchayathId = memberUser?.panchayath_id || guestUser?.panchayath_id;
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto py-12 px-6 bg-cyan-950">
          <h1 className="text-4xl font-bold mb-4">
            {memberUser ? `Welcome, ${memberUser.name}` : 'Welcome to Panchayath Management System'}
          </h1>
          <p className="text-xl text-blue-100">
            {memberUser ? `${memberUser.panchayath?.name || 'Your Panchayath'} Management Dashboard` : 'Streamline operations, enhance transparency, and empower communities'}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Staff Management - Always available */}
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">ഏജൻ്റുമാരെ ചേർക്കുക</CardTitle>
              <CardDescription className="text-gray-600">
                Manage agents and staff members for efficient operations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/add-agents">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300">
                  Manage Staff
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Daily Activity Log - Always available */}
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition-colors">ഡെയിലി നോട്ട്</CardTitle>
              <CardDescription className="text-gray-600">
                Log and track daily activities for agents
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <DailyActivityLog />
            </CardContent>
          </Card>

          {/* Show organization and task sections only when authenticated */}
          {isAuthenticated && <>

              {/* View Hierarchy */}
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TreePine className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">ഏജൻ്റ് ശ്രേണി കാണുക</CardTitle>
                  <CardDescription className="text-gray-600">
                    Visualize organizational structure and agent relationships in interactive charts
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to="/view-hierarchy">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300">
                      View Organization Chart
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Task Management */}
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckSquare className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">ടാസ്ക് മാനേജ്മെൻ്റ്
              </CardTitle>
                  <CardDescription className="text-gray-600">
                    Create, assign, and track tasks for teams and individual agents
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to="/task-management">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300">
                      Manage Tasks
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Panchayath Notes */}
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                    Panchayath Notes
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    View and manage notes about panchayath status and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to="/panchayath-notes">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300">
                      View Notes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>}
        </div>
      </main>
    </div>;
};
export default Index;
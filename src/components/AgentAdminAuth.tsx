import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { typedSupabase, TABLES } from "@/lib/supabase-utils";
import { Phone, LogIn, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface AgentAdminAuthProps {
  onAuthenticated: (mobileNumber: string, teamData: any) => void;
}

const AgentAdminAuth: React.FC<AgentAdminAuthProps> = ({ onAuthenticated }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if mobile number exists in management team members
      const { data: teamMember, error } = await typedSupabase
        .from(TABLES.MANAGEMENT_TEAM_MEMBERS)
        .select(`
          *,
          management_team:management_teams(*)
        `)
        .eq('mobile_number', mobileNumber)
        .single();

      if (error || !teamMember) {
        toast({
          title: "Access Denied",
          description: "Mobile number not found in any team. Contact administrator.",
          variant: "destructive",
        });
        return;
      }

      // Authenticate successfully
      toast({
        title: "Success",
        description: "Authentication successful! Welcome to Agent Admin Panel",
      });

      onAuthenticated(mobileNumber, teamMember);
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Error",
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Agent Admin</CardTitle>
            <Link 
              to="/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
          <CardDescription>
            Enter your mobile number to access the agent admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Access Admin Panel
                </>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Only team members can access this panel
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentAdminAuth;
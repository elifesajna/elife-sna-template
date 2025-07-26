import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, LogIn, UserPlus, Phone, User, AlertCircle, CheckCircle, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  phone: string;
  role: string;
  panchayath_id: string;
  panchayaths?: {
    name: string;
    district: string;
    state: string;
  };
}

export default function MembersLogin() {
  const [loginData, setLoginData] = useState({
    name: '',
    mobileNumber: ''
  });
  const [registrationData, setRegistrationData] = useState({
    selectedAgentId: '',
    searchTerm: ''
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'pending' | 'rejected'>('idle');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (registrationData.searchTerm) {
      const filtered = agents.filter(agent => 
        agent.name.toLowerCase().includes(registrationData.searchTerm.toLowerCase()) ||
        agent.phone.includes(registrationData.searchTerm)
      );
      setFilteredAgents(filtered);
    } else {
      setFilteredAgents(agents);
    }
  }, [registrationData.searchTerm, agents]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          phone,
          role,
          panchayath_id,
          panchayaths(name, district, state)
        `)
        .order('name');

      if (error) throw error;
      setAgents(data || []);
      setFilteredAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Check if member exists and is approved (using user_registration_requests table for now)
      const { data, error } = await supabase
        .from('user_registration_requests')
        .select('*, panchayaths(name, district, state)')
        .eq('username', loginData.name.trim())
        .eq('mobile_number', loginData.mobileNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Error",
            description: "Invalid name or mobile number",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.status === 'approved') {
        // Store member session
        localStorage.setItem('member_user', JSON.stringify({
          id: data.id,
          name: data.username,
          mobileNumber: data.mobile_number,
          panchayath_id: data.panchayath_id,
          panchayath: data.panchayaths,
          role: 'member'
        }));
        
        setLoginStatus('success');
        setTimeout(() => {
          navigate('/member-dashboard');
        }, 1000);
      } else if (data.status === 'pending') {
        setLoginStatus('pending');
      } else if (data.status === 'rejected') {
        setLoginStatus('rejected');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    if (!registrationData.selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select an agent from the list",
        variant: "destructive"
      });
      setIsRegistering(false);
      return;
    }

    try {
      const selectedAgent = agents.find(a => a.id === registrationData.selectedAgentId);
      if (!selectedAgent) {
        throw new Error('Selected agent not found');
      }

      // Check if already registered with this agent
      const { data: existingData } = await supabase
        .from('user_registration_requests')
        .select('id')
        .eq('username', selectedAgent.name)
        .eq('mobile_number', selectedAgent.phone)
        .single();

      if (existingData) {
        toast({
          title: "Error",
          description: "This agent is already registered as a member",
          variant: "destructive"
        });
        setIsRegistering(false);
        return;
      }

      // Create member registration using user_registration_requests table
      const { error } = await supabase
        .from('user_registration_requests')
        .insert([{
          username: selectedAgent.name,
          mobile_number: selectedAgent.phone,
          panchayath_id: selectedAgent.panchayath_id,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registration submitted successfully. Please wait for admin approval.",
      });

      setRegistrationData({ selectedAgentId: '', searchTerm: '' });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (loginStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Login Successful</CardTitle>
            <CardDescription>
              Welcome! Redirecting you to the member dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Member Login</CardTitle>
                <CardDescription>
                  Login with your approved name and mobile number
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loginStatus === 'pending' && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your registration is still pending admin approval.
                    </AlertDescription>
                  </Alert>
                )}

                {loginStatus === 'rejected' && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your registration request was rejected. Please contact the administrator.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-name"
                        type="text"
                        placeholder="Enter your name"
                        value={loginData.name}
                        onChange={(e) => setLoginData(prev => ({ ...prev, name: e.target.value }))}
                        className="pl-10"
                        disabled={isLoggingIn}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-mobile">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-mobile"
                        type="tel"
                        placeholder="Enter mobile number"
                        value={loginData.mobileNumber}
                        onChange={(e) => setLoginData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                        className="pl-10"
                        maxLength={10}
                        disabled={isLoggingIn}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Member Registration</CardTitle>
                <CardDescription>
                  Select your details from the agents hierarchy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Agent</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        type="text"
                        placeholder="Search by name or mobile number"
                        value={registrationData.searchTerm}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent-select">Select Agent</Label>
                    <Select 
                      value={registrationData.selectedAgentId} 
                      onValueChange={(value) => setRegistrationData(prev => ({ ...prev, selectedAgentId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your agent profile" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{agent.name}</span>
                              <span className="text-xs text-gray-500">
                                {agent.phone} • {agent.role} • {agent.panchayaths?.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={isRegistering}>
                    {isRegistering ? "Registering..." : "Register"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  phone: string;
  role: string;
  panchayath_id: string;
}

interface MobileAgentSearchProps {
  onAgentSelect: (agentId: string) => void;
  selectedAgentId?: string;
}

export const MobileAgentSearch = ({ onAgentSelect, selectedAgentId }: MobileAgentSearchProps) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [foundAgent, setFoundAgent] = useState<Agent | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchAgent = async () => {
    if (!mobileNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('phone', mobileNumber)
        .single();

      if (error || !data) {
        toast({
          title: "Not Found",
          description: "No agent found with this mobile number",
          variant: "destructive",
        });
        setFoundAgent(null);
        return;
      }

      setFoundAgent(data);
      toast({
        title: "Agent Found",
        description: `Found agent: ${data.name}`,
      });
    } catch (error) {
      console.error('Error searching agent:', error);
      toast({
        title: "Error",
        description: "Failed to search for agent",
        variant: "destructive",
      });
      setFoundAgent(null);
    } finally {
      setIsSearching(false);
    }
  };

  const selectAgent = () => {
    if (foundAgent) {
      onAgentSelect(foundAgent.id);
      toast({
        title: "Agent Selected",
        description: `Selected agent: ${foundAgent.name}`,
      });
    }
  };

  const clearSelection = () => {
    setMobileNumber('');
    setFoundAgent(null);
    onAgentSelect('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="Enter mobile number"
          className="flex-1"
        />
        <Button onClick={searchAgent} disabled={isSearching} size="sm">
          <Search className="h-4 w-4 mr-1" />
          {isSearching ? "Searching..." : "Find"}
        </Button>
      </div>

      {foundAgent && (
        <Card className={`${selectedAgentId === foundAgent.id ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{foundAgent.name}</span>
                  <Badge variant="outline">{foundAgent.role}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{foundAgent.phone}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedAgentId === foundAgent.id ? (
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear
                  </Button>
                ) : (
                  <Button onClick={selectAgent} size="sm">
                    Select
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PointSetting {
  role: string;
  points_per_activity: number;
}

export default function AdminPointsControl() {
  const [pointSettings, setPointSettings] = useState<PointSetting[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState<number>(1);

  const roles = [
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'group-leader', label: 'Group Leader' },
    { value: 'pro', label: 'Pro' }
  ];

  useEffect(() => {
    loadPointSettings();
  }, []);

  const loadPointSettings = () => {
    const saved = localStorage.getItem('agent_point_settings');
    if (saved) {
      setPointSettings(JSON.parse(saved));
    } else {
      // Default settings
      const defaultSettings = roles.map(role => ({
        role: role.value,
        points_per_activity: role.value === 'coordinator' ? 5 : 
                             role.value === 'supervisor' ? 3 :
                             role.value === 'group-leader' ? 2 : 1
      }));
      setPointSettings(defaultSettings);
      localStorage.setItem('agent_point_settings', JSON.stringify(defaultSettings));
    }
  };

  const handleEditRole = (role: string) => {
    const setting = pointSettings.find(s => s.role === role);
    setEditingRole(role);
    setEditingPoints(setting?.points_per_activity || 1);
  };

  const handleSavePoints = () => {
    if (!editingRole) return;

    const updatedSettings = pointSettings.map(setting => 
      setting.role === editingRole 
        ? { ...setting, points_per_activity: editingPoints }
        : setting
    );

    setPointSettings(updatedSettings);
    localStorage.setItem('agent_point_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Success",
      description: "Point settings updated successfully"
    });

    setEditingRole(null);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Points Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {roles.map((role) => {
            const setting = pointSettings.find(s => s.role === role.value);
            const isEditing = editingRole === role.value;

            return (
              <div key={role.value} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={getRoleBadgeVariant(role.value)}>
                    {role.label}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Points per activity:</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        min="1"
                        value={editingPoints}
                        onChange={(e) => setEditingPoints(parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleSavePoints}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingRole(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold min-w-[40px] text-center">
                        {setting?.points_per_activity || 1}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditRole(role.value)}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
-- Create agent_permissions table for team member permissions
CREATE TABLE IF NOT EXISTS public.agent_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, permission_id)
);

-- Enable Row Level Security
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_permissions
CREATE POLICY "Admins can view all agent permissions" 
ON public.agent_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create agent permissions" 
ON public.agent_permissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update agent permissions" 
ON public.agent_permissions 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete agent permissions" 
ON public.agent_permissions 
FOR DELETE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_agent_permissions_agent_id ON public.agent_permissions(agent_id);
CREATE INDEX idx_agent_permissions_permission_id ON public.agent_permissions(permission_id);
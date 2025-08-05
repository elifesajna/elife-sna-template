-- Create permissions table for admin role management
CREATE TABLE public.admin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Enable all access for admin_permissions" 
ON public.admin_permissions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create role permissions junction table
CREATE TABLE public.admin_role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role permissions
CREATE POLICY "Enable all access for admin_role_permissions" 
ON public.admin_role_permissions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_permissions_updated_at
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions
INSERT INTO public.admin_permissions (permission_name, description, category) VALUES
-- User Management
('users.view', 'View user list and details', 'User Management'),
('users.create', 'Create new users', 'User Management'),
('users.edit', 'Edit existing users', 'User Management'),
('users.delete', 'Delete users', 'User Management'),
('users.approve', 'Approve user registrations', 'User Management'),

-- Team Management
('teams.view', 'View team list and details', 'Team Management'),
('teams.create', 'Create new teams', 'Team Management'),
('teams.edit', 'Edit existing teams', 'Team Management'),
('teams.delete', 'Delete teams', 'Team Management'),

-- Task Management
('tasks.view', 'View task list and details', 'Task Management'),
('tasks.create', 'Create new tasks', 'Task Management'),
('tasks.edit', 'Edit existing tasks', 'Task Management'),
('tasks.delete', 'Delete tasks', 'Task Management'),
('tasks.assign', 'Assign tasks to agents/teams', 'Task Management'),

-- Agent Points
('points.view', 'View agent points and statistics', 'Points Management'),
('points.edit', 'Edit points configuration', 'Points Management'),
('points.reset', 'Reset agent points', 'Points Management'),

-- Panchayaths
('panchayaths.view', 'View panchayath list and details', 'Panchayath Management'),
('panchayaths.create', 'Create new panchayaths', 'Panchayath Management'),
('panchayaths.edit', 'Edit existing panchayaths', 'Panchayath Management'),
('panchayaths.delete', 'Delete panchayaths', 'Panchayath Management'),

-- Reports
('reports.view', 'View and generate reports', 'Reports'),
('reports.export', 'Export reports', 'Reports'),

-- Notifications
('notifications.view', 'View notifications', 'Notifications'),
('notifications.send', 'Send notifications', 'Notifications'),
('notifications.manage', 'Manage notification settings', 'Notifications'),

-- System Settings
('settings.view', 'View system settings', 'System Settings'),
('settings.edit', 'Edit system settings', 'System Settings'),

-- Permissions
('permissions.view', 'View permissions', 'Permissions'),
('permissions.manage', 'Manage user permissions', 'Permissions');
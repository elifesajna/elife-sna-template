-- Enable RLS and add missing DELETE policy for user_registration_requests
ALTER TABLE public.user_registration_requests ENABLE ROW LEVEL SECURITY;

-- Add DELETE policy for admin access
CREATE POLICY "Enable delete access for user_registration_requests" 
ON public.user_registration_requests 
FOR DELETE 
USING (true);

-- Enable realtime updates for the table
ALTER TABLE public.user_registration_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_registration_requests;
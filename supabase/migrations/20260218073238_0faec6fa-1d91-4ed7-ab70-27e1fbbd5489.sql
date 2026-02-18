
-- Fix overly permissive policy on complaint_assignments
DROP POLICY "System/Admin can manage assignments" ON public.complaint_assignments;
CREATE POLICY "Authenticated can insert assignments" ON public.complaint_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix notifications insert policy
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

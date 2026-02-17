
-- Tighten audit_log insert: only the acting user can log their own actions
DROP POLICY "System can insert audit log" ON public.audit_log;
CREATE POLICY "Users can insert own audit entries"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Tighten bill_approvals insert: only relevant role users can create approvals
DROP POLICY "System can insert approvals" ON public.bill_approvals;
CREATE POLICY "Approval-role users can insert approvals"
ON public.bill_approvals FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'accounts')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'md')
  OR public.has_role(auth.uid(), 'admin')
  OR approver_id = auth.uid()
);

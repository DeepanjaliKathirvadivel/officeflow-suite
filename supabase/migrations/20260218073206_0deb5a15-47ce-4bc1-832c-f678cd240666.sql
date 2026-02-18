
-- Courier module enums and tables
CREATE TYPE public.courier_status AS ENUM ('pending_pickup', 'collected');
CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.complaint_category AS ENUM ('it', 'maintenance', 'hr', 'security', 'admin');
CREATE TYPE public.asset_status AS ENUM ('available', 'issued', 'returned', 'overdue', 'damaged');

-- Courier Vendors
CREATE TABLE public.courier_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courier_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view vendors" ON public.courier_vendors FOR SELECT USING (true);
CREATE POLICY "Reception/Admin can manage vendors" ON public.courier_vendors FOR ALL USING (
  has_role(auth.uid(), 'reception'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Couriers
CREATE TABLE public.couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL,
  vendor_id UUID REFERENCES public.courier_vendors(id) NOT NULL,
  assigned_to UUID NOT NULL,
  slip_image_url TEXT,
  status courier_status NOT NULL DEFAULT 'pending_pickup',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view couriers" ON public.couriers FOR SELECT USING (true);
CREATE POLICY "Reception/Admin can insert couriers" ON public.couriers FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'reception'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Reception/Admin can update couriers" ON public.couriers FOR UPDATE USING (
  has_role(auth.uid(), 'reception'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  OR assigned_to = auth.uid()
);
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Courier Acknowledgements
CREATE TABLE public.courier_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES public.couriers(id) NOT NULL,
  acknowledged_by UUID NOT NULL,
  signature_data TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courier_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view acks" ON public.courier_acknowledgements FOR SELECT USING (true);
CREATE POLICY "Assigned employee can insert ack" ON public.courier_acknowledgements FOR INSERT WITH CHECK (acknowledged_by = auth.uid());

-- Assets
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  serial_number TEXT,
  department TEXT,
  image_url TEXT,
  status asset_status NOT NULL DEFAULT 'available',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Admin can manage assets" ON public.assets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Asset Transactions (issue/return)
CREATE TABLE public.asset_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  issued_to UUID NOT NULL,
  issued_by UUID NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  return_condition TEXT,
  signature_data TEXT,
  status asset_status NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view transactions" ON public.asset_transactions FOR SELECT USING (true);
CREATE POLICY "Admin can manage transactions" ON public.asset_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Damage Reports
CREATE TABLE public.damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  transaction_id UUID REFERENCES public.asset_transactions(id),
  reported_by UUID NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view damage reports" ON public.damage_reports FOR SELECT USING (true);
CREATE POLICY "Admin can manage damage reports" ON public.damage_reports FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admin can manage departments" ON public.departments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed departments
INSERT INTO public.departments (name) VALUES ('IT'), ('Maintenance'), ('HR'), ('Security'), ('Admin'), ('Facilities');

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category complaint_category NOT NULL,
  priority complaint_priority NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  attachment_url TEXT,
  status complaint_status NOT NULL DEFAULT 'open',
  submitted_by UUID NOT NULL,
  resolution_remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Users can submit complaints" ON public.complaints FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Assigned/Admin can update complaints" ON public.complaints FOR UPDATE USING (
  submitted_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'it_team'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Complaint Assignments
CREATE TABLE public.complaint_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) NOT NULL,
  assigned_department TEXT NOT NULL,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view assignments" ON public.complaint_assignments FOR SELECT USING (true);
CREATE POLICY "System/Admin can manage assignments" ON public.complaint_assignments FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR true
);

-- Complaint History
CREATE TABLE public.complaint_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  performed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view history" ON public.complaint_history FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert history" ON public.complaint_history FOR INSERT WITH CHECK (performed_by = auth.uid());

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Storage bucket for courier slips and asset images
INSERT INTO storage.buckets (id, name, public) VALUES ('courier-slips', 'courier-slips', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('asset-images', 'asset-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Storage policies
CREATE POLICY "Authenticated can upload courier slips" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'courier-slips' AND auth.role() = 'authenticated');
CREATE POLICY "Public can view courier slips" ON storage.objects FOR SELECT USING (bucket_id = 'courier-slips');
CREATE POLICY "Authenticated can upload asset images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'asset-images' AND auth.role() = 'authenticated');
CREATE POLICY "Public can view asset images" ON storage.objects FOR SELECT USING (bucket_id = 'asset-images');
CREATE POLICY "Authenticated can upload complaint attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'complaint-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Public can view complaint attachments" ON storage.objects FOR SELECT USING (bucket_id = 'complaint-attachments');

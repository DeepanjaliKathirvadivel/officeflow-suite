
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('reception', 'accounts', 'manager', 'md', 'admin', 'employee', 'it_team');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bill status enum
CREATE TYPE public.bill_status AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- Bills table
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  vendor_name TEXT NOT NULL DEFAULT '',
  bill_number TEXT DEFAULT '',
  bill_date DATE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_number TEXT DEFAULT '',
  department TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  ocr_text TEXT DEFAULT '',
  status bill_status NOT NULL DEFAULT 'draft',
  current_approval_level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bills"
ON public.bills FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert bills"
ON public.bills FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can update own draft bills"
ON public.bills FOR UPDATE
TO authenticated
USING (
  submitted_by = auth.uid() AND status = 'draft'
  OR public.has_role(auth.uid(), 'accounts')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'md')
  OR public.has_role(auth.uid(), 'admin')
);

-- Bill approvals table
CREATE TABLE public.bill_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
  approver_id UUID REFERENCES auth.users(id) NOT NULL,
  approval_level INT NOT NULL,
  status bill_status NOT NULL DEFAULT 'pending',
  comments TEXT DEFAULT '',
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bill_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approvals"
ON public.bill_approvals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Approvers can update their approvals"
ON public.bill_approvals FOR UPDATE
TO authenticated
USING (approver_id = auth.uid());

CREATE POLICY "System can insert approvals"
ON public.bill_approvals FOR INSERT
TO authenticated
WITH CHECK (true);

-- Workflow rules table
CREATE TABLE public.workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_amount NUMERIC(12,2),
  approval_levels JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view rules"
ON public.workflow_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage rules"
ON public.workflow_rules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Seed workflow rules
INSERT INTO public.workflow_rules (min_amount, max_amount, approval_levels) VALUES
  (0, 4999.99, '["accounts"]'),
  (5000, 25000, '["accounts", "manager"]'),
  (25000.01, NULL, '["accounts", "manager", "md"]');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for bill files
INSERT INTO storage.buckets (id, name, public) VALUES ('bill-files', 'bill-files', true);

CREATE POLICY "Authenticated users can upload bill files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bill-files');

CREATE POLICY "Anyone can view bill files"
ON storage.objects FOR SELECT
USING (bucket_id = 'bill-files');

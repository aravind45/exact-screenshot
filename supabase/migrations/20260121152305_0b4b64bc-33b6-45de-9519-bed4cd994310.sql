-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'executor' CHECK (role IN ('executor', 'attorney', 'admin')),
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create estates table
CREATE TABLE public.estates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  deceased_first_name TEXT NOT NULL,
  deceased_last_name TEXT NOT NULL,
  deceased_date_of_birth DATE,
  deceased_date_of_death DATE NOT NULL,
  deceased_state TEXT NOT NULL,
  estate_type TEXT DEFAULT 'simple_probate' CHECK (estate_type IN ('simple_probate', 'intestate', 'trust_based', 'small_estate')),
  status TEXT DEFAULT 'initiation' CHECK (status IN ('initiation', 'discovery', 'settlement', 'distribution', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID REFERENCES public.estates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  account_number TEXT,
  value DECIMAL(15,2) DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('financial', 'retirement', 'insurance', 'employer', 'property', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'contacted', 'documents_submitted', 'in_review', 'approved', 'distributed', 'closed')),
  last_contact_date DATE,
  next_follow_up_date DATE,
  institution_phone TEXT,
  institution_email TEXT,
  institution_fax TEXT,
  contact_person TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create asset_communications table
CREATE TABLE public.asset_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  communication_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('initial_contact', 'follow_up', 'escalation', 'response', 'document_submission', 'distribution_received')),
  method TEXT NOT NULL CHECK (method IN ('email', 'phone', 'fax', 'mail', 'portal')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT NOT NULL,
  content TEXT,
  contact_person TEXT,
  response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  next_action_date DATE,
  next_action_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_communications ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Estates RLS policies
CREATE POLICY "Users can view their own estates"
  ON public.estates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own estates"
  ON public.estates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estates"
  ON public.estates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estates"
  ON public.estates FOR DELETE
  USING (auth.uid() = user_id);

-- Assets RLS policies
CREATE POLICY "Users can view their own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- Asset Communications RLS policies
CREATE POLICY "Users can view their own communications"
  ON public.asset_communications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own communications"
  ON public.asset_communications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own communications"
  ON public.asset_communications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own communications"
  ON public.asset_communications FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estates_updated_at
  BEFORE UPDATE ON public.estates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON public.asset_communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
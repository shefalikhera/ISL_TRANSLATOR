
-- Create tutors table
CREATE TABLE public.tutors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  hourly_rate INTEGER DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  contact_email TEXT,
  phone TEXT,
  city TEXT,
  photo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

-- Anyone can browse tutors
CREATE POLICY "Anyone can view tutors"
ON public.tutors FOR SELECT
USING (true);

-- Authenticated users can create their own listing
CREATE POLICY "Users can create their own tutor listing"
ON public.tutors FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own listing
CREATE POLICY "Users can update their own tutor listing"
ON public.tutors FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own listing
CREATE POLICY "Users can delete their own tutor listing"
ON public.tutors FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tutors_updated_at
BEFORE UPDATE ON public.tutors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

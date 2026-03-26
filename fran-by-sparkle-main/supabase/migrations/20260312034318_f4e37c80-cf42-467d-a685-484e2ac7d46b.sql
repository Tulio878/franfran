CREATE TABLE public.pix_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_document TEXT,
  pix_code TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  items JSONB,
  shipping JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create transactions" ON public.pix_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read transactions" ON public.pix_transactions
  FOR SELECT USING (true);

CREATE POLICY "Service role can update transactions" ON public.pix_transactions
  FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pix_transactions_updated_at
  BEFORE UPDATE ON public.pix_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
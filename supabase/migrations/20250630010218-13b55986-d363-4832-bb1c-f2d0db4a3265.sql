
-- Create a table to track prize distributions
CREATE TABLE public.prize_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  winner_wallet TEXT NOT NULL,
  prize_amount DECIMAL(10, 4) NOT NULL,
  game_id TEXT NOT NULL,
  transaction_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create an index for faster lookups
CREATE INDEX idx_prize_distributions_status ON public.prize_distributions(status);
CREATE INDEX idx_prize_distributions_winner ON public.prize_distributions(winner_wallet);

-- Enable RLS (though this will be accessed by edge functions)
ALTER TABLE public.prize_distributions ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage prize distributions
CREATE POLICY "Service role can manage prize distributions" 
  ON public.prize_distributions 
  FOR ALL 
  USING (true);


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js@1.98.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { winner_wallet, prize_amount, game_id } = await req.json();

    console.log('Prize distribution request:', { winner_wallet, prize_amount, game_id });

    // Validate input
    if (!winner_wallet || !prize_amount || !game_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create prize distribution record
    const { data: prizeRecord, error: insertError } = await supabaseClient
      .from('prize_distributions')
      .insert({
        winner_wallet,
        prize_amount,
        game_id,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create prize record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Prize record created:', prizeRecord.id);

    // Setup Solana connection
    const connection = new Connection('https://rpc.gorbagana.wtf/', 'confirmed');
    
    // Get treasury private key from environment
    const treasuryPrivateKey = Deno.env.get('TREASURY_PRIVATE_KEY');
    if (!treasuryPrivateKey) {
      console.error('Treasury private key not found');
      await supabaseClient
        .from('prize_distributions')
        .update({ status: 'failed' })
        .eq('id', prizeRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Treasury configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create keypair from private key
    const treasuryKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(`[${treasuryPrivateKey.split('').map((_, i, arr) => {
        if (i % 2 === 0) return parseInt(arr.slice(i, i + 2).join(''), 16);
      }).filter(x => x !== undefined)}]`))
    );

    // Actually, let's decode the base58 private key properly
    const bs58 = await import('https://esm.sh/bs58@5.0.0');
    const treasuryKeypairCorrect = Keypair.fromSecretKey(bs58.decode(treasuryPrivateKey));

    console.log('Treasury wallet:', treasuryKeypairCorrect.publicKey.toString());

    // Create transaction
    const winnerPubkey = new PublicKey(winner_wallet);
    const lamports = Math.floor(prize_amount * LAMPORTS_PER_SOL);

    console.log('Sending', lamports, 'lamports to', winner_wallet);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypairCorrect.publicKey,
        toPubkey: winnerPubkey,
        lamports: lamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = treasuryKeypairCorrect.publicKey;

    // Sign and send transaction
    transaction.sign(treasuryKeypairCorrect);
    
    const signature = await connection.sendRawTransaction(transaction.serialize());
    console.log('Transaction sent:', signature);

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('Transaction confirmed:', signature);

    // Update prize distribution record
    const { error: updateError } = await supabaseClient
      .from('prize_distributions')
      .update({
        status: 'completed',
        transaction_signature: signature,
        completed_at: new Date().toISOString()
      })
      .eq('id', prizeRecord.id);

    if (updateError) {
      console.error('Failed to update prize record:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_signature: signature,
        prize_distribution_id: prizeRecord.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Prize distribution error:', error);
    return new Response(
      JSON.stringify({ error: 'Prize distribution failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})


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

    // Setup Solana connection with retry logic
    const connection = new Connection('https://rpc.gorbagana.wtf/', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: undefined // Disable WebSocket to avoid connection issues
    });
    
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

    // Import base58 for proper key decoding
    const { decode: bs58decode } = await import('https://esm.sh/bs58@5.0.0');
    
    let treasuryKeypair: Keypair;
    try {
      // Decode the base58 private key
      const privateKeyBytes = bs58decode(treasuryPrivateKey);
      treasuryKeypair = Keypair.fromSecretKey(privateKeyBytes);
      console.log('Treasury wallet loaded:', treasuryKeypair.publicKey.toString());
    } catch (keyError) {
      console.error('Failed to decode treasury private key:', keyError);
      await supabaseClient
        .from('prize_distributions')
        .update({ status: 'failed' })
        .eq('id', prizeRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Treasury key decoding error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create transaction with proper size management
    const winnerPubkey = new PublicKey(winner_wallet);
    const lamports = Math.floor(prize_amount * LAMPORTS_PER_SOL);

    console.log('Creating transaction:', {
      from: treasuryKeypair.publicKey.toString(),
      to: winner_wallet,
      lamports: lamports,
      sol: prize_amount
    });

    // Check treasury balance first
    const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
    console.log('Treasury balance:', treasuryBalance / LAMPORTS_PER_SOL, 'SOL');

    if (treasuryBalance < lamports + 5000) { // 5000 lamports for transaction fee
      console.error('Insufficient treasury balance');
      await supabaseClient
        .from('prize_distributions')
        .update({ status: 'failed' })
        .eq('id', prizeRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Insufficient treasury balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: winnerPubkey,
        lamports: lamports,
      })
    );

    // Get recent blockhash with retry
    let recentBlockhash;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const result = await connection.getLatestBlockhash('confirmed');
        recentBlockhash = result.blockhash;
        break;
      } catch (blockchashError) {
        attempts++;
        console.warn(`Blockhash attempt ${attempts} failed:`, blockchashError);
        if (attempts === maxAttempts) throw blockchashError;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    transaction.recentBlockhash = recentBlockhash!;
    transaction.feePayer = treasuryKeypair.publicKey;

    // Sign transaction
    transaction.sign(treasuryKeypair);
    
    console.log('Transaction signed, sending to network...');

    // Send transaction with retry logic
    let signature: string | undefined;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        signature = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3
        });
        console.log('Transaction sent:', signature);
        break;
      } catch (sendError) {
        attempts++;
        console.warn(`Send attempt ${attempts} failed:`, sendError);
        if (attempts === maxAttempts) throw sendError;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      }
    }

    if (!signature) {
      throw new Error('Failed to send transaction after retries');
    }

    // Confirm transaction with timeout
    console.log('Confirming transaction...');
    try {
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('Transaction confirmed:', signature);
    } catch (confirmError) {
      console.warn('Transaction confirmation failed, but transaction may still be valid:', confirmError);
      // Continue anyway as the transaction might still be processed
    }

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

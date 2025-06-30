
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

    const { winner_wallet, prize_amount, game_id, win_type } = await req.json();

    console.log('🎰 Prize distribution request:', { winner_wallet, prize_amount, game_id, win_type });

    // Validate input
    if (!winner_wallet || !game_id) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create prize distribution record
    const { data: prizeRecord, error: insertError } = await supabaseClient
      .from('prize_distributions')
      .insert({
        winner_wallet,
        prize_amount: prize_amount || 0,
        game_id,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create prize record', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Prize record created:', prizeRecord.id);

    // Setup Solana connection
    const connection = new Connection('https://rpc.gorbagana.wtf/', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 30000,
      wsEndpoint: undefined
    });
    
    // Get treasury private key
    const treasuryPrivateKey = Deno.env.get('TREASURY_PRIVATE_KEY');
    
    if (!treasuryPrivateKey) {
      console.error('❌ Treasury private key not found in environment');
      
      await supabaseClient
        .from('prize_distributions')
        .update({ status: 'failed' })
        .eq('id', prizeRecord.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Treasury configuration error - Private key not found', 
          success: false
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let treasuryKeypair: Keypair;
    try {
      console.log('🔓 Attempting to decode treasury private key...');
      
      // Convert base58 string to Uint8Array using a simple base58 decoder
      // Since we can't reliably import bs58, we'll implement a basic decoder
      const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      
      function base58Decode(str: string): Uint8Array {
        let bytes = [0];
        for (let i = 0; i < str.length; i++) {
          const c = str[i];
          const p = alphabet.indexOf(c);
          if (p === -1) throw new Error('Invalid character in base58 string');
          
          let carry = p;
          let j = 0;
          while (j < bytes.length || carry) {
            const val = (bytes[j] || 0) * 58 + carry;
            bytes[j] = val & 0xff;
            carry = Math.floor(val / 256);
            j++;
          }
        }
        
        // Count leading zeros
        let leadingZeros = 0;
        for (let i = 0; i < str.length && str[i] === '1'; i++) {
          leadingZeros++;
        }
        
        // Create result array
        const result = new Uint8Array(leadingZeros + bytes.length);
        result.set(bytes.reverse(), leadingZeros);
        
        return result;
      }
      
      const privateKeyBytes = base58Decode(treasuryPrivateKey);
      console.log('🔑 Decoded key byte length:', privateKeyBytes.length);
      
      treasuryKeypair = Keypair.fromSecretKey(privateKeyBytes);
      console.log('🔑 Treasury wallet loaded successfully:', treasuryKeypair.publicKey.toString());
    } catch (keyError) {
      console.error('❌ Failed to decode treasury private key:', keyError);
      
      await supabaseClient
        .from('prize_distributions')
        .update({ status: 'failed' })
        .eq('id', prizeRecord.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Treasury key decoding error - Invalid private key format', 
          success: false,
          details: keyError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ALL treasury balance (minus transaction fee)
    const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
    console.log('💰 Treasury balance:', treasuryBalance / LAMPORTS_PER_SOL, 'SOL');

    const transactionFee = 5000; // 5000 lamports for transaction fee
    const lamportsToSend = treasuryBalance - transactionFee;

    if (lamportsToSend <= 0) {
      console.error('❌ Insufficient treasury balance for transaction');
      await supabaseClient
        .from('prize_distributions')
        .update({ status: 'failed' })
        .eq('id', prizeRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Insufficient treasury balance', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const actualPrizeAmount = lamportsToSend / LAMPORTS_PER_SOL;
    console.log('💸 Sending ALL treasury funds:', actualPrizeAmount, 'SOL to', winner_wallet);

    // Validate winner wallet address
    let winnerPubkey: PublicKey;
    try {
      winnerPubkey = new PublicKey(winner_wallet);
    } catch (pubkeyError) {
      console.error('❌ Invalid winner wallet address:', pubkeyError);
      await supabaseClient
        .from('prize_distributions')
        .update({ status: 'failed' })
        .eq('id', prizeRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Invalid winner wallet address', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create transaction to send ALL treasury funds
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: winnerPubkey,
        lamports: lamportsToSend,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = treasuryKeypair.publicKey;

    // Sign transaction
    transaction.sign(treasuryKeypair);
    
    console.log('✍️ Transaction signed, sending to network...');

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });
    
    console.log('📤 Transaction sent:', signature);

    // Confirm transaction
    console.log('⏳ Confirming transaction...');
    try {
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✅ Transaction confirmed:', signature);
    } catch (confirmError) {
      console.warn('⚠️ Transaction confirmation failed, but transaction may still be valid:', confirmError);
      // Continue anyway as the transaction might still be processed
    }

    // Update prize distribution record with actual amount sent
    const { error: updateError } = await supabaseClient
      .from('prize_distributions')
      .update({
        status: 'completed',
        transaction_signature: signature,
        prize_amount: actualPrizeAmount,
        completed_at: new Date().toISOString()
      })
      .eq('id', prizeRecord.id);

    if (updateError) {
      console.error('❌ Failed to update prize record:', updateError);
    }

    console.log('🎉 Prize distribution completed successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_signature: signature,
        prize_distribution_id: prizeRecord.id,
        actual_prize_amount: actualPrizeAmount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Prize distribution error:', error);
    return new Response(
      JSON.stringify({ error: 'Prize distribution failed', details: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-signature');

        // Lemon Squeezy requires webhook validation using a secret
        const secret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');

        if (!secret) {
            console.error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET");
            return new Response('Webhook Secret not configured', { status: 500, headers: corsHeaders });
        }

        // Verify signature
        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
        const signatureBuffer = Buffer.from(signature || '', 'utf8');

        if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
            console.error("Invalid Lemon Squeezy Signature");
            return new Response('Invalid signature', { status: 401, headers: corsHeaders });
        }

        const payload = JSON.parse(rawBody);
        const eventName = payload.meta.event_name;
        
        console.log(`Received Lemon Squeezy Event: ${eventName}`);

        // We only care about successful orders/subscriptions
        if (eventName === 'order_created' || eventName === 'subscription_created') {
            const customData = payload.meta.custom_data;
            const userId = customData?.user_id;

            if (!userId) {
                console.error("No user_id found in custom_data");
                return new Response('Missing user_id', { status: 400, headers: corsHeaders });
            }

            // Extract the product/variant name that was purchased
            // Note: Make sure your LemonSqueezy Variant names map exactly to your Plan names (e.g., "Business", "Specialists", "Agency")
            const productName = payload.data.attributes.first_order_item?.variant_name || 
                                payload.data.attributes.first_subscription_item?.variant_name;

            if (!productName) {
                console.error("Could not determine product name from payload");
                // fallback to Business if something goes wrong
            }

            // Determine the standardized plan name
            let planName = 'Business'; // default
            const p = productName?.toLowerCase() || '';
            if (p.includes('specialist')) planName = 'Specialists';
            if (p.includes('agency')) planName = 'Agency';

            console.log(`Upgrading User ${userId} to Plan: ${planName}`);

            // Initialize Supabase Admin Client to bypass RLS
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            // Update user's profile with the new plan_name and reset usage
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ 
                    plan_name: planName, 
                    geo_score: 1, // Using geo_score > 0 as "has_plan" marker as per frontend logic
                    subscription_started_at: new Date().toISOString(),
                    audits_consumed: 0,
                    simulations_consumed: 0
                })
                .eq('id', userId);

            if (error) {
                console.error("Supabase Database Error:", error);
                throw error;
            }

            console.log(`Successfully upgraded user ${userId}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

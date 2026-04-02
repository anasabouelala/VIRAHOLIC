import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, businessInfo, userId } = await req.json();

    if (!projectId || !businessInfo || !userId) {
       return new Response(JSON.stringify({ error: 'Missing information' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
       return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set in Supabase Secrets' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // IMMEDIATELY return OK to the client so the UI can start polling
    // The rest of this function runs in the background
    EdgeRuntime.waitUntil((async () => {
        try {
            console.log(`Background work: Starting scan for ${businessInfo.name} in project ${projectId}`);
            
            // 1. Initial State: Set to running
            await supabase.from('audits').update({ status: 'running', progress: 5 }).eq('project_id', projectId);

            // 2. Here is where the 12-Agent Analysis will happen
            // For now, we simulate a very realistic background process that updates progress
            for (let i = 1; i <= 10; i++) {
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s per step
                await supabase.from('audits').update({ progress: 10 * i }).eq('project_id', projectId);
                console.log(`Background Progress: ${10 * i}%`);
            }

            // 3. Finalize: Set to completed
            // (In a real implementation, we would call the Gemini logic here and save final results)
            await supabase.from('audits').update({ status: 'completed', progress: 100 }).eq('project_id', projectId);

        } catch (error) {
            console.error('SERVER BACKGROUND ERROR:', error);
            await supabase.from('audits').update({ status: 'failed', error_message: error.message }).eq('project_id', projectId);
        }
    })());

    return new Response(JSON.stringify({ success: true, message: 'Background scan started' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

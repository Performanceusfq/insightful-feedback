import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    });
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return jsonResponse(500, { error: 'Server is not configured correctly' });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return jsonResponse(401, { error: 'Missing Authorization header' });
    }

    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) {
        return jsonResponse(401, { error: 'Invalid Authorization header' });
    }

    let payload: { userId: string };
    try {
        payload = await req.json();
    } catch {
        return jsonResponse(400, { error: 'Invalid JSON payload' });
    }

    const targetUserId = payload.userId?.trim();

    if (!targetUserId) {
        return jsonResponse(400, { error: 'userId is required' });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    const {
        data: { user: callerUser },
        error: callerUserError,
    } = await adminClient.auth.getUser(accessToken);

    if (callerUserError || !callerUser) {
        return jsonResponse(401, { error: 'Invalid auth token' });
    }

    const { data: adminRole, error: adminRoleError } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', callerUser.id)
        .eq('role', 'admin')
        .maybeSingle();

    if (adminRoleError || !adminRole) {
        return jsonResponse(403, { error: 'Only admins can delete users' });
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteUserError) {
        return jsonResponse(500, { error: 'Could not delete auth user' });
    }

    return jsonResponse(200, { success: true });
});

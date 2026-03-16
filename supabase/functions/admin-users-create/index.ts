import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: string;
}

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

    const requestId = crypto.randomUUID();
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

    let payload: CreateUserPayload;
    try {
        payload = await req.json() as CreateUserPayload;
    } catch {
        return jsonResponse(400, { error: 'Invalid JSON payload' });
    }

    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? '';
    const role = payload.role?.trim();

    if (!name || !email || !password || !role) {
        return jsonResponse(400, { error: 'name, email, password and role are required' });
    }

    if (password.length < 8) {
        return jsonResponse(400, { error: 'Temporary password must be at least 8 characters' });
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
        return jsonResponse(403, { error: 'Only admins can create users' });
    }

    const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existingProfile) {
        return jsonResponse(409, { error: 'Email already exists' });
    }

    let createdUserId: string | null = null;

    try {
        const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
        });

        if (createUserError) {
            if (/already|exists|registered/i.test(createUserError.message)) {
                return jsonResponse(409, { error: 'Email already exists in auth' });
            }
            return jsonResponse(500, { error: 'Could not create auth user' });
        }

        createdUserId = createdUserData.user!.id;

        const { error: updateProfileError } = await adminClient
            .from('profiles')
            .update({
                name,
                email,
                active_role: role,
            })
            .eq('id', createdUserId);

        if (updateProfileError) throw updateProfileError;

        const { error: upsertRoleError } = await adminClient
            .from('user_roles')
            .upsert({ user_id: createdUserId, role }, { onConflict: 'user_id,role', ignoreDuplicates: true });

        if (upsertRoleError) throw upsertRoleError;

        // Delete student role to avoid confusion
        await adminClient.from('user_roles').delete().eq('user_id', createdUserId).eq('role', 'estudiante');

        return jsonResponse(200, {
            userId: createdUserId,
            email,
            name,
            roles: [role],
        });
    } catch (error) {
        if (createdUserId) {
            await adminClient.auth.admin.deleteUser(createdUserId);
        }
        return jsonResponse(500, { error: 'Could not complete user creation' });
    }
});

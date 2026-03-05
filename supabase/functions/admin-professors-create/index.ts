import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateProfessorPayload {
  name: string;
  email: string;
  password: string;
  departmentId: string;
  keepStudentRole: boolean;
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
    console.error('[admin-professors-create] missing env vars', { requestId });
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

  let payload: CreateProfessorPayload;
  try {
    payload = await req.json() as CreateProfessorPayload;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? '';
  const departmentId = payload.departmentId?.trim();
  const keepStudentRole = Boolean(payload.keepStudentRole);

  if (!name || !email || !password || !departmentId) {
    return jsonResponse(400, { error: 'name, email, password and departmentId are required' });
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

  if (adminRoleError) {
    console.error('[admin-professors-create] admin role lookup failed', {
      requestId,
      callerUserId: callerUser.id,
      error: adminRoleError.message,
    });
    return jsonResponse(500, { error: 'Could not validate permissions' });
  }

  if (!adminRole) {
    return jsonResponse(403, { error: 'Only admins can create professors' });
  }

  const { data: department, error: departmentError } = await adminClient
    .from('departments')
    .select('id')
    .eq('id', departmentId)
    .maybeSingle();

  if (departmentError) {
    console.error('[admin-professors-create] department lookup failed', {
      requestId,
      callerUserId: callerUser.id,
      error: departmentError.message,
    });
    return jsonResponse(500, { error: 'Could not validate department' });
  }

  if (!department) {
    return jsonResponse(400, { error: 'Department does not exist' });
  }

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfileError) {
    console.error('[admin-professors-create] profile lookup failed', {
      requestId,
      callerUserId: callerUser.id,
      error: existingProfileError.message,
    });
    return jsonResponse(500, { error: 'Could not validate email uniqueness' });
  }

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
      const isEmailConflict = /already|exists|registered/i.test(createUserError.message);
      if (isEmailConflict) {
        return jsonResponse(409, { error: 'Email already exists' });
      }

      console.error('[admin-professors-create] auth user create failed', {
        requestId,
        callerUserId: callerUser.id,
        error: createUserError.message,
      });
      return jsonResponse(500, { error: 'Could not create auth user' });
    }

    const user = createdUserData.user;
    if (!user) {
      console.error('[admin-professors-create] auth user create returned empty user', {
        requestId,
        callerUserId: callerUser.id,
      });
      return jsonResponse(500, { error: 'Could not create auth user' });
    }

    createdUserId = user.id;

    const { error: updateProfileError } = await adminClient
      .from('profiles')
      .update({
        name,
        email,
        department_id: departmentId,
        active_role: 'profesor',
      })
      .eq('id', createdUserId);

    if (updateProfileError) {
      throw updateProfileError;
    }

    const { error: upsertProfessorRoleError } = await adminClient
      .from('user_roles')
      .upsert(
        {
          user_id: createdUserId,
          role: 'profesor',
        },
        {
          onConflict: 'user_id,role',
          ignoreDuplicates: true,
        },
      );

    if (upsertProfessorRoleError) {
      throw upsertProfessorRoleError;
    }

    if (!keepStudentRole) {
      const { error: deleteStudentRoleError } = await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', createdUserId)
        .eq('role', 'estudiante');

      if (deleteStudentRoleError) {
        throw deleteStudentRoleError;
      }
    }

    const { data: professor, error: createProfessorError } = await adminClient
      .from('professors')
      .insert({
        user_id: createdUserId,
        department_id: departmentId,
      })
      .select('id')
      .single();

    if (createProfessorError) {
      throw createProfessorError;
    }

    const roles = keepStudentRole ? ['profesor', 'estudiante'] : ['profesor'];

    console.log('[admin-professors-create] success', {
      requestId,
      callerUserId: callerUser.id,
      createdUserId,
      professorId: professor.id,
    });

    return jsonResponse(200, {
      professorId: professor.id,
      userId: createdUserId,
      email,
      name,
      departmentId,
      roles,
    });
  } catch (error) {
    console.error('[admin-professors-create] rollback attempt', {
      requestId,
      callerUserId: callerUser.id,
      createdUserId,
      error: error instanceof Error ? error.message : String(error),
    });

    if (createdUserId) {
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(createdUserId);
      if (rollbackError) {
        console.error('[admin-professors-create] rollback failed', {
          requestId,
          createdUserId,
          error: rollbackError.message,
        });
      }
    }

    return jsonResponse(500, { error: 'Could not complete professor creation' });
  }
});

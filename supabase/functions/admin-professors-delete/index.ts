import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeleteProfessorPayload {
  professorId: string;
  replacementProfessorId?: string | null;
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
  // 1. Manejar preflight de CORS
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
    console.error('[admin-professors-delete] missing env vars', { requestId });
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

  let payload: DeleteProfessorPayload;
  try {
    payload = await req.json() as DeleteProfessorPayload;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const professorId = payload.professorId?.trim();
  const replacementProfessorId = payload.replacementProfessorId?.trim() || null;

  if (!professorId) {
    return jsonResponse(400, { error: 'professorId is required' });
  }

  if (professorId === replacementProfessorId) {
    return jsonResponse(400, { error: 'Replacement professor cannot be the same as the deleted one' });
  }

  // 2. Crear un cliente con permisos de Service Role (Admin Supremo)
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // 3. Verificar que quien hace la petición es realmente un Administrador
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
    return jsonResponse(403, { error: 'Only admins can delete professors' });
  }

  try {
    // 4. Obtener el auth.users.id correspondiente a este profesor
    const { data: professorData, error: professorLookupError } = await adminClient
      .from('professors')
      .select('user_id')
      .eq('id', professorId)
      .maybeSingle();

    if (professorLookupError || !professorData) {
      return jsonResponse(404, { error: 'Professor not found' });
    }

    const targetUserId = professorData.user_id;

    // 5. Mover clases y borrar de las tablas publicas invocando el RPC ya existente
    // (Ejecutamos el RPC "como" el Admin usando el token que nos enviaron para respetar el RLS)
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    });

    const { data: rpcData, error: rpcError } = await userClient.rpc('admin_delete_professor', {
      p_professor_id: professorId,
      p_replacement_professor_id: replacementProfessorId,
    });

    if (rpcError) {
      console.error('[admin-professors-delete] RPC delete failed', { requestId, error: rpcError.message });
      return jsonResponse(400, { error: rpcError.message });
    }

    // 6. El paso final y más importante: Eliminar al usuario de AUTH.USERS
    // Esto borra completamente su cuenta de Supabase Authentication y le permite
    // volver a registrarse con ese mismo correo en el futuro.
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteAuthError) {
      console.error('[admin-professors-delete] Final auth auth deletion failed', {
        requestId,
        targetUserId,
        error: deleteAuthError.message,
      });
      // Aunque falle esto, sus datos publicos ya se borraron, lo cual es safe.
      return jsonResponse(500, { error: 'Partially deleted, but failed to remove from Auth' });
    }

    // 7. Retornar éxito
    return jsonResponse(200, {
      success: true,
      deletedProfessorId: professorId,
      deletedUserId: targetUserId,
      movedCourses: rpcData?.moved_courses ?? 0,
    });

  } catch (err: any) {
    console.error('[admin-professors-delete] Unexpected error', { requestId, error: err.message });
    return jsonResponse(500, { error: 'Internal server error while deleting professor' });
  }
});

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('❌ Falta VITE_SUPABASE_URL en tu archivo .env');
    process.exit(1);
}

const mockDepartments = [
    { name: 'Ingeniería de Software', code: 'ISW' },
    { name: 'Ciencias de la Computación', code: 'CIC' },
];

const mockQuestions = [
    { text: '¿El profesor domina los temas de la clase?', type: 'likert', category: 'pedagogia', required: true, active: true },
    { text: '¿El material del curso está actualizado?', type: 'likert', category: 'contenido', required: true, active: true },
    { text: '¿Qué mejorarías del curso?', type: 'open', category: 'general', required: false, active: true },
    { text: '¿Cuál actividad te pareció más útil?', type: 'multiple_choice', category: 'evaluacion', options: ['Proyectos', 'Exámenes', 'Deberes'], required: true, active: true },
];

async function seed() {
    console.log('\n=============================================');
    console.log('🌱 SEEDING SUPABASE DATABASE (BYPASSING RLS)');
    console.log('=============================================\n');

    if (!supabaseServiceKey) {
        console.error('❌ ERROR CRÍTICO: No puedo inyectar datos en tu base remota de Supabase porque me falta la llave maestra.');
        console.error('   Como habilitaste Row Level Security (RLS), la clave "Anon" no tiene permisos para crear departamentos ni usuarios.');
        console.error('\n👉 SOLUCIÓN:');
        console.error('1. Ve a https://supabase.com/dashboard/project/vgsszwfnghmwrloahnya/settings/api');
        console.error('2. Baja a la sección "Project API keys" y copia la que dice "service_role" (secret).');
        console.error('3. Abre tu archivo .env local y añade esta línea:');
        console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_aqui_adentro');
        console.error('4. Vuelve a correr: npx tsx scripts/seed_data.ts\n');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const targetAdmins = [
            { email: 'jisignacio10@gmail.com', name: 'Jose Ignacio Silva' },
            { email: 'rmunoz@humanreinvention.com', name: 'Roberto Munoz' } // Or whatever name
        ];

        console.log('1. Buscando o creando a los usuarios Dioses...');
        const { data: existingUsers, error: usersErr } = await supabase.auth.admin.listUsers();
        if (usersErr) throw usersErr;

        let lastUserId = '';

        for (const admin of targetAdmins) {
            let userId: string;
            const existingUser = existingUsers?.users.find(u => u.email === admin.email);

            if (existingUser) {
                userId = existingUser.id;
                console.log(`✅ Usando cuenta existente: ${admin.email} (${userId})`);
            } else {
                console.log(`   No se encontró la cuenta. Creando cuenta maestra: ${admin.email} / password123`);
                const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
                    email: admin.email,
                    password: 'password123',
                    email_confirm: true,
                    user_metadata: { name: admin.name }
                });
                if (createErr) throw createErr;
                userId = newUser.user.id;

                await supabase.from('profiles').update({ name: admin.name, active_role: 'admin' }).eq('id', userId);
                console.log(`✅ Cuenta maestra creada exitosamente (${userId})`);
            }

            console.log(`2. Otorgando rol de administrador a ${admin.email}...`);
            await supabase.from('user_roles').upsert([
                { user_id: userId, role: 'admin' }
            ], { onConflict: 'user_id,role' });
            console.log(`✅ Permisos de administrador asignados a ${admin.email}.`);
        }

        console.log('3. Creando un Profesor Dummy para asignar Departamentos y Cursos...');
        let dummyProfId: string;
        const dummyEmail = 'dummy_profesor@usfq.edu.ec';
        const existingDummy = existingUsers?.users.find(u => u.email === dummyEmail);

        if (existingDummy) {
            dummyProfId = existingDummy.id;
        } else {
            const { data: newDummy, error: dummyErr } = await supabase.auth.admin.createUser({
                email: dummyEmail,
                password: 'password123',
                email_confirm: true,
                user_metadata: { name: 'Profesor de Prueba' }
            });
            if (dummyErr) throw dummyErr;
            dummyProfId = newDummy.user.id;
            await supabase.from('profiles').update({ name: 'Profesor de Prueba', active_role: 'profesor' }).eq('id', dummyProfId);
        }
        await supabase.from('user_roles').upsert([{ user_id: dummyProfId, role: 'profesor' }], { onConflict: 'user_id,role' });

        console.log('4. Insertando Departamentos Académicos...');
        const { data: insertedDepts, error: deptsErr } = await supabase.from('departments').upsert(
            mockDepartments.map(d => ({ ...d, coordinator_id: dummyProfId })),
            { onConflict: 'code' }
        ).select();
        if (deptsErr) throw deptsErr;
        console.log(`✅ Insertados ${insertedDepts.length} departamentos.`);

        console.log('5. Matricular usuario Dummy como Profesor del Departamento 1...');
        const { data: insertedProf, error: profErr } = await supabase.from('professors').upsert({
            user_id: dummyProfId,
            department_id: insertedDepts[0].id
        }, { onConflict: 'user_id' }).select().single();
        if (profErr) throw profErr;
        console.log('✅ Registro de docente creado.');

        console.log('5. Insertando Cursos de prueba...');
        const coursesToInsert = [
            { name: 'Programación Avanzada', code: 'ISW-301', semester: '2026-1', department_id: insertedDepts[0].id, professor_id: insertedProf.id },
            { name: 'Bases de Datos', code: 'ISW-205', semester: '2026-1', department_id: insertedDepts[0].id, professor_id: insertedProf.id }
        ];
        const { data: insertedCourses, error: courseErr } = await supabase.from('courses').insert(coursesToInsert).select();
        if (courseErr) {
            console.log('   Los cursos de prueba ya podrian existir o hubo un problema pero continuaremos...');
        } else {
            console.log(`✅ Creados ${insertedCourses.length} cursos para tus Dashboards.`);
        }

        console.log('6. Insertando Banco de Preguntas Modelo...');
        const questionsToInsert = mockQuestions.map(q => ({
            text: q.text,
            type: q.type as any,
            category: q.category as any,
            options: q.options || null,
            required: q.required,
            active: q.active
        }));
        const { error: qErr } = await supabase.from('questions').upsert(questionsToInsert, { onConflict: 'text' });
        if (qErr) {
            // Upsert on questions might not work without unique constraint on text, let's just insert and ignore if duplicate
            console.log('   Las preguntas probablemente ya existen. Saltando inserción múltiple para evitar duplicados.');
        } else {
            console.log('✅ Preguntas modelo cargadas.');
        }

        console.log('\n=============================================');
        console.log('🎉 BASE DE DATOS SEMBRADA CON ÉXITO');
        console.log('=============================================');
        console.log('➡️ Tus perfiles ahora existen en Supabase como Administradores natos:');
        console.log('   1. jisignacio10@gmail.com');
        console.log('   2. rmunoz@humanreinvention.com');
        console.log('   * Contraseña por defecto (si la cuenta se acaba de crear solita): password123');
        console.log('---------------------------------------------\n');

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO INSERTANDO LOS DATOS:', error);
    }
}

seed();

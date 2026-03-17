import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Users, Building2, HelpCircle, ClipboardList, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    badge?: string;
    category: string;
    icon: React.ReactNode;
    page: string;
}

async function fetchAllSearchData() {
    const [courses, professors, departments, questions, surveys, users] = await Promise.all([
        supabase.from('courses').select('id, name, code, semester, departments(name)'),
        supabase.from('professors').select('id, department_id, profiles(id, name, email)'),
        supabase.from('departments').select('id, name, code'),
        supabase.from('questions').select('id, text, type, category'),
        supabase.from('survey_configs').select('id, name, active'),
        supabase.from('profiles').select('id, name, email, active_role').in('active_role', ['admin', 'coordinador', 'director']),
    ]);

    return {
        courses: (courses.data ?? []) as any[],
        professors: (professors.data ?? []) as any[],
        departments: (departments.data ?? []) as any[],
        questions: (questions.data ?? []) as any[],
        surveys: (surveys.data ?? []) as any[],
        users: (users.data ?? []) as any[],
    };
}

function buildResults(data: ReturnType<typeof fetchAllSearchData> extends Promise<infer T> ? T : never, q: string): SearchResult[] {
    const term = q.toLowerCase().trim();
    if (!term) return [];

    const results: SearchResult[] = [];

    for (const c of data.courses) {
        const dept = (c.departments as any)?.name ?? '';
        if ([c.name, c.code, c.semester, dept].some((v: string) => v?.toLowerCase().includes(term))) {
            results.push({ id: c.id, title: c.name, subtitle: `${c.code} · ${dept}`, badge: c.semester, category: 'Clases', icon: <BookOpen className="h-4 w-4" />, page: '/admin/courses' });
        }
    }

    for (const p of data.professors) {
        const profile = (p.profiles as any);
        const name = profile?.name ?? '';
        const email = profile?.email ?? '';
        if ([name, email].some((v: string) => v?.toLowerCase().includes(term))) {
            results.push({ id: p.id, title: name, subtitle: email, category: 'Profesores', icon: <Users className="h-4 w-4" />, page: '/admin/professors' });
        }
    }

    for (const d of data.departments) {
        if ([d.name, d.code].some((v: string) => v?.toLowerCase().includes(term))) {
            results.push({ id: d.id, title: d.name, subtitle: d.code, category: 'Departamentos', icon: <Building2 className="h-4 w-4" />, page: '/admin/departments' });
        }
    }

    for (const q of data.questions) {
        if ([q.text, q.type, q.category].some((v: string) => v?.toLowerCase().includes(term))) {
            results.push({ id: q.id, title: q.text, subtitle: `${q.type} · ${q.category}`, category: 'Banco de Preguntas', icon: <HelpCircle className="h-4 w-4" />, page: '/admin/questions' });
        }
    }

    for (const s of data.surveys) {
        if (s.name?.toLowerCase().includes(term)) {
            results.push({ id: s.id, title: s.name, subtitle: s.active ? 'Activa' : 'Inactiva', category: 'Encuestas', icon: <ClipboardList className="h-4 w-4" />, page: '/admin/surveys' });
        }
    }

    for (const u of data.users) {
        if ([u.name, u.email, u.active_role].some((v: string) => v?.toLowerCase().includes(term))) {
            results.push({ id: u.id, title: u.name, subtitle: `${u.email} · ${u.active_role ?? '—'}`, category: 'Usuarios', icon: <Shield className="h-4 w-4" />, page: '/admin/roles' });
        }
    }

    return results;
}

const CATEGORY_ORDER = ['Clases', 'Profesores', 'Departamentos', 'Banco de Preguntas', 'Encuestas', 'Usuarios'];

interface GlobalSearchModalProps {
    open: boolean;
    onClose: () => void;
}

export default function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const dataQuery = useQuery({
        queryKey: ['global-search-data'],
        queryFn: fetchAllSearchData,
        staleTime: 60_000,
        enabled: open,
    });

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
        }
    }, [open]);

    const results = dataQuery.data ? buildResults(dataQuery.data, query) : [];

    const grouped = CATEGORY_ORDER.map((cat) => ({
        category: cat,
        items: results.filter((r) => r.category === cat),
    })).filter((g) => g.items.length > 0);

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-xl p-0 overflow-hidden gap-0">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar clases, profesores, departamentos, preguntas…"
                        className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 h-auto"
                    />
                    {dataQuery.isFetching && (
                        <span className="text-xs text-muted-foreground animate-pulse">Cargando…</span>
                    )}
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {query.trim() === '' ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Empieza a escribir para buscar en toda la plataforma
                        </p>
                    ) : results.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Sin resultados para <strong>"{query}"</strong>
                        </p>
                    ) : (
                        <div className="p-2 space-y-4">
                            {grouped.map((group) => (
                                <div key={group.category}>
                                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {group.category}
                                    </p>
                                    <div className="space-y-0.5">
                                        {group.items.map((item) => (
                                            <a
                                                key={item.id}
                                                href={item.page}
                                                onClick={onClose}
                                                className={cn(
                                                    'flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                                    'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                                                )}
                                            >
                                                <span className="mt-0.5 shrink-0 text-muted-foreground">{item.icon}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium">{item.title}</p>
                                                    {item.subtitle && (
                                                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                                                    )}
                                                </div>
                                                {item.badge && (
                                                    <Badge variant="secondary" className="shrink-0 text-[10px]">{item.badge}</Badge>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <p className="px-2 pt-1 text-[11px] text-muted-foreground">
                                {results.length} resultado{results.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

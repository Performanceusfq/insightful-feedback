import { Department, Professor, Course, User, UserRole, AppRole } from '@/types/domain';

export const mockDepartments: Department[] = [
  { id: 'd1', name: 'Ingeniería de Software', code: 'ISW', coordinatorId: 'u3' },
  { id: 'd2', name: 'Ciencias de la Computación', code: 'CIC', coordinatorId: undefined },
  { id: 'd3', name: 'Matemáticas Aplicadas', code: 'MAT', coordinatorId: undefined },
];

export const mockProfessors: Professor[] = [
  { id: 'p1', userId: 'u2', name: 'Dr. Carlos Mendoza', email: 'cmendoza@uni.edu', departmentId: 'd1' },
  { id: 'p2', userId: 'u5', name: 'Dra. Ana López', email: 'alopez@uni.edu', departmentId: 'd1' },
  { id: 'p3', userId: 'u6', name: 'Dr. Roberto Sánchez', email: 'rsanchez@uni.edu', departmentId: 'd2' },
  { id: 'p4', userId: 'u7', name: 'Dra. María García', email: 'mgarcia@uni.edu', departmentId: 'd3' },
];

export const mockCourses: Course[] = [
  { id: 'c1', name: 'Programación Avanzada', code: 'ISW-301', departmentId: 'd1', professorId: 'p1', semester: '2026-1' },
  { id: 'c2', name: 'Bases de Datos', code: 'ISW-205', departmentId: 'd1', professorId: 'p2', semester: '2026-1' },
  { id: 'c3', name: 'Inteligencia Artificial', code: 'CIC-401', departmentId: 'd2', professorId: 'p3', semester: '2026-1' },
  { id: 'c4', name: 'Cálculo Diferencial', code: 'MAT-101', departmentId: 'd3', professorId: 'p4', semester: '2026-1' },
];

export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@uni.edu', name: 'Admin Sistema', roles: ['admin'], activeRole: 'admin' },
  { id: 'u2', email: 'cmendoza@uni.edu', name: 'Dr. Carlos Mendoza', roles: ['profesor'], activeRole: 'profesor' },
  { id: 'u3', email: 'coord@uni.edu', name: 'Coordinador ISW', roles: ['coordinador', 'profesor'], activeRole: 'coordinador', departmentId: 'd1' },
  { id: 'u4', email: 'director@uni.edu', name: 'Director Académico', roles: ['director'], activeRole: 'director' },
  { id: 'u5', email: 'alopez@uni.edu', name: 'Dra. Ana López', roles: ['profesor'], activeRole: 'profesor' },
  { id: 'u6', email: 'rsanchez@uni.edu', name: 'Dr. Roberto Sánchez', roles: ['profesor'], activeRole: 'profesor' },
  { id: 'u7', email: 'mgarcia@uni.edu', name: 'Dra. María García', roles: ['profesor'], activeRole: 'profesor' },
  { id: 'u8', email: 'estudiante1@uni.edu', name: 'Juan Pérez', roles: ['estudiante'], activeRole: 'estudiante' },
];

export const mockUserRoles: UserRole[] = [
  { id: 'ur1', userId: 'u1', role: 'admin' },
  { id: 'ur2', userId: 'u2', role: 'profesor' },
  { id: 'ur3', userId: 'u3', role: 'coordinador' },
  { id: 'ur4', userId: 'u3', role: 'profesor' },
  { id: 'ur5', userId: 'u4', role: 'director' },
  { id: 'ur6', userId: 'u5', role: 'profesor' },
  { id: 'ur7', userId: 'u6', role: 'profesor' },
  { id: 'ur8', userId: 'u7', role: 'profesor' },
  { id: 'ur9', userId: 'u8', role: 'estudiante' },
];

export const roleLabels: Record<AppRole, string> = {
  estudiante: 'Estudiante',
  profesor: 'Profesor',
  admin: 'Administrador',
  coordinador: 'Coordinador',
  director: 'Director',
};

export const roleIcons: Record<AppRole, string> = {
  estudiante: 'GraduationCap',
  profesor: 'BookOpen',
  admin: 'Settings',
  coordinador: 'Users',
  director: 'Building2',
};

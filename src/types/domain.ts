export type AppRole = 'estudiante' | 'profesor' | 'admin' | 'coordinador' | 'director';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  activeRole: AppRole;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  coordinatorId?: string;
}

export interface Professor {
  id: string;
  userId: string;
  name: string;
  email: string;
  departmentId: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  professorId: string;
  semester: string;
}

export interface UserRole {
  id: string;
  userId: string;
  role: AppRole;
}

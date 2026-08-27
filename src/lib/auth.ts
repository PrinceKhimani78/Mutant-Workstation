import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'mutant-workstation-super-secret-key-2026';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        avatarUrl: true,
        phone: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

// Role-Based Permissions Matrix
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: ['ALL'],
  'Sales Manager': ['CRM_READ', 'CRM_WRITE', 'CLIENTS_READ', 'CLIENTS_WRITE', 'REPORTS_READ'],
  'Sales Executive': ['CRM_READ', 'CRM_WRITE'],
  'Marketing Manager': ['CRM_READ', 'CRM_WRITE', 'CLIENTS_READ', 'REPORTS_READ', 'ASSETS_WRITE', 'KB_READ', 'KB_WRITE'],
  'Marketing Executive': ['CRM_READ', 'CRM_WRITE', 'CLIENTS_READ', 'ASSETS_WRITE', 'KB_READ'],
  Marketing: ['CRM_READ', 'CLIENTS_READ', 'ASSETS_WRITE', 'KB_READ'],
  'Project Manager': ['PROJECTS_READ', 'PROJECTS_WRITE', 'TASKS_READ', 'TASKS_WRITE', 'CLIENTS_READ', 'TIME_READ'],
  Developer: ['PROJECTS_READ', 'TASKS_READ', 'TASKS_WRITE', 'TIME_WRITE', 'KB_READ'],
  Designer: ['PROJECTS_READ', 'TASKS_READ', 'TASKS_WRITE', 'TIME_WRITE', 'ASSETS_WRITE'],
  HR: ['EMPLOYEES_READ', 'EMPLOYEES_WRITE', 'LEAVES_READ', 'LEAVES_WRITE'],
  Finance: ['FINANCE_READ', 'FINANCE_WRITE', 'INVOICES_READ', 'INVOICES_WRITE', 'REPORTS_READ'],
  Accountant: ['FINANCE_READ', 'INVOICES_READ', 'INVOICES_WRITE'],
};

export function hasPermission(role: string, permission: string): boolean {
  if (role === 'Owner') return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('ALL') || permissions.includes(permission);
}

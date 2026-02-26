import { ClassEventConfig, ClassEvent } from '@/types/domain';

export const mockEventConfigs: ClassEventConfig[] = [
  {
    id: 'ec1',
    courseId: 'c1',
    surveyConfigId: 's1',
    frequency: 'per_class',
    expirationMinutes: 15,
    scheduledDays: [1, 3], // Lun, Mié
    scheduledTime: '10:00',
    active: true,
  },
  {
    id: 'ec2',
    courseId: 'c2',
    surveyConfigId: 's2',
    frequency: 'weekly',
    expirationMinutes: 20,
    scheduledDays: [2, 4], // Mar, Jue
    scheduledTime: '14:00',
    active: true,
  },
  {
    id: 'ec3',
    courseId: 'c3',
    surveyConfigId: '',
    frequency: 'manual',
    expirationMinutes: 10,
    scheduledDays: [],
    scheduledTime: '09:00',
    active: false,
  },
];

function generateToken(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const now = new Date();
const pastEvent = new Date(now.getTime() - 60 * 60 * 1000); // 1h ago
const futureEvent = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now

export const mockEvents: ClassEvent[] = [
  {
    id: 'ev1',
    configId: 'ec1',
    courseId: 'c1',
    qrCode: generateToken(),
    status: 'expired',
    createdAt: new Date(pastEvent.getTime() - 15 * 60 * 1000).toISOString(),
    expiresAt: pastEvent.toISOString(),
    responsesCount: 28,
  },
  {
    id: 'ev2',
    configId: 'ec1',
    courseId: 'c1',
    qrCode: generateToken(),
    status: 'active',
    createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    expiresAt: futureEvent.toISOString(),
    responsesCount: 12,
  },
  {
    id: 'ev3',
    configId: 'ec2',
    courseId: 'c2',
    qrCode: generateToken(),
    status: 'scheduled',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
    responsesCount: 0,
  },
];

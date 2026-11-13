import { z } from 'zod';
import { MAINTENANCE_TASK_TYPES, RISK_LEVELS } from '../constants/maintenanceTypes.js';

export const automationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minimumTasks: z.number().int().min(1).max(20).default(2),
  maximumTasks: z.number().int().min(1).max(30).default(6),
  timezone: z.string().default('IST'),
  preferredExecutionTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  requireApproval: z.boolean().default(true),
  allowedMaintenanceTypes: z.array(z.nativeEnum(MAINTENANCE_TASK_TYPES)).min(1),
  excludedPaths: z.array(z.string()).default(['node_modules', 'dist', '.git']),
  maxFilesPerExecution: z.number().int().min(1).max(20).default(5),
  maxChangesPerFile: z.number().int().min(1).max(500).default(100),
}).refine(data => data.minimumTasks <= data.maximumTasks, {
  message: 'minimumTasks must be less than or equal to maximumTasks',
  path: ['minimumTasks'],
});

export const scheduleSchema = z.object({
  repositoryIds: z.array(z.string()).min(1, 'Select at least one repository'),
  enabled: z.boolean().default(true),
  timezone: z.string().default('IST'),
  executionTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one day of the week'),
});

export const repositoryToggleSchema = z.object({
  enabled: z.boolean(),
});

export const taskApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});


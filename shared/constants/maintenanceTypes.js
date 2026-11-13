/**
 * GitGry Shared Maintenance Constants
 * Defines approved, legitimate task types and risk classifications.
 */

export const MAINTENANCE_TASK_TYPES = {
  DOCUMENTATION: 'documentation',
  TESTING: 'testing',
  DEPENDENCIES: 'dependencies',
  LINT_FORMAT: 'lint_format',
  CONFIG_MAINTENANCE: 'config_maintenance',
  BUG_FIX: 'bug_fix',
};

export const TASK_TYPE_LABELS = {
  [MAINTENANCE_TASK_TYPES.DOCUMENTATION]: 'Documentation Improvement',
  [MAINTENANCE_TASK_TYPES.TESTING]: 'Test Coverage & Quality',
  [MAINTENANCE_TASK_TYPES.DEPENDENCIES]: 'Dependency Maintenance',
  [MAINTENANCE_TASK_TYPES.LINT_FORMAT]: 'Code Formatting & Linting',
  [MAINTENANCE_TASK_TYPES.CONFIG_MAINTENANCE]: 'Configuration Maintenance',
  [MAINTENANCE_TASK_TYPES.BUG_FIX]: 'Bug Fix & Error Handling',
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const TASK_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

export const EXECUTION_STATUSES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const DEFAULT_AUTOMATION_CONFIG = {
  enabled: true,
  minimumTasks: 2,
  maximumTasks: 6,
  timezone: 'IST',
  preferredExecutionTime: '09:00',
  requireApproval: true,
  allowedMaintenanceTypes: [
    MAINTENANCE_TASK_TYPES.DOCUMENTATION,
    MAINTENANCE_TASK_TYPES.LINT_FORMAT,
    MAINTENANCE_TASK_TYPES.CONFIG_MAINTENANCE,
  ],
  excludedPaths: ['node_modules', 'dist', 'build', '.git', 'vendor', '.env'],
  maxFilesPerExecution: 5,
  maxChangesPerFile: 100,
};


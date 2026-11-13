import mongoose from 'mongoose';
import { MAINTENANCE_TASK_TYPES } from '../../../shared/constants/maintenanceTypes.js';

const automationConfigSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    minimumTasks: {
      type: Number,
      default: 2,
      min: 1,
      max: 20,
    },
    maximumTasks: {
      type: Number,
      default: 6,
      min: 1,
      max: 30,
    },
    timezone: {
      type: String,
      default: 'IST',
    },
    preferredExecutionTime: {
      type: String,
      default: '09:00',
    },
    requireApproval: {
      type: Boolean,
      default: true,
    },
    allowedMaintenanceTypes: {
      type: [String],
      enum: Object.values(MAINTENANCE_TASK_TYPES),
      default: [
        MAINTENANCE_TASK_TYPES.DOCUMENTATION,
        MAINTENANCE_TASK_TYPES.LINT_FORMAT,
        MAINTENANCE_TASK_TYPES.CONFIG_MAINTENANCE,
      ],
    },
    excludedPaths: {
      type: [String],
      default: ['node_modules', 'dist', 'build', '.git', 'vendor', '.env'],
    },
    maxFilesPerExecution: {
      type: Number,
      default: 5,
    },
    maxChangesPerFile: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

export const AutomationConfig = mongoose.model('AutomationConfig', automationConfigSchema);


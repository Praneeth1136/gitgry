import mongoose from 'mongoose';
import './Repository.js';
import './User.js';
import {
  MAINTENANCE_TASK_TYPES,
  RISK_LEVELS,
  TASK_STATUSES,
} from '../../../shared/constants/maintenanceTypes.js';

const maintenanceTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    taskType: {
      type: String,
      enum: Object.values(MAINTENANCE_TASK_TYPES),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    affectedFiles: {
      type: [String],
      default: [],
    },
    proposedChanges: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      default: RISK_LEVELS.LOW,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUSES),
      default: TASK_STATUSES.PENDING,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    validationResults: {
      type: mongoose.Schema.Types.Mixed,
      default: { isValid: true, checks: [] },
    },
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying tasks by status and repository
maintenanceTaskSchema.index({ repositoryId: 1, status: 1 });
maintenanceTaskSchema.index({ userId: 1, approvalStatus: 1 });

export const MaintenanceTask = mongoose.model('MaintenanceTask', maintenanceTaskSchema);


import mongoose from 'mongoose';
import './Repository.js';
import './User.js';
import './MaintenanceTask.js';
import { EXECUTION_STATUSES } from '../../../shared/constants/maintenanceTypes.js';

const executionSchema = new mongoose.Schema(
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
    maintenanceTaskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaintenanceTask',
      },
    ],
    githubWorkflowRunId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EXECUTION_STATUSES),
      default: EXECUTION_STATUSES.QUEUED,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    totalTasks: {
      type: Number,
      default: 0,
    },
    successfulTasks: {
      type: Number,
      default: 0,
    },
    failedTasks: {
      type: Number,
      default: 0,
    },
    logs: {
      type: [String],
      default: [],
    },
    errorMessage: {
      type: String,
    },
    githubRunUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

executionSchema.index({ userId: 1, createdAt: -1 });

export const Execution = mongoose.model('Execution', executionSchema);


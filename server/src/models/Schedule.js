import mongoose from 'mongoose';
import './Repository.js';
import './User.js';

const scheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repositoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'IST',
    },
    executionTime: {
      type: String,
      required: true,
    },
    daysOfWeek: {
      type: [Number], // 0 = Sunday, 1 = Monday, etc.
      default: [1, 2, 3, 4, 5], // Weekdays default
    },
  },
  {
    timestamps: true,
  }
);

export const Schedule = mongoose.model('Schedule', scheduleSchema);


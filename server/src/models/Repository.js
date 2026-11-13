import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    githubRepoId: {
      type: Number,
      required: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    htmlUrl: {
      type: String,
      required: true,
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    description: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'JavaScript',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastAnalyzedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index per user and githubRepoId to prevent duplicates
repositorySchema.index({ userId: 1, githubRepoId: 1 }, { unique: true });

export const Repository = mongoose.model('Repository', repositorySchema);


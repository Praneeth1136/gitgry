import { Execution } from '../models/Execution.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { TASK_STATUSES, EXECUTION_STATUSES } from '../../../shared/constants/maintenanceTypes.js';

export async function getExecutions(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const total = await Execution.countDocuments(query);
    const executions = await Execution.find(query)
      .populate('repositoryId', 'name fullName owner')
      .populate('maintenanceTaskIds', 'title taskType riskLevel status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      data: {
        executions,
        pagination: {
          total,
          page: parseInt(page, 10),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getExecutionById(req, res, next) {
  try {
    const execution = await Execution.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('repositoryId', 'name fullName owner defaultBranch htmlUrl')
      .populate('maintenanceTaskIds');

    if (!execution) {
      return res.status(404).json({ success: false, error: 'Execution not found' });
    }

    res.json({ success: true, data: execution });
  } catch (error) {
    next(error);
  }
}

export async function getExecutionLogs(req, res, next) {
  try {
    const execution = await Execution.findOne({ _id: req.params.id, userId: req.user._id })
      .select('logs status errorMessage');

    if (!execution) {
      return res.status(404).json({ success: false, error: 'Execution not found' });
    }

    res.json({ success: true, data: execution });
  } catch (error) {
    next(error);
  }
}

/**
 * Webhook callback endpoint called by GitHub Actions runner to sync status.
 */
export async function syncExecution(req, res, next) {
  try {
    const { executionId, taskId, status, runId, runUrl, error } = req.body;

    const execution = await Execution.findById(executionId);
    if (!execution) {
      return res.status(404).json({ success: false, error: 'Execution record not found' });
    }

    if (runId) execution.githubWorkflowRunId = runId;
    if (runUrl) execution.githubRunUrl = runUrl;

    if (status === 'success' || status === 'completed') {
      execution.status = EXECUTION_STATUSES.COMPLETED;
      execution.completedAt = new Date();
      execution.successfulTasks = 1;
      execution.logs.push(`GitHub Actions workflow run completed successfully: ${runUrl || runId}`);

      if (taskId) {
        await MaintenanceTask.findByIdAndUpdate(taskId, {
          status: TASK_STATUSES.COMPLETED,
          completedAt: new Date(),
        });
      }
    } else if (status === 'failure' || status === 'failed') {
      execution.status = EXECUTION_STATUSES.FAILED;
      execution.completedAt = new Date();
      execution.failedTasks = 1;
      execution.errorMessage = error || 'Workflow run failed';
      execution.logs.push(`GitHub Actions execution failed: ${error || 'Unknown error'}`);

      if (taskId) {
        await MaintenanceTask.findByIdAndUpdate(taskId, {
          status: TASK_STATUSES.FAILED,
        });
      }
    }

    await execution.save();
    res.json({ success: true, message: 'Execution status synchronized' });
  } catch (error) {
    next(error);
  }
}


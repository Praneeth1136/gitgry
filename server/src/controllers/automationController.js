import { AutomationConfig } from '../models/AutomationConfig.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { planDailyMaintenance, executeApprovedTask } from '../services/automationService.js';
import { DEFAULT_AUTOMATION_CONFIG, TASK_STATUSES } from '../../../shared/constants/maintenanceTypes.js';

export async function getConfig(req, res, next) {
  try {
    let config = await AutomationConfig.findOne({ userId: req.user._id });
    if (!config) {
      config = await AutomationConfig.create({
        userId: req.user._id,
        ...DEFAULT_AUTOMATION_CONFIG,
      });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function updateConfig(req, res, next) {
  try {
    const config = await AutomationConfig.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function generatePlan(req, res, next) {
  try {
    const planResult = await planDailyMaintenance(req.user._id, req.githubToken);
    res.json({ success: true, data: planResult });
  } catch (error) {
    next(error);
  }
}

export async function runApprovedTasks(req, res, next) {
  try {
    const approvedTasks = await MaintenanceTask.find({
      userId: req.user._id,
      approvalStatus: 'approved',
      status: { $in: [TASK_STATUSES.PENDING, TASK_STATUSES.APPROVED] },
      completedAt: null,
    });

    if (approvedTasks.length === 0) {
      return res.json({
        success: true,
        message: 'No approved pending tasks found to execute.',
        executed: 0,
      });
    }

    const results = [];
    for (const task of approvedTasks) {
      try {
        const result = await executeApprovedTask(req.user._id, task._id, req.githubToken);
        results.push({ taskId: task._id, success: true, executionId: result.execution._id });
      } catch (err) {
        results.push({ taskId: task._id, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Executed ${results.filter(r => r.success).length} of ${approvedTasks.length} tasks`,
      results,
    });
  } catch (error) {
    next(error);
  }
}

export async function pauseAutomation(req, res, next) {
  try {
    const config = await AutomationConfig.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { enabled: false } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: config, message: 'Automation paused' });
  } catch (error) {
    next(error);
  }
}

export async function resumeAutomation(req, res, next) {
  try {
    const config = await AutomationConfig.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { enabled: true } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: config, message: 'Automation resumed' });
  } catch (error) {
    next(error);
  }
}


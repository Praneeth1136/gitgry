import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { executeApprovedTask } from '../services/automationService.js';
import { TASK_STATUSES } from '../../../shared/constants/maintenanceTypes.js';

export async function getTasks(req, res, next) {
  try {
    const { status, approvalStatus, repositoryId, riskLevel, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (repositoryId) query.repositoryId = repositoryId;
    if (riskLevel) query.riskLevel = riskLevel;

    const total = await MaintenanceTask.countDocuments(query);
    const tasks = await MaintenanceTask.find(query)
      .populate('repositoryId', 'name fullName owner defaultBranch')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      data: {
        tasks,
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

export async function getTaskById(req, res, next) {
  try {
    const task = await MaintenanceTask.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('repositoryId', 'name fullName owner defaultBranch');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Maintenance task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function approveTask(req, res, next) {
  try {
    const task = await MaintenanceTask.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $set: {
          approvalStatus: 'approved',
          approvedAt: new Date(),
          status: TASK_STATUSES.APPROVED,
        },
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, error: 'Maintenance task not found' });
    }

    res.json({ success: true, data: task, message: 'Task approved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function rejectTask(req, res, next) {
  try {
    const { reason } = req.body;
    const task = await MaintenanceTask.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $set: {
          approvalStatus: 'rejected',
          status: TASK_STATUSES.REJECTED,
          rejectionReason: reason || 'Rejected by user',
        },
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, error: 'Maintenance task not found' });
    }

    res.json({ success: true, data: task, message: 'Task rejected' });
  } catch (error) {
    next(error);
  }
}

export async function executeTask(req, res, next) {
  try {
    const result = await executeApprovedTask(req.user._id, req.params.id, req.githubToken);
    res.json({ success: true, data: result, message: 'Task execution started' });
  } catch (error) {
    next(error);
  }
}


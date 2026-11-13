import { Repository } from '../models/Repository.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { Execution } from '../models/Execution.js';
import { Schedule } from '../models/Schedule.js';
import { TASK_STATUSES, EXECUTION_STATUSES } from '../../../shared/constants/maintenanceTypes.js';

export async function getOverview(req, res, next) {
  try {
    const userId = req.user._id;

    const [totalRepos, enabledRepos, totalTasks, pendingApprovals, completedTasks, recentExecutions] =
      await Promise.all([
        Repository.countDocuments({ userId }),
        Repository.countDocuments({ userId, enabled: true }),
        MaintenanceTask.countDocuments({ userId }),
        MaintenanceTask.countDocuments({ userId, approvalStatus: 'pending' }),
        MaintenanceTask.countDocuments({ userId, status: TASK_STATUSES.COMPLETED }),
        Execution.find({ userId })
          .populate('repositoryId', 'name fullName')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    // Next scheduled execution info
    const activeSchedule = await Schedule.findOne({ userId, enabled: true }).sort({ executionTime: 1 });

    res.json({
      success: true,
      data: {
        totalRepos,
        enabledRepos,
        totalTasks,
        pendingApprovals,
        completedTasks,
        recentExecutions,
        nextSchedule: activeSchedule
          ? {
              time: activeSchedule.executionTime,
              timezone: activeSchedule.timezone,
              daysOfWeek: activeSchedule.daysOfWeek,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getActivity(req, res, next) {
  try {
    const userId = req.user._id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Group executions or completed tasks by day
    const tasks = await MaintenanceTask.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    }).select('createdAt status taskType riskLevel');

    const daysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      daysMap[dateKey] = { date: dateKey, completed: 0, planned: 0, pending: 0 };
    }

    for (const task of tasks) {
      const dateKey = task.createdAt.toISOString().split('T')[0];
      if (daysMap[dateKey]) {
        if (task.status === TASK_STATUSES.COMPLETED) {
          daysMap[dateKey].completed += 1;
        } else if (task.approvalStatus === 'pending') {
          daysMap[dateKey].pending += 1;
        } else {
          daysMap[dateKey].planned += 1;
        }
      }
    }

    const activityData = Object.values(daysMap);
    res.json({ success: true, data: activityData });
  } catch (error) {
    next(error);
  }
}

export async function getRepositoryStats(req, res, next) {
  try {
    const userId = req.user._id;

    const repos = await Repository.find({ userId });
    const repoStats = await Promise.all(
      repos.map(async repo => {
        const [totalTasks, completedTasks, executions] = await Promise.all([
          MaintenanceTask.countDocuments({ repositoryId: repo._id }),
          MaintenanceTask.countDocuments({ repositoryId: repo._id, status: TASK_STATUSES.COMPLETED }),
          Execution.countDocuments({ repositoryId: repo._id, status: EXECUTION_STATUSES.COMPLETED }),
        ]);

        return {
          repositoryId: repo._id,
          name: repo.name,
          fullName: repo.fullName,
          language: repo.language,
          enabled: repo.enabled,
          totalTasks,
          completedTasks,
          successfulExecutions: executions,
        };
      })
    );

    res.json({ success: true, data: repoStats });
  } catch (error) {
    next(error);
  }
}


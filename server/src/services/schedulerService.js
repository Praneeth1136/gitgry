import { Schedule } from '../models/Schedule.js';
import { User } from '../models/User.js';
import { AutomationConfig } from '../models/AutomationConfig.js';
import { planDailyMaintenance, executeApprovedTask } from './automationService.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { TASK_STATUSES } from '../../../shared/constants/maintenanceTypes.js';
import { decryptToken } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

let schedulerInterval = null;
const lastExecutedMinutes = new Set(); // Prevent duplicate runs within same minute

function getLocalTimeInfo(timezone) {
  const now = new Date();
  
  // Standardize common timezone abbreviations
  let tz = timezone || 'UTC';
  if (tz === 'IST') tz = 'Asia/Kolkata';
  if (tz === 'EST') tz = 'America/New_York';
  if (tz === 'PST') tz = 'America/Los_Angeles';

  try {
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
    });
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const timeString = timeFormatter.format(now); // "12:45"
    const weekday = dayFormatter.format(now); // "Sat"
    const dateString = dateFormatter.format(now); // "2026-11-14"
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    
    return {
      time: timeString,
      day: dayMap[weekday] ?? now.getDay(),
      date: dateString,
      dateKey: `${dateString}_${timeString}`,
    };
  } catch (err) {
    // Fallback to UTC
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    const dateStr = now.toISOString().slice(0, 10);
    return {
      time: `${hours}:${mins}`,
      day: now.getUTCDay(),
      date: dateStr,
      dateKey: `${dateStr}_${hours}:${mins}`,
    };
  }
}

export async function checkAndRunSchedules(force = false) {
  try {
    const schedules = await Schedule.find({ enabled: true });
    if (!schedules.length) return { executed: 0 };

    let totalExecuted = 0;

    for (const schedule of schedules) {
      const { time, day, date, dateKey } = getLocalTimeInfo(schedule.timezone);
      const executionKey = `${schedule._id}_${dateKey}`;

      const isDayActive = schedule.daysOfWeek?.includes(day);
      // Schedule is due if force is requested, OR today is an active day, current time has reached or passed scheduled time, and it has not run yet today!
      const isDueToday = isDayActive && time >= schedule.executionTime && schedule.lastRunDate !== date;

      if (force || isDueToday) {
        if (!force && lastExecutedMinutes.has(executionKey)) {
          continue; // Already processed in this minute
        }
        if (!force) lastExecutedMinutes.add(executionKey);

        // Mark executed for today in DB
        await Schedule.findByIdAndUpdate(schedule._id, { lastRunDate: date });

        logger.info(`[Scheduler] Triggering scheduled maintenance for user: ${schedule.userId} at ${time} (${schedule.timezone}) [Scheduled: ${schedule.executionTime}]${force ? ' [FORCE_TRIGGER]' : ''}`);

        // Fetch user and decrypted token
        const user = await User.findById(schedule.userId).select('+accessTokenEncrypted');
        if (!user) continue;

        let plainToken = null;
        try {
          plainToken = decryptToken(user.accessTokenEncrypted);
        } catch (err) {
          logger.error(`[Scheduler] Token decryption failed for user ${user.username}`);
          continue;
        }

        // 1. Plan maintenance tasks for selected repositories
        const planResult = await planDailyMaintenance(user._id, plainToken, schedule.repositoryIds);
        logger.info(`[Scheduler] Generated ${planResult.plannedCount} tasks for ${user.username}`);

        // 2. Check if user requires approval
        const config = await AutomationConfig.findOne({ userId: user._id });
        const requireApproval = config?.requireApproval ?? true;

        if (!requireApproval) {
          // Auto-execute approved tasks without waiting for manual human intervention
          const approvedTasks = await MaintenanceTask.find({
            userId: user._id,
            approvalStatus: 'approved',
            status: { $in: [TASK_STATUSES.PENDING, TASK_STATUSES.APPROVED] },
            completedAt: null,
          });

          for (const task of approvedTasks) {
            try {
              await executeApprovedTask(user._id, task._id, plainToken);
              logger.info(`[Scheduler] Auto-executed task: ${task.title}`);
            } catch (execErr) {
              logger.error({ err: execErr.message }, `[Scheduler] Execution error on task ${task.title}`);
            }
          }
        }
      }
    }

    // Keep set bounded to avoid memory growth
    if (lastExecutedMinutes.size > 1000) {
      lastExecutedMinutes.clear();
    }
  } catch (error) {
    logger.error({ err: error.message }, '[Scheduler] Error checking schedules');
  }
}

export function startScheduler() {
  if (schedulerInterval) return;
  logger.info('[Scheduler] Background schedule runner started (checking every 60s)');
  schedulerInterval = setInterval(checkAndRunSchedules, 60000);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('[Scheduler] Background schedule runner stopped');
  }
}


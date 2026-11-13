import { Schedule } from '../models/Schedule.js';

export async function getSchedules(req, res, next) {
  try {
    const schedules = await Schedule.find({ userId: req.user._id })
      .populate('repositoryIds', 'name fullName owner')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req, res, next) {
  try {
    const { repositoryIds, enabled, timezone, executionTime, daysOfWeek } = req.body;

    const schedule = await Schedule.create({
      userId: req.user._id,
      repositoryIds,
      enabled: enabled ?? true,
      timezone: timezone || 'UTC',
      executionTime,
      daysOfWeek: daysOfWeek || [1, 2, 3, 4, 5],
    });

    const populated = await schedule.populate('repositoryIds', 'name fullName owner');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
}

export async function updateSchedule(req, res, next) {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    ).populate('repositoryIds', 'name fullName owner');

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
}

export async function deleteSchedule(req, res, next) {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
}


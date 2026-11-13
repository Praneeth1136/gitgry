import { Repository } from '../models/Repository.js';
import { getUserRepositories, getRepositoryDetails } from '../services/githubService.js';
import { analyzeRepository } from '../services/automationService.js';

export async function getManagedRepositories(req, res, next) {
  try {
    const { page = 1, limit = 20, search, visibility, enabled } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (visibility) {
      query.visibility = visibility;
    }
    if (enabled !== undefined) {
      query.enabled = enabled === 'true';
    }

    const total = await Repository.countDocuments(query);
    const repos = await Repository.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      data: {
        repositories: repos,
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

export async function getAvailableRepositories(req, res, next) {
  try {
    const githubRepos = await getUserRepositories(req.githubToken);
    
    // Find already managed repos to flag them
    const managed = await Repository.find({ userId: req.user._id }).select('githubRepoId');
    const managedSet = new Set(managed.map(r => r.githubRepoId));

    const result = githubRepos.map(repo => ({
      githubRepoId: repo.id,
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
      defaultBranch: repo.default_branch || 'main',
      visibility: repo.private ? 'private' : 'public',
      description: repo.description || '',
      language: repo.language || 'Plain Text',
      isManaged: managedSet.has(repo.id),
      updatedAt: repo.updated_at,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function addRepository(req, res, next) {
  try {
    const { githubRepoId, owner, name, fullName, htmlUrl, defaultBranch, visibility, description, language } = req.body;

    const existing = await Repository.findOne({ userId: req.user._id, githubRepoId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Repository already added to managed list' });
    }

    const repo = await Repository.create({
      userId: req.user._id,
      githubRepoId,
      owner,
      name,
      fullName,
      htmlUrl,
      defaultBranch: defaultBranch || 'main',
      visibility: visibility || 'public',
      description: description || '',
      language: language || 'JavaScript',
      enabled: true,
    });

    res.status(201).json({ success: true, data: repo });
  } catch (error) {
    next(error);
  }
}

export async function getRepositoryById(req, res, next) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }
    res.json({ success: true, data: repo });
  } catch (error) {
    next(error);
  }
}

export async function updateRepository(req, res, next) {
  try {
    const repo = await Repository.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }
    res.json({ success: true, data: repo });
  } catch (error) {
    next(error);
  }
}

export async function removeRepository(req, res, next) {
  try {
    const repo = await Repository.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }
    res.json({ success: true, message: 'Repository removed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function analyzeRepositoryEndpoint(req, res, next) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    const opportunities = await analyzeRepository({ _id: req.user._id, plainToken: req.githubToken }, repo);
    res.json({ success: true, data: { count: opportunities.length, opportunities } });
  } catch (error) {
    next(error);
  }
}


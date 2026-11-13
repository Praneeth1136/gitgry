import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const GITHUB_API_BASE = 'https://api.github.com';

function createGitHubClient(token) {
  return axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    timeout: 30000,
  });
}

/**
 * Exchanges OAuth authorization code for an access token.
 */
export async function exchangeCodeForToken(code) {
  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error_description || response.data.error);
    }

    return response.data; // { access_token, token_type, scope }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to exchange GitHub OAuth code');
    throw err;
  }
}

/**
 * Fetches authenticated user's profile from GitHub.
 */
export async function getAuthenticatedUserProfile(token) {
  const client = createGitHubClient(token);
  const response = await client.get('/user');
  return response.data;
}

/**
 * Lists repositories accessible by the user on GitHub.
 */
export async function getUserRepositories(token, { page = 1, perPage = 50, visibility = 'all' } = {}) {
  const client = createGitHubClient(token);
  const response = await client.get('/user/repos', {
    params: {
      page,
      per_page: perPage,
      visibility,
      sort: 'updated',
      affiliation: 'owner,collaborator',
    },
  });

  // Filter out archived and disabled repositories
  return response.data.filter(repo => !repo.archived && !repo.disabled);
}

/**
 * Fetches single repository metadata from GitHub.
 */
export async function getRepositoryDetails(token, owner, repo) {
  const client = createGitHubClient(token);
  const response = await client.get(`/repos/${owner}/${repo}`);
  return response.data;
}

/**
 * Fetches file content or directory tree from GitHub.
 */
export async function getRepositoryContent(token, owner, repo, filePath = '', ref = 'main') {
  try {
    const client = createGitHubClient(token);
    const response = await client.get(`/repos/${owner}/${repo}/contents/${filePath}`, {
      params: { ref },
    });
    return response.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Fetches the entire repository tree recursively in a single API call.
 */
export async function getRepositoryTree(token, owner, repo, ref = 'main') {
  try {
    const client = createGitHubClient(token);
    const response = await client.get(`/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`);
    return response.data?.tree || [];
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to fetch tree recursively');
    return [];
  }
}

/**
 * Commits a legitimate maintenance change directly to the repository via GitHub REST API.
 */
export async function commitFileToRepository(token, owner, repo, filePath, commitMessage, contentString, branch = 'main') {
  const client = createGitHubClient(token);
  
  // 1. Check if file already exists to obtain its SHA
  let existingSha = null;
  const existing = await getRepositoryContent(token, owner, repo, filePath, branch);
  if (existing && existing.sha) {
    existingSha = existing.sha;
  }

  // 2. Commit file directly to branch
  const response = await client.put(`/repos/${owner}/${repo}/contents/${filePath}`, {
    message: commitMessage,
    content: Buffer.from(contentString, 'utf8').toString('base64'),
    branch,
    ...(existingSha && { sha: existingSha }),
  });

  return response.data; // { content, commit: { sha, html_url } }
}

/**
 * Dispatches a GitHub Actions workflow using workflow_dispatch.
 */
export async function dispatchWorkflow(token, owner, repo, workflowId, inputs = {}, ref = 'main') {
  try {
    const client = createGitHubClient(token);
    const response = await client.post(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      ref,
      inputs,
    });
    return response.data;
  } catch (err) {
    logger.error({ err: err.message, response: err.response?.data }, 'Workflow dispatch error');
    throw new Error(err.response?.data?.message || err.message);
  }
}

/**
 * Fetches workflow run status from GitHub.
 */
export async function getWorkflowRun(token, owner, repo, runId) {
  const client = createGitHubClient(token);
  const response = await client.get(`/repos/${owner}/${repo}/actions/runs/${runId}`);
  return response.data;
}

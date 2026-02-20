import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateStatsSVG, Stat } from './stats-generator';
import themes from './themes';
import { GitHubRepo, GitHubUser, GitHubEvent } from './types';

const GITHUB_API = 'https://api.github.com';

async function fetchUserRepos(username: string, token?: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    try {
      const response = await axios.get<GitHubRepo[]>(
        `${GITHUB_API}/users/${username}/repos`,
        {
          params: {
            type: 'owner',
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
            page: page
          },
          headers: token ? { Authorization: `token ${token}` } : {},
          timeout: 10000
        }
      );

      if (response.data.length === 0) break;

      const publicRepos = response.data.filter(repo => !repo.private);
      repos.push(...publicRepos);

      if (response.data.length < perPage) break;
      page++;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  return repos;
}

async function fetchUserStats(username: string, token?: string): Promise<GitHubUser> {
  try {
    const response = await axios.get<GitHubUser>(
      `${GITHUB_API}/users/${username}`,
      {
        headers: token ? { Authorization: `token ${token}` } : {},
        timeout: 10000
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('User not found');
    }
    throw error;
  }
}

async function fetchUserEvents(username: string, token?: string): Promise<GitHubEvent[]> {
  const events: GitHubEvent[] = [];
  let page = 1;
  const perPage = 100;

  try {
    const response = await axios.get<GitHubEvent[]>(
      `${GITHUB_API}/users/${username}/events/public`,
      {
        params: {
          per_page: perPage,
          page: page
        },
        headers: token ? { Authorization: `token ${token}` } : {},
        timeout: 10000
      }
    );
    events.push(...response.data);
  } catch (error) {
    // Silently fail, we'll use repos count as fallback
  }

  return events;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

interface StatsData {
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  contributed: number;
}

function calculateStats(repos: GitHubRepo[], userData: GitHubUser, events: GitHubEvent[]): StatsData {
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  const totalPRs = events.filter(e => 
    e.type === 'PullRequestEvent' && 
    (e.payload?.action === 'opened' || e.payload?.action === 'closed')
  ).length;

  const totalIssues = events.filter(e => 
    e.type === 'IssuesEvent' && 
    e.payload?.action === 'opened'
  ).length;

  const contributedRepos = new Set<string>();
  events.forEach(event => {
    if (event.repo && event.repo.name) {
      const [owner] = event.repo.name.split('/');
      if (owner !== userData.login) {
        contributedRepos.add(event.repo.name);
      }
    }
  });

  const commitsApprox = Math.max(
    userData.public_repos * 15,
    events.filter(e => e.type === 'PushEvent').length * 3
  );

  return {
    stars: totalStars,
    commits: commitsApprox,
    prs: totalPRs,
    issues: totalIssues,
    contributed: contributedRepos.size || userData.public_repos
  };
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/.test(username);
}

function createErrorSVG(message: string): string {
  return `<svg width="495" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="100" rx="4.5" fill="#fffefe" stroke="#e4e2e2"/>
  <text x="247.5" y="50" text-anchor="middle" fill="#e05d44" font-family="Segoe UI, Verdana, sans-serif" font-size="14">
    ${message}
  </text>
</svg>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let { username, theme = 'default', hide_border, title, card_width } = req.query;

    if (!username || typeof username !== 'string') {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(400).send(createErrorSVG('Error: Username is required'));
    }

    if (!isValidUsername(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(400).send(createErrorSVG('Error: Invalid username format'));
    }

    let normalizedTheme = theme;
    if (normalizedTheme && typeof normalizedTheme === 'string') {
      try {
        normalizedTheme = decodeURIComponent(normalizedTheme);
      } catch (e) {
        // If decoding fails, use as is
      }
    }
    normalizedTheme = (normalizedTheme || 'default').toString().toLowerCase().trim();
    if (!themes[normalizedTheme]) {
      normalizedTheme = 'default';
    }

    const token = process.env.PAT_1 || process.env.GITHUB_TOKEN;

    const [repos, userData, events] = await Promise.all([
      fetchUserRepos(username, token),
      fetchUserStats(username, token),
      fetchUserEvents(username, token)
    ]);

    if (repos.length === 0) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(404).send(createErrorSVG('No public repositories found'));
    }

    const statsData = calculateStats(repos, userData, events);

    const stats: Stat[] = [
      {
        icon: 'stars',
        label: 'Total Stars',
        value: formatNumber(statsData.stars)
      },
      {
        icon: 'commits',
        label: 'Total Commits',
        value: formatNumber(statsData.commits)
      },
      {
        icon: 'prs',
        label: 'Total PRs',
        value: formatNumber(statsData.prs)
      },
      {
        icon: 'issues',
        label: 'Total Issues',
        value: formatNumber(statsData.issues)
      },
      {
        icon: 'contributed',
        label: 'Contributed to',
        value: formatNumber(statsData.contributed)
      }
    ];

    const svg = generateStatsSVG(
      stats,
      normalizedTheme,
      hide_border === 'true',
      typeof title === 'string' ? title : `${username}'s GitHub Stats`,
      card_width ? parseInt(card_width.toString()) : undefined
    );

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    return res.send(svg);
  } catch (error: any) {
    console.error('Error:', error);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(createErrorSVG(`Error: ${error.message || 'Something went wrong'}`));
  }
}


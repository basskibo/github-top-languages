const axios = require('axios');
const GITHUB_API = 'https://api.github.com';
const generateStatsSVG = require('./stats-generator');
const THEMES = require('./themes');

async function fetchUserRepos(username, token) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    try {
      const response = await axios.get(
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
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  return repos;
}

async function fetchUserStats(username, token) {
  try {
    const response = await axios.get(
      `${GITHUB_API}/users/${username}`,
      {
        headers: token ? { Authorization: `token ${token}` } : {},
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('User not found');
    }
    throw error;
  }
}

async function fetchUserEvents(username, token) {
  const events = [];
  let page = 1;
  const perPage = 100;

  // Fetch first page to get contribution data
  try {
    const response = await axios.get(
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

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function calculateStats(repos, userData, events) {
  // Total Stars - sum of all stars from all repos
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  // Total PRs - count from events (opened and merged)
  const totalPRs = events.filter(e => 
    e.type === 'PullRequestEvent' && 
    (e.payload.action === 'opened' || e.payload.action === 'closed')
  ).length;

  // Total Issues - count from events (opened)
  const totalIssues = events.filter(e => 
    e.type === 'IssuesEvent' && 
    e.payload.action === 'opened'
  ).length;

    // Contributed to - count unique repos from events (excluding own repos)
  const contributedRepos = new Set();
  events.forEach(event => {
    if (event.repo && event.repo.name) {
      const [owner] = event.repo.name.split('/');
      if (owner !== userData.login) {
        contributedRepos.add(event.repo.name);
      }
    }
  });

  // Commits approximation - GitHub API doesn't provide exact user commit counts
  // Using a reasonable approximation based on repos and activity
  const commitsApprox = Math.max(
    userData.public_repos * 15, // Base on repo count
    events.filter(e => e.type === 'PushEvent').length * 3 // Estimate from push events
  );

  return {
    stars: totalStars,
    commits: commitsApprox,
    prs: totalPRs,
    issues: totalIssues,
    contributed: contributedRepos.size || userData.public_repos
  };
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/.test(username);
}

function createErrorSVG(message) {
  return `<svg width="495" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="100" rx="4.5" fill="#fffefe" stroke="#e4e2e2"/>
  <text x="247.5" y="50" text-anchor="middle" fill="#e05d44" font-family="Segoe UI, Verdana, sans-serif" font-size="14">
    ${message}
  </text>
</svg>`;
}

module.exports = async (req, res) => {
  try {
    let { username, theme = 'default', hide_border, title, card_width } = req.query;

    if (!username) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(400).send(createErrorSVG('Error: Username is required'));
    }

    if (!isValidUsername(username)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(400).send(createErrorSVG('Error: Invalid username format'));
    }

    if (theme) {
      try {
        theme = decodeURIComponent(theme);
      } catch (e) {
        // If decoding fails, use as is
      }
    }
    theme = (theme || 'default').toLowerCase().trim();
    if (!THEMES[theme]) {
      theme = 'default';
    }

    const token = process.env.PAT_1 || process.env.GITHUB_TOKEN;

    // Fetch data in parallel
    const [repos, userData, events] = await Promise.all([
      fetchUserRepos(username, token),
      fetchUserStats(username, token),
      fetchUserEvents(username, token)
    ]);

    if (repos.length === 0) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(404).send(createErrorSVG('No public repositories found'));
    }

    // Calculate stats
    const statsData = calculateStats(repos, userData, events);

    const stats = [
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
      theme,
      hide_border === 'true',
      title || `${username}'s GitHub Stats`,
      card_width ? parseInt(card_width) : undefined
    );

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    return res.send(svg);
  } catch (error) {
    console.error('Error:', error);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(createErrorSVG(`Error: ${error.message || 'Something went wrong'}`));
  }
};


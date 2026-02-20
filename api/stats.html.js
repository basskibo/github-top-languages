const axios = require('axios');
const GITHUB_API = 'https://api.github.com';
const generateStatsSVG = require('./stats-generator');
const THEMES = require('./themes');

// Reuse functions from stats.js
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
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  const totalPRs = events.filter(e => 
    e.type === 'PullRequestEvent' && 
    (e.payload.action === 'opened' || e.payload.action === 'closed')
  ).length;

  const totalIssues = events.filter(e => 
    e.type === 'IssuesEvent' && 
    e.payload.action === 'opened'
  ).length;

  const contributedRepos = new Set();
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

function isValidUsername(username) {
  return /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/.test(username);
}

function createErrorHTML(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <script defer src="https://cloud.umami.is/script.js" data-website-id="144b22f6-7346-4832-b03d-4cdb44601d97"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .error-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      color: #e05d44;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Error</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  try {
    let { username, theme = 'default', hide_border, title, card_width } = req.query;

    if (!username) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send(createErrorHTML('Error: Username is required'));
    }

    if (!isValidUsername(username)) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send(createErrorHTML('Error: Invalid username format'));
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

    const [repos, userData, events] = await Promise.all([
      fetchUserRepos(username, token),
      fetchUserStats(username, token),
      fetchUserEvents(username, token)
    ]);

    if (repos.length === 0) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(createErrorHTML('No public repositories found'));
    }

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

    // Create HTML wrapper with Umami tracking
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Stats - ${username}</title>
  <script defer src="https://cloud.umami.is/script.js" data-website-id="144b22f6-7346-4832-b03d-4cdb44601d97"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .svg-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="svg-container">
    ${svg}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.send(html);
  } catch (error) {
    console.error('Error:', error);
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(createErrorHTML(`Error: ${error.message || 'Something went wrong'}`));
  }
};

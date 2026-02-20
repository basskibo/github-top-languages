const axios = require('axios');
const GITHUB_API = 'https://api.github.com';
const generateSVG = require('./svg-generator');
const THEMES = require('./themes');

// Reuse functions from lang.js
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

async function fetchRepoLanguages(owner, repo, token) {
  try {
    const response = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/languages`,
      {
        headers: token ? { Authorization: `token ${token}` } : {},
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    return {};
  }
}

function calculateLanguageStats(repos, languagesData) {
  const totalBytes = {};
  let grandTotal = 0;

  for (const langData of languagesData) {
    for (const [lang, bytes] of Object.entries(langData)) {
      if (!totalBytes[lang]) {
        totalBytes[lang] = 0;
      }
      totalBytes[lang] += bytes;
      grandTotal += bytes;
    }
  }

  const percentages = {};
  for (const [lang, bytes] of Object.entries(totalBytes)) {
    percentages[lang] = (bytes / grandTotal) * 100;
  }

  const sorted = Object.entries(percentages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return sorted.map(([lang, percent]) => ({
    name: lang,
    percent: percent.toFixed(1)
  }));
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

    const repos = await fetchUserRepos(username, token);

    if (repos.length === 0) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(createErrorHTML('No public repositories found'));
    }

    const languagesPromises = repos.map(repo =>
      fetchRepoLanguages(repo.owner.login, repo.name, token)
    );

    const results = await Promise.allSettled(languagesPromises);
    const languagesData = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const languageStats = calculateLanguageStats(repos, languagesData);

    if (languageStats.length === 0) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(createErrorHTML('No language data found'));
    }

    const svg = generateSVG(
      languageStats,
      theme,
      hide_border === 'true',
      title,
      card_width ? parseInt(card_width) : undefined
    );

    // Create HTML wrapper with Umami tracking
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Top Languages - ${username}</title>
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

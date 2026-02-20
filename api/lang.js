const axios = require('axios');
const GITHUB_API = 'https://api.github.com';
const generateSVG = require('./svg-generator');
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

    const repos = await fetchUserRepos(username, token);

    if (repos.length === 0) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(404).send(createErrorSVG('No public repositories found'));
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
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(404).send(createErrorSVG('No language data found'));
    }

    const svg = generateSVG(
      languageStats,
      theme,
      hide_border === 'true',
      title,
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


# GitHub Top Languages

Dynamically generated GitHub top languages card for your GitHub README. Hosted on Vercel and customizable with your own domain.

## 🚀 Features

- 📊 Shows top languages from your public repositories
- 🎨 Multiple beautiful themes
- 🔒 Only public repositories are analyzed
- ⚡ Fast and cached responses
- 🌐 Easy to deploy on Vercel

## 📖 Usage

### Basic Usage

Add this to your README:

```markdown
![Top Languages](https://your-domain.vercel.app/api?username=YOUR_USERNAME)
```

### With Custom Theme

```markdown
![Top Languages](https://your-domain.vercel.app/api?username=YOUR_USERNAME&theme=dark)
```

### Available Parameters

- `username` (required) - GitHub username
- `theme` (optional) - Theme name (default, dark, radical, merko, gruvbox, tokyonight, onedark, cobalt, synthwave)
- `hide_border` (optional) - Hide card border (true/false)
- `title` (optional) - Custom title (default: "Top Languages")
- `card_width` (optional) - Card width in pixels (default: 495)

### Examples

```markdown
<!-- Default theme -->
![Top Languages](https://your-domain.vercel.app/api?username=anuraghazra)

<!-- Dark theme -->
![Top Languages](https://your-domain.vercel.app/api?username=anuraghazra&theme=dark)

<!-- Custom title -->
![Top Languages](https://your-domain.vercel.app/api?username=anuraghazra&title=My%20Languages)

<!-- Hide border -->
![Top Languages](https://your-domain.vercel.app/api?username=anuraghazra&hide_border=true)
```

## 🛠️ Deployment

### Deploy to Vercel

1. Fork this repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Log in" and sign in with GitHub
4. Click "Add New..." → "Project"
5. Import your forked repository
6. (Optional) Add a GitHub Personal Access Token as environment variable `PAT_1` or `GITHUB_TOKEN` for higher rate limits
7. Click "Deploy"

### Custom Domain Setup

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain or subdomain
3. Follow Vercel's DNS configuration instructions
4. Update your README URLs to use your custom domain

### GitHub Personal Access Token (Optional)

For higher rate limits and access to more repositories:

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate a new token (classic)
3. Select scopes: `repo` and `read:user`
4. Add the token as environment variable `PAT_1` or `GITHUB_TOKEN` in Vercel

## 🎨 Available Themes

- `default` - Light theme with blue accents
- `dark` - Dark theme
- `radical` - Pink and cyan
- `merko` - Green theme
- `gruvbox` - Warm dark theme
- `tokyonight` - Blue and purple
- `onedark` - One Dark theme
- `cobalt` - Blue and purple
- `synthwave` - Neon synthwave theme

## 📝 License

MIT

## 🙏 Credits

Inspired by [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)


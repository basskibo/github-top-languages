import { VercelRequest, VercelResponse } from '@vercel/node';
import langHandler from './lang';

function createErrorHTML(message: string): string {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Call the lang handler and capture the response
    const originalSend = res.send.bind(res);
    let svgContent = '';
    let statusCode = 200;

    // Override res.send to capture the SVG
    res.send = ((body: any) => {
      svgContent = body;
      return res;
    }) as any;

    res.status = ((code: number) => {
      statusCode = code;
      return res;
    }) as any;

    await langHandler(req, res);

    // If there was an error, return error HTML
    if (statusCode >= 400) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(statusCode).send(createErrorHTML(svgContent || 'An error occurred'));
    }

    // Create HTML wrapper with Umami tracking
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Top Languages - ${req.query.username || 'User'}</title>
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
    ${svgContent}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return originalSend(html);
  } catch (error: any) {
    console.error('Error in lang.html:', error);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(createErrorHTML(`Error: ${error.message || 'Something went wrong'}`));
  }
}


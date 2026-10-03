const API = 'https://api.github.com';

export async function github(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Skill-Builder'
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) {
    const message = response.status === 403 ? 'GitHub API rate limit reached.' :
      response.status === 404 ? 'GitHub profile or repository was not found.' :
      `GitHub API error (${response.status}).`;
    const err = new Error(message); err.status = response.status; throw err;
  }
  return response.json();
}

export function decodeBase64(content = '') {
  try { return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8'); } catch { return ''; }
}

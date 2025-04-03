const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    
    const response = await fetch(
      `https://api.github.com/repos/${repo}/contents?ref=${branch}`,
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('GitHub API error:', data);
      return res.status(500).json({ 
        error: data.message || 'Failed to fetch images' 
      });
    }

    const images = data
      .filter(file => file.name.startsWith('img_') && file.name.endsWith('.png'))
      .map(file => ({
        name: file.name,
        url: file.download_url,
        size: file.size
      }));

    return res.status(200).json(images);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
};

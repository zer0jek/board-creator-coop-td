const { createHash } = require('crypto');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, name } = req.body;
    
    if (!image || !name) {
      return res.status(400).json({ error: 'Missing image or filename' });
    }

    if (!image.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ error: 'Only PNG images are allowed' });
    }

    const content = image.replace(/^data:image\/png;base64,/, '');
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    const path = `img_${Date.now()}_${createHash('md5').update(name).digest('hex')}.png`;

    const response = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add image ${name}`,
          content: content,
          branch: branch,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('GitHub API error:', data);
      return res.status(500).json({ 
        error: data.message || 'Failed to upload to GitHub' 
      });
    }

    return res.status(200).json({
      message: 'Image uploaded successfully',
      url: data.content.download_url
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
};

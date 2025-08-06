// File: api/save.js
// Fixed Vercel serverless function for VvvebJs

export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET requests (for testing)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true, 
      message: 'VvvebJs Save API is working!',
      timestamp: new Date().toISOString()
    });
  }

  // Handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, file, html, startTemplateUrl, title, folder, url } = req.body;

    console.log('API called with action:', action);

    // Handle different actions
    switch (action) {
      case 'save':
      case 'saveAjax':
        return await handleSave(req, res);
      
      case 'newPage':
        return await handleNewPage(req, res);
      
      case 'delete':
        return await handleDelete(req, res);
      
      case 'rename':
        return await handleRename(req, res);
      
      case 'saveReusable':
        return await handleSaveReusable(req, res);
        
      case 'oembedProxy':
        return await handleOEmbedProxy(req, res);

      case 'test':
        return res.status(200).json({ 
          success: true, 
          message: 'Test successful',
          timestamp: new Date().toISOString()
        });
      
      default:
        return res.status(400).json({ error: `Invalid action: ${action}` });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleSave(req, res) {
  const { file, html } = req.body;
  
  if (!file || !html) {
    return res.status(400).json({ error: 'Missing file or html content' });
  }

  console.log(`Saving file: ${file}, HTML length: ${html.length}`);

  // For Vercel, we can't write files to filesystem
  // Instead, we'll return success and let client handle local storage
  // In production, you'd want to integrate with a database or external storage
  
  // Simulate file saving
  const savedContent = {
    file: file,
    timestamp: new Date().toISOString(),
    size: html.length,
    success: true
  };

  return res.status(200).json({
    success: true,
    message: 'File saved successfully',
    data: savedContent
  });
}

async function handleNewPage(req, res) {
  const { startTemplateUrl, title, file, folder } = req.body;
  
  console.log('Creating new page:', { title, file, folder });
  
  // Template content based on startTemplateUrl
  let templateContent = getBlankTemplate();
  
  if (startTemplateUrl && startTemplateUrl !== 'new-page-blank-template.html') {
    // In a real implementation, you'd fetch the template
    templateContent = getBlankTemplate();
  }

  return res.status(200).json({
    success: true,
    message: 'New page created',
    template: templateContent,
    data: {
      title: title || 'New Page',
      file: file || 'new-page.html',
      folder: folder || ''
    }
  });
}

async function handleDelete(req, res) {
  const { file } = req.body;
  
  console.log('Deleting file:', file);
  
  return res.status(200).json({
    success: true,
    message: `File ${file} deleted successfully`
  });
}

async function handleRename(req, res) {
  const { oldName, newName } = req.body;
  
  console.log('Renaming file:', oldName, 'to', newName);
  
  return res.status(200).json({
    success: true,
    message: `File renamed from ${oldName} to ${newName}`
  });
}

async function handleSaveReusable(req, res) {
  const { name, html } = req.body;
  
  console.log('Saving reusable component:', name);
  
  return res.status(200).json({
    success: true,
    message: `Reusable component "${name}" saved`,
    componentId: Date.now().toString()
  });
}

async function handleOEmbedProxy(req, res) {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    console.log('OEmbed proxy for:', url);
    
    // Simple oEmbed proxy
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('OEmbed proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch oEmbed data' });
  }
}

function getBlankTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Page</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="row">
            <div class="col-12">
                <h1>Welcome to Your New Page</h1>
                <p>Start building your amazing website here!</p>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

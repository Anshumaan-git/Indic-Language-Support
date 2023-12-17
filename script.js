const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { Translate } = require('@google-cloud/translate').v2; // Replace with your preferred translation library
const { createWorker } = require('tesseract.js'); // Replace with your preferred OCR library

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer middleware for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Google Cloud Translation API configuration
const translate = new Translate({ projectId: '' }); // Replace with your actual Google Cloud project ID

// Placeholder translation function
async function translateText(text, targetLanguage) {
  const [translation] = await translate.translate(text, targetLanguage);
  return translation;
}

// Placeholder image processing function
async function processImage(imageBuffer) {
  const worker = createWorker();

  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data: { text } } = await worker.recognize(imageBuffer);
  await worker.terminate();

  return text;
}

// API endpoint for text translation
app.post('/translateText', async (req, res) => {
  const { text, targetLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Text and target language are required.' });
  }

  try {
    const translatedText = await translateText(text, targetLanguage);
    res.json({ translatedText });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for image translation
app.post('/translateImage', upload.single('image'), async (req, res) => {
  const { targetLanguage } = req.body;
  const imageBuffer = req.file.buffer;

  if (!targetLanguage || !imageBuffer) {
    return res.status(400).json({ error: 'Target language and image are required.' });
  }

  try {
    const extractedText = await processImage(imageBuffer);
    const translatedText = await translateText(extractedText, targetLanguage);

    res.json({ translatedText });
  } catch (error) {
    console.error('Error translating image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

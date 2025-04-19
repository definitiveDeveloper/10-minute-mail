import express from 'express';
import { getNewEmail } from './src/api/email.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.static('frontend/dist'));

app.get('/api/generate-email', async (req, res) => {
  try {
    const email = await getNewEmail();
    res.send(email);
  } catch (error) {
    res.status(500).send('Error generating email');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

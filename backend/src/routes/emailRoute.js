import express from 'express';
import { getNewEmail } from '../api/email.js';

const router = express.Router();

// Endpoint to get a new email
router.get('/generate-email', async (req, res) => {
  try {
    const email = await getNewEmail();  // Generate email using the backend logic
    res.json({ email });  // Send the email back as a JSON response
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

export default router;

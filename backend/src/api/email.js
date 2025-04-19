import { randomBytes } from 'crypto';

const tempEmailDomains = [
  'tempmail.com', '10minutemail.net', 'throwawaymail.com', 'maildrop.cc', 'guerrillamail.com'
];

// Helper function to generate a random username
function generateRandomUsername(length = 8) {
  return randomBytes(length).toString('hex').slice(0, length);
}

// Main function to generate a random temporary email address
async function generateTempEmail() {
  const domain = tempEmailDomains[Math.floor(Math.random() * tempEmailDomains.length)];
  
  if (domain === 'guerrillamail.com') {
    try {
      // Simulate GuerrillaMail API call (here we mock the response for simplicity)
      const email = `${generateRandomUsername()}@guerrillamail.com`;
      return { email: email.toLowerCase(), domain };
    } catch (error) {
      console.error('Error generating GuerrillaMail email:', error);
    }
  }

  const username = generateRandomUsername();
  const email = `${username}@${domain}`;
  return { email: email.toLowerCase(), domain };
}

export async function getNewEmail() {
  const { email, domain } = await generateTempEmail();
  return email;
}

export async function getNewEmail() {
  try {
    const response = await fetch('/api/generate-email');
    const email = await response.text();
    return email;
  } catch (error) {
    console.error('Error fetching new email:', error);
    return null;
  }
}

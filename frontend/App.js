import React, { useState } from 'react';
import { getNewEmail } from './api/email';

function App() {
  const [email, setEmail] = useState('');

  const handleNewEmail = async () => {
    const newEmail = await getNewEmail();
    if (newEmail) {
      setEmail(newEmail);
    } else {
      alert('Error generating email');
    }
  };

  return (
    <div className="App">
      <h1>Temporary Email Generator</h1>
      <button onClick={handleNewEmail}>New Email</button>
      {email && <p>Generated Email: {email}</p>}
    </div>
  );
}

export default App;

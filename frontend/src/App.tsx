import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  php_version: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/health').then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<HealthResponse>;
    }).then((data) => setHealth(data))
      .catch((err) => setError(err))

  }, []);
  return (
    <main>
      <h1>CorpDesk</h1>
      {error && <p>Error: {error}</p>}
      {!error && !health && <p>Loading...</p>}
      {health && (
        <div>
          <p>Status: {health.status}</p>
          <p>PHP Version: {health.php_version}</p>
        </div>
      )}
    </main>
  )
}

export default App
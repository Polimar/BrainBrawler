import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-primary-600 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">BrainBrawler</h1>
          <p className="text-primary-100">Real-Time P2P Quiz Game</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </main>
    </div>
  );
}

// Placeholder components
const HomePage = () => (
  <div className="text-center">
    <h2 className="text-3xl font-bold mb-4">Welcome to BrainBrawler!</h2>
    <p className="text-gray-600 mb-8">Challenge your friends in real-time quiz battles</p>
    <button className="btn-primary mr-4">Start Playing</button>
    <button className="btn-secondary">How to Play</button>
  </div>
);

const AuthPage = () => (
  <div className="max-w-md mx-auto">
    <h2 className="text-2xl font-bold mb-4">Login / Register</h2>
    <div className="card p-6">
      <p>Authentication form will be here</p>
    </div>
  </div>
);

const GamePage = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Game Room</h2>
    <div className="card p-6">
      <p>Game interface will be here</p>
    </div>
  </div>
);

export default App; 
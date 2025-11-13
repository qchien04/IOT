import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="app"> 
      <header className="app-header">
        <h1>🏠 IoT Home Control Dashboard</h1>
      </header>

      <main>
        <Dashboard />
      </main>

      <footer className="app-footer">
        IoT Dashboard © 2025
      </footer>
    </div>
  );
}

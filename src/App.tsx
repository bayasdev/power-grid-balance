import { PowerGridDashboard } from "./components/PowerGridDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <PowerGridDashboard />
      </div>
    </ErrorBoundary>
  );
}

export default App;

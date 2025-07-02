import { PowerGridDashboard } from "./components/PowerGridDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import "./index.css";

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <PowerGridDashboard />
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default App;

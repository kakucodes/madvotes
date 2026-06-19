import { Route, Routes } from "react-router-dom";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { LiveExperiments } from "./components/LiveExperiments/LiveExperiments";
import { MarketDetail } from "./components/MarketDetail/MarketDetail";
import { Notebook } from "./components/Notebook/Notebook";
import { Docs } from "./components/Docs/Docs";
import { colors } from "./theme";

function App() {
  return (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <AppHeader />
      <Routes>
        <Route path="/" element={<LiveExperiments />} />
        <Route path="/experiment/:proposalId" element={<MarketDetail />} />
        <Route path="/notebook" element={<Notebook />} />
        <Route path="/docs" element={<Docs />} />
      </Routes>
    </div>
  );
}

export default App;

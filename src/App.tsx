import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import Scan from "@/pages/Scan";
import Issues from "@/pages/Issues";
import Rules from "@/pages/Rules";
import Plans from "@/pages/Plans";
import TeamDashboard from "@/pages/TeamDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/dashboard" element={<TeamDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

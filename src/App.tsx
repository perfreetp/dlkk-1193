import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import Scan from "@/pages/Scan";
import Issues from "@/pages/Issues";
import Rules from "@/pages/Rules";
import Plans from "@/pages/Plans";
import PlanDetail from "@/pages/PlanDetail";
import TeamDashboard from "@/pages/TeamDashboard";
import ProjectDetail from "@/pages/ProjectDetail";
import TeamMemberDetail from "@/pages/TeamMemberDetail";
import TeamGroupDetail from "@/pages/TeamGroupDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/plans/:planId" element={<PlanDetail />} />
          <Route path="/dashboard" element={<TeamDashboard />} />
          <Route path="/team/:memberName" element={<TeamMemberDetail />} />
          <Route path="/group/:groupId" element={<TeamGroupDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

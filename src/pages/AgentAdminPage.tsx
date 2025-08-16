import React, { useState } from 'react';
import AgentAdminAuth from '@/components/AgentAdminAuth';
import AgentAdminPanel from '@/components/AgentAdminPanel';

const AgentAdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userMobile, setUserMobile] = useState('');
  const [teamData, setTeamData] = useState(null);

  const handleAuthenticated = (mobileNumber: string, teamData: any) => {
    setUserMobile(mobileNumber);
    setTeamData(teamData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserMobile('');
    setTeamData(null);
  };

  if (!isAuthenticated) {
    return <AgentAdminAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <AgentAdminPanel 
      mobileNumber={userMobile}
      teamData={teamData}
      onLogout={handleLogout}
    />
  );
};

export default AgentAdminPage;
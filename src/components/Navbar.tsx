import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Settings, UserPlus, Users, Home, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Check for member user
  const [memberUser, setMemberUser] = React.useState(null);
  
  React.useEffect(() => {
    const storedMemberUser = localStorage.getItem('member_user');
    if (storedMemberUser) {
      setMemberUser(JSON.parse(storedMemberUser));
    } else {
      setMemberUser(null);
    }
  }, [location.pathname]); // Re-check on route changes

  const handleLogout = () => {
    if (memberUser) {
      localStorage.removeItem('member_user');
      setMemberUser(null);
      navigate('/');
    } else {
      logout();
      navigate('/');
    }
  };

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
            🏛️ Panchayath Management System
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button 
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>

            <Link to="/admin/dashboard">
              <Button 
                variant={location.pathname.startsWith('/admin') ? 'default' : 'ghost'}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
            
            {memberUser ? (
              <Link to="/member-dashboard">
                <Button 
                  variant={location.pathname === '/member-dashboard' ? 'default' : 'ghost'}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Member Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/members">
                <Button 
                  variant={location.pathname === '/members' ? 'default' : 'ghost'}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Members
                </Button>
              </Link>
            )}
            
            {(user || memberUser) && (
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const router = useNavigate();
    const { isAuthenticated, isLoading } = useContext(AuthContext);

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router('/auth');
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return null;

    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };

  return AuthComponent;
};

export default withAuth;

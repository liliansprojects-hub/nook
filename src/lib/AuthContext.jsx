import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { readCache, writeCache } from '@/lib/offline';
import { signOutLocally } from '@/lib/session';

const AuthContext = createContext();

// App settings: the SDK call when this SDK version has it, the public REST
// endpoint otherwise.
async function loadPublicSettings() {
  if (typeof base44.app?.getPublicSettings === 'function') {
    return base44.app.getPublicSettings();
  }
  const res = await fetch(`${appParams.serverUrl}/api/apps/public/prod/public-settings/by-id/${appParams.appId}`, {
    headers: { 'X-App-Id': appParams.appId },
  });
  if (!res.ok) {
    const err = new Error(`Public settings failed (${res.status})`);
    err.status = res.status;
    try {
      err.data = await res.json();
    } catch {
      /* no body */
    }
    throw err;
  }
  return res.json();
}

// no HTTP status at all means the request never reached the server
const isOffline = (err) => !err?.status && (typeof navigator === 'undefined' || !navigator.onLine || err?.name === 'TypeError' || /network/i.test(err?.message || ''));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  // Signed in on this device before and the network is gone: carry on with the
  // cached profile so the installed app still opens.
  const continueOffline = () => {
    const cached = readCache('nook.me');
    if (appParams.token && cached) {
      setUser(cached);
      setIsAuthenticated(true);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return true;
    }
    return false;
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      try {
        const publicSettings = await loadPublicSettings();
        setAppPublicSettings(publicSettings);

        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);

        if (isOffline(appError) && continueOffline()) {
          setIsLoadingPublicSettings(false);
          return;
        }

        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      writeCache('nook.me', currentUser);
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);

      if (isOffline(error) && continueOffline()) return;

      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);

      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    signOutLocally('/login');
  };

  const navigateToLogin = () => {
    // our own login page, not the builder's hosted one
    window.location.assign('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auto-login helper for testing
const autoLogin = async () => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'coordinator@example.com',
        password: 'Password123!',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ Auto-login successful:', data.user);
      return true;
    } else {
      console.error('❌ Auto-login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Auto-login error:', error);
    return false;
  }
};

// Add a global function for quick testing
if (typeof window !== 'undefined') {
  (window as any).autoLogin = autoLogin;
  (window as any).testLogin = () => {
    autoLogin().then(success => {
      if (success) {
        window.location.href = '/coordinator';
      }
    });
  };
  
  console.log('🔧 Test helpers loaded. Run window.testLogin() in console to auto-login as coordinator');
}

export default autoLogin;
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    const handleLogin = (name) => {
        if (name.trim()) {
            setUsername(name);
            setIsLoggedIn(true);
        } else {
            alert('Username cannot be empty!');
        }
    };

    return (
        <div>
            {!isLoggedIn ? (
                <Login onLogin={handleLogin} />
            ) : (
                <Dashboard username={username} />
            )}
        </div>
    );
};

export default App;

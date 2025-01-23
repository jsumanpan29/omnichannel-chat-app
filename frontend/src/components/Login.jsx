import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username);
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Please Enter Your Username</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    style={{ padding: '10px', marginRight: '10px' }}
                />
                <button type="submit" style={{ padding: '10px' }}>
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;

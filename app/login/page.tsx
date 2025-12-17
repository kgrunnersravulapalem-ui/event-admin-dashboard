'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { appConfig } from '@/lib/appConfig';
import { Button, Input, Card } from '@/components/ui';
import { toast } from 'react-hot-toast';
import styles from '@/styles/EnrollmentForm.module.css'; // Reusing form styles for simplicity

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            username === appConfig.auth.username &&
            password === appConfig.auth.password
        ) {
            login();
            toast.success('Login successful');
            router.push('/dashboard');
        } else {
            toast.error('Invalid credentials');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f1f5f9',
            padding: '1rem'
        }}>
            <Card title="Login" className={styles.card} style={{ maxWidth: '400px', width: '100%' }}>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" variant="primary" fullWidth>
                        Login
                    </Button>
                </form>
            </Card>
        </div>
    );
}

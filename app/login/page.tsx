'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { appConfig } from '@/lib/appConfig';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Login.module.css';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate a slight delay for better UX
        setTimeout(() => {
            if (
                username === appConfig.auth.username &&
                password === appConfig.auth.password
            ) {
                login();
                toast.success('Login successful');
                router.push('/dashboard');
            } else {
                toast.error('Invalid credentials');
                setIsLoading(false);
            }
        }, 400);
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <div className={styles.logo}>
                            🏃
                        </div>
                    </div>
                    <h1 className={styles.title}>Event Enrollment</h1>
                    <p className={styles.subtitle}>Welcome back! Please login to continue</p>
                </div>

                {/* Login Card */}
                <div className={styles.card}>
                    <form onSubmit={handleLogin} className={styles.form}>
                        {/* Username Field */}
                        <div className={styles.formGroup}>
                            <label htmlFor="username" className={styles.label}>
                                Username
                            </label>
                            <input
                                id="username"
                                className={styles.inputField}
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                            <input
                                id="password"
                                className={styles.inputField}
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            className={styles.button}
                            disabled={isLoading || !username || !password}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

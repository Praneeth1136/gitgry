import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../src/pages/Login';
import { AuthProvider } from '../src/context/AuthContext';

describe('Login Component', () => {
  it('renders GitGry heading and GitHub OAuth action button', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('GitGry')).toBeDefined();
    expect(screen.getByText('Continue with GitHub')).toBeDefined();
    expect(screen.getByText(/Automated Repository Maintenance/i)).toBeDefined();
  });
});


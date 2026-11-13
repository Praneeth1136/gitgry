import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { App } from '../src/App';

describe('App Root Component', () => {
  it('renders application tree without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});


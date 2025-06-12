import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../app/dashboard/page';

test('renders dashboard component', () => {
  render(<Dashboard />);
  const linkElement = screen.getByText(/dashboard/i);
  expect(linkElement).toBeInTheDocument();
});
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
describe('app shell',()=>{it('renders OneLab Reconciliation and navigation',()=>{render(<App/>);expect(screen.getAllByText(/OneLab/i).length).toBeGreaterThan(0);expect(screen.getAllByText('Data Import').length).toBeGreaterThan(0);expect(screen.getAllByText('Reports').length).toBeGreaterThan(0)})});

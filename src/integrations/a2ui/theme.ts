/**
 * A2UI Theme Configuration for Pauli Effect Project
 *
 * Defines the visual styling for agent-generated UI components
 * to match the Pauli Effect project's branding and design system.
 */

export const pauliA2UITheme = {
  // Primary brand colors
  primaryColor: '#8B5CF6', // Purple for Pauli Effect
  secondaryColor: '#3B82F6', // Blue accent
  backgroundColor: '#0F172A', // Dark background
  surfaceColor: '#1E293B', // Card/surface background

  // Text colors
  textColor: '#F1F5F9',
  textSecondaryColor: '#94A3B8',

  // Semantic colors
  successColor: '#10B981',
  warningColor: '#F59E0B',
  errorColor: '#EF4444',

  // Border and spacing
  borderColor: '#334155',
  borderRadius: '0.5rem',

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  // Component-specific styles
  components: {
    card: {
      backgroundColor: '#1E293B',
      borderColor: '#334155',
      borderRadius: '0.5rem',
      padding: '1rem',
    },
    button: {
      primaryBackground: '#8B5CF6',
      primaryColor: '#FFFFFF',
      secondaryBackground: '#334155',
      secondaryColor: '#F1F5F9',
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
    },
    input: {
      backgroundColor: '#0F172A',
      borderColor: '#334155',
      textColor: '#F1F5F9',
      placeholderColor: '#64748B',
      borderRadius: '0.375rem',
      padding: '0.5rem 0.75rem',
    },
  },
};

export type PauliA2UITheme = typeof pauliA2UITheme;

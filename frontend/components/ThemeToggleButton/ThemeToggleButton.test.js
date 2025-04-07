import { render } from '@testing-library/react';
import ThemeToggleButton from './ThemeToggleButton';
import { ThemeProvider } from '../../context/ThemeContext';  // Import ThemeProvider

// Create a wrapper component that provides the ThemeContext
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>{component}</ThemeProvider>
  );
};

describe('<ThemeToggleButton />', () => {
  it('Renders an empty ThemeToggleButton', () => {
    renderWithTheme(<ThemeToggleButton />); // Use the wrapper instead of direct render
  });
});
import { render } from '@testing-library/react';
import LeftSidebar from './LeftSidebar';
import { ThemeProvider } from '../../context/ThemeContext';

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>{component}</ThemeProvider>
  );
};

describe('<LeftSidebar />', () => {
  it('Renders properly', () => {
    renderWithTheme(<LeftSidebar />);
  });
});
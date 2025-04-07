import { render } from '@testing-library/react';
import RightSidebar from './RightSidebar';
import { ThemeProvider } from '../../context/ThemeContext';

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>{component}</ThemeProvider>
  );
};

describe('<RightSidebar />', () => {
  it('Renders properly', () => {
    renderWithTheme(<RightSidebar />);
  });
});
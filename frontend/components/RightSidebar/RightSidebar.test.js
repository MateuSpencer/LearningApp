import { render } from '../../utils/test-utils';
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
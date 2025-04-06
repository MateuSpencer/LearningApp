import { render, /* screen */ } from '@testing-library/react';
import ThemeToggleButton from './ThemeToggleButton';  // Fixed import path

describe('<ThemeToggleButton />', () => {
    it('Renders an empty ThemeToggleButton', () => {
        render(<ThemeToggleButton />);
    });

    // it('Renders ThemeToggleButton with data', () => {
    //     const { container } = render(<ThemeToggleButton {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});
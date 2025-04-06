import { render, /* screen */ } from '@testing-library/react';
import LeftSidebar from './';
// import data from './LeftSidebar.data';

describe('<LeftSidebar />', () => {
    it('Renders an empty LeftSidebar', () => {
        render(<LeftSidebar />);
    });

    // it('Renders LeftSidebar with data', () => {
    //     const { container } = render(<LeftSidebar {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

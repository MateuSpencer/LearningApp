import { render, /* screen */ } from '@testing-library/react';
import RightSidebar from './';
// import data from './RightSidebar.data';

describe('<RightSidebar />', () => {
    it('Renders an empty RightSidebar', () => {
        render(<RightSidebar />);
    });

    // it('Renders RightSidebar with data', () => {
    //     const { container } = render(<RightSidebar {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});
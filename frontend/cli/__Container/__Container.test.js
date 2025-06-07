import { render, /* screen */ } from '../../utils/test-utils';
import __Container from './';
// import data from './__Container.data';

describe('<__Container />', () => {
    it('Renders an empty __Container', () => {
        render(<__Container />);
    });

    // it('Renders __Container with data', () => {
    //     const { container } = render(<__Container {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

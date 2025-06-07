import { render, /* screen */ } from '../../utils/test-utils';
import Logo from './';
// import data from './Logo.data';

describe('<Logo />', () => {
    it('Renders an empty Logo', () => {
        render(<Logo />);
    });

    // it('Renders Logo with data', () => {
    //     const { container } = render(<Logo {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

import { render, /* screen */ } from '../../utils/test-utils';
import AboutButton from './';
// import data from './AboutButton.data';

describe('<AboutButton />', () => {
    it('Renders an empty AboutButton', () => {
        render(<AboutButton />);
    });

    // it('Renders AboutButton with data', () => {
    //     const { container } = render(<AboutButton {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

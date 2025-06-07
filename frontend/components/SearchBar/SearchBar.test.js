import { render, /* screen */ } from '../../utils/test-utils';
import SearchBar from './SearchBar';
// import data from './SearchBar.data';

describe('<SearchBar />', () => {
    it('Renders an empty SearchBar', () => {
        render(<SearchBar />);
    });

    // it('Renders SearchBar with data', () => {
    //     const { container } = render(<SearchBar {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

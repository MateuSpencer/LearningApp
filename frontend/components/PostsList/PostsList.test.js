import { render } from '../../utils/test-utils';
import PostsList from './';
// import data from './PostsList.data';

describe('<PostsList />', () => {
    it('Renders an empty PostsList', () => {
        render(<PostsList />);
    });

    // it('Renders PostsList with data', () => {
    //     const { container } = render(<PostsList {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

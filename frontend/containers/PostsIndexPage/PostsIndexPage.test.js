import { render, /* screen */ } from '../../utils/test-utils';
import PostsIndexPage from './';
// import data from './PostsIndexPage.data';

describe('<PostsIndexPage />', () => {
    it('Renders an empty PostsIndexPage', () => {
        render(<PostsIndexPage />);
    });

    // it('Renders PostsIndexPage with data', () => {
    //     const { container } = render(<PostsIndexPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

import { render } from '../../utils/test-utils';
import UserPostsPage from './';
// import data from './UserPostsPage.data';

describe('<UserPostsPage />', () => {
    it('Renders an empty UserPostsPage', () => {
        render(<UserPostsPage />);
    });

    // it('Renders UserPostsPage with data', () => {
    //     const { container } = render(<UserPostsPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

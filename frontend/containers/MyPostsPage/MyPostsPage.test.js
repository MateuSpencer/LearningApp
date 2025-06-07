import { render, /* screen */ } from '../../utils/test-utils';
import MyPostsPage from './';
// import data from './MyPostsPage.data';

describe('<MyPostsPage />', () => {
    it('Renders an empty MyPostsPage', () => {
        render(<MyPostsPage />);
    });

    // it('Renders MyPostsPage with data', () => {
    //     const { container } = render(<MyPostsPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

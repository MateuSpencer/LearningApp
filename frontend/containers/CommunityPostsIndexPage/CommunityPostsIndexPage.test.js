import { render, /* screen */ } from '@testing-library/react';
import CommunityPostsIndexPage from './';
// import data from './CommunityPostsIndexPage.data';

describe('<CommunityPostsIndexPage />', () => {
    it('Renders an empty CommunityPostsIndexPage', () => {
        render(<CommunityPostsIndexPage />);
    });

    // it('Renders CommunityPostsIndexPage with data', () => {
    //     const { container } = render(<CommunityPostsIndexPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

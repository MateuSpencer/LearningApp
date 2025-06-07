import { render, /* screen */ } from '../../utils/test-utils';
import Post from './';
// import data from './Post.data';

describe('<Post />', () => {
    it('Renders an empty Post', () => {
        render(<Post />);
    });

    // it('Renders Post with data', () => {
    //     const { container } = render(<Post {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

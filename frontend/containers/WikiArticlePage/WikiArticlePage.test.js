import { render } from '../../utils/test-utils';
import WikiArticlePage from './';
// import data from './WikiArticlePage.data';

describe('<WikiArticlePage />', () => {
    it('Renders an empty WikiArticlePage', () => {
        render(<WikiArticlePage />);
    });

    // it('Renders WikiArticlePage with data', () => {
    //     const { container } = render(<WikiArticlePage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

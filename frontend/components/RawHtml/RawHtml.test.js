import { render /* screen */ } from '../../utils/test-utils';
import RawHtml from './';
// import data from './RawHtml.data';

describe('<RawHtml />', () => {
    it('Renders an empty RawHtml', () => {
        render(<RawHtml />);
    });

    // it('Renders RawHtml with data', () => {
    //     const { container } = render(<RawHtml {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

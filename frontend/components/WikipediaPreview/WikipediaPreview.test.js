import { render, /* screen */ } from '@testing-library/react';
import WikipediaPreview from './';
// import data from './WikipediaPreview.data';

describe('<WikipediaPreview />', () => {
    it('Renders an empty WikipediaPreview', () => {
        render(<WikipediaPreview />);
    });

    // it('Renders WikipediaPreview with data', () => {
    //     const { container } = render(<WikipediaPreview {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

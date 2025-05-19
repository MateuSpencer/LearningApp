import { render, /* screen */ } from '@testing-library/react';
import AIResourceSummaryButton from './';
// import data from './AIResourceSummaryButton.data';

describe('<AIResourceSummaryButton />', () => {
    it('Renders an empty AIResourceSummaryButton', () => {
        render(<AIResourceSummaryButton />);
    });

    // it('Renders AIResourceSummaryButton with data', () => {
    //     const { container } = render(<AIResourceSummaryButton {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

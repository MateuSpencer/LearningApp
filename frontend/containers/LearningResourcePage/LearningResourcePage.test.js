import { render, /* screen */ } from '@testing-library/react';
import LearningResourcePage from './';
// import data from './LearningResourcePage.data';

describe('<LearningResourcePage />', () => {
    it('Renders an empty LearningResourcePage', () => {
        render(<LearningResourcePage />);
    });

    // it('Renders LearningResourcePage with data', () => {
    //     const { container } = render(<LearningResourcePage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

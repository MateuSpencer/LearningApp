import { render, /* screen */ } from '@testing-library/react';
import LearningResourcesIndexPage from './';
// import data from './LearningResourcesIndexPage.data';

describe('<LearningResourcesIndexPage />', () => {
    it('Renders an empty LearningResourcesIndexPage', () => {
        render(<LearningResourcesIndexPage />);
    });

    // it('Renders LearningResourcesIndexPage with data', () => {
    //     const { container } = render(<LearningResourcesIndexPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

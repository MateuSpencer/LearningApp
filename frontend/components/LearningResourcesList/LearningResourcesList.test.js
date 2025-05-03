import { render, /* screen */ } from '@testing-library/react';
import LearningResourcesList from './';
// import data from './LearningResourcesList.data';

describe('<LearningResourcesList />', () => {
    it('Renders an empty LearningResourcesList', () => {
        render(<LearningResourcesList />);
    });

    // it('Renders LearningResourcesList with data', () => {
    //     const { container } = render(<LearningResourcesList {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

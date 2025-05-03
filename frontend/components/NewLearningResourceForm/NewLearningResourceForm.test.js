import { render, /* screen */ } from '@testing-library/react';
import NewLearningResourceForm from './';
// import data from './NewLearningResourceForm.data';

describe('<NewLearningResourceForm />', () => {
    it('Renders an empty NewLearningResourceForm', () => {
        render(<NewLearningResourceForm />);
    });

    // it('Renders NewLearningResourceForm with data', () => {
    //     const { container } = render(<NewLearningResourceForm {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

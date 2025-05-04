import { render, /* screen */ } from '@testing-library/react';
import NewLearningResourceForm from './';
import { AuthProvider } from '../../context/AuthContext';
// import data from './NewLearningResourceForm.data';

describe('<NewLearningResourceForm />', () => {
    it('Renders an empty NewLearningResourceForm', () => {
        render(
          <AuthProvider>
            <NewLearningResourceForm />
          </AuthProvider>
        );
    });

    // it('Renders NewLearningResourceForm with data', () => {
    //     const { container } = render(<NewLearningResourceForm {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

import { render, /* screen */ } from '@testing-library/react';
import RegistrationForm from './';
// import data from './RegistrationForm.data';

describe('<RegistrationForm />', () => {
    it('Renders an empty RegistrationForm', () => {
        render(<RegistrationForm />);
    });

    // it('Renders RegistrationForm with data', () => {
    //     const { container } = render(<RegistrationForm {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

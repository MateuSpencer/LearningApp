import { render, /* screen */ } from '@testing-library/react';
import LoginForm from './';
// import data from './LoginForm.data';

describe('<LoginForm />', () => {
    it('Renders an empty LoginForm', () => {
        render(<LoginForm />);
    });

    // it('Renders LoginForm with data', () => {
    //     const { container } = render(<LoginForm {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

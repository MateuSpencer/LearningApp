import { render, /* screen */ } from '@testing-library/react';
import NewPostForm from './';
// import data from './NewPostForm.data';

describe('<NewPostForm />', () => {
    it('Renders an empty NewPostForm', () => {
        render(<NewPostForm />);
    });

    // it('Renders NewPostForm with data', () => {
    //     const { container } = render(<NewPostForm {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

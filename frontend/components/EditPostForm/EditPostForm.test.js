import { render, /* screen */ } from '@testing-library/react';
import EditPostForm from './';
// import data from './EditPostForm.data';

describe('<EditPostForm />', () => {
    it('Renders an empty EditPostForm', () => {
        render(<EditPostForm />);
    });

    // it('Renders EditPostForm with data', () => {
    //     const { container } = render(<EditPostForm {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

import { render, /* screen */ } from '@testing-library/react';
import LogoutButton from './';
// import data from './LogoutButton.data';

describe('<LogoutButton />', () => {
    it('Renders an empty LogoutButton', () => {
        render(<LogoutButton />);
    });

    // it('Renders LogoutButton with data', () => {
    //     const { container } = render(<LogoutButton {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

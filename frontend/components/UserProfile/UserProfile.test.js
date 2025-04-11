import { render, /* screen */ } from '@testing-library/react';
import UserProfile from './';
// import data from './UserProfile.data';

describe('<UserProfile />', () => {
    it('Renders an empty UserProfile', () => {
        render(<UserProfile />);
    });

    // it('Renders UserProfile with data', () => {
    //     const { container } = render(<UserProfile {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

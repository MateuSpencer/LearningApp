import { render, /* screen */ } from '@testing-library/react';
import LearningResourceItem from './';
import { AuthProvider } from '../../context/AuthContext';
// import data from './LearningResourceItem.data';

describe('<LearningResourceItem />', () => {
    it('Renders an empty LearningResourceItem', () => {
        render(
          <AuthProvider>
            <LearningResourceItem />
          </AuthProvider>
        );
    });

    // it('Renders LearningResourceItem with data', () => {
    //     const { container } = render(<LearningResourceItem {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

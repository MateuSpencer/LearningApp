import { render, /* screen */ } from '@testing-library/react';
import WikiIndexPage from './';
// import data from './WikiIndexPage.data';

describe('<WikiIndexPage />', () => {
    it('Renders an empty WikiIndexPage', () => {
        render(<WikiIndexPage />);
    });

    // it('Renders WikiIndexPage with data', () => {
    //     const { container } = render(<WikiIndexPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

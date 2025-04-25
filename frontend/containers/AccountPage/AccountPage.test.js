import { render } from '../../utils/test-utils';
import AccountPage from './';
// import data from './AccountPage.data';

describe('<AccountPage />', () => {
    it('Renders an empty AccountPage', () => {
        render(<AccountPage />);
    });

    // it('Renders AccountPage with data', () => {
    //     const { container } = render(<AccountPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

import { render, /* screen */ } from '@testing-library/react';
import SiteName from './';
// import data from './SiteName.data';

describe('<SiteName />', () => {
    it('Renders an empty SiteName', () => {
        render(<SiteName />);
    });

    // it('Renders SiteName with data', () => {
    //     const { container } = render(<SiteName {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

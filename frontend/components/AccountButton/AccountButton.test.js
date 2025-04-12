import { render, /* screen */ } from '@testing-library/react';
import AccountButton from './';
// import data from './AccountButton.data';

describe('<AccountButton />', () => {
    it('Renders an empty AccountButton', () => {
        render(<AccountButton />);
    });

    // it('Renders AccountButton with data', () => {
    //     const { container } = render(<AccountButton {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});

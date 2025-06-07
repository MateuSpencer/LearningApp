import { basePageWrap } from '../containers/BasePage';
import NotFoundPage from '../containers/NotFoundPage';

function Custom404() {
    // Use our statically translated NotFoundPage component
    return <NotFoundPage />;
}

// Wrap the component with basePageWrap to inherit the base page structure
export default basePageWrap(Custom404);

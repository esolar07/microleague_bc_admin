import { CSSProperties } from 'react';
import HashLoader from 'react-spinners/HashLoader';
const override: CSSProperties = {
    display: 'block',
    margin: '0 auto',
};

function Loader({ loading, size }: { loading: boolean; size?: number }) {
    return (
        <HashLoader
            color="#7529ED"
            loading={loading}
            cssOverride={override}
            size={size || 70}
            aria-label="Loading Spinner"
            data-testid="loader"
        />
    );
}

export default Loader;

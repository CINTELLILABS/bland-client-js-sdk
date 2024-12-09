import * as React from 'react';
interface PathwayUIProps {
    apiKey: string;
    orgId: string;
    pathwayId: string;
    style?: React.CSSProperties;
}
declare const PathwayUI: React.FC<PathwayUIProps>;
export default PathwayUI;

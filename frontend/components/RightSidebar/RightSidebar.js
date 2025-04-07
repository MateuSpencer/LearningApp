import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext'; // Import theme context
import s from './RightSidebar.module.css';

const RightSidebar = ({ items }) => {
    const [collapsed, setCollapsed] = useState(true); // Default to collapsed
    const { theme } = useTheme(); // Use theme context

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className={`${s.RightSidebar} ${collapsed ? s.Collapsed : s.Expanded}`}>
            <button
                className={s.ToggleButton}
                onClick={toggleSidebar}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? '‹' : '›'}
            </button>
            <div className={s.Content}>
                {/* Sidebar content */}
            </div>
        </div>
    );
};

RightSidebar.propTypes = {
    items: PropTypes.array,
};

RightSidebar.defaultProps = {
    items: [],
};

export default RightSidebar;
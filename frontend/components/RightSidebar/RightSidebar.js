import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext';
import s from './RightSidebar.module.css';

const RightSidebar = ({ items, onToggle }) => {
    const [collapsed, setCollapsed] = useState(true);
    const { theme } = useTheme();

    // Call the onToggle callback when state changes
    useEffect(() => {
        if (onToggle) {
            onToggle(!collapsed);
        }
    }, [collapsed, onToggle]);

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

RightSidebar.defaultProps = {
    items: [],
    onToggle: null
};

RightSidebar.propTypes = {
    items: PropTypes.array,
    onToggle: PropTypes.func
};

export default RightSidebar;
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggleButton from '../ThemeToggleButton';
import s from './LeftSidebar.module.css';

const LeftSidebar = ({ items }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
            setCollapsed(JSON.parse(savedState));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
        document.body.classList.toggle('sidebar-collapsed', newState);
    };

    return (
        <div className={`${s.LeftSidebar} ${collapsed ? s.Collapsed : s.Expanded}`}>
            <button
                className={s.ToggleButton}
                onClick={toggleSidebar}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? '›' : '‹'}
            </button>

            <div className={s.Content}>
                {/* Navigation items removed */}
                
                <div className={s.Footer}>
                    {!collapsed && <p className={s.ThemeLabel}>Theme</p>}
                    <ThemeToggleButton small={collapsed} />
                </div>
            </div>
        </div>
    );
};

LeftSidebar.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
            icon: PropTypes.string,
        })
    ),
};

LeftSidebar.defaultProps = {
    items: [],
};

export default LeftSidebar;
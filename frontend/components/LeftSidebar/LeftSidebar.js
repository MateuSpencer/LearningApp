import React, { useState } from 'react';
import PropTypes from 'prop-types';
import s from './LeftSidebar.module.css';
import ThemeToggleButton from '../ThemeToggleButton';
import Logo from '../Logo';
import SiteName from '../SiteName';

const LeftSidebar = ({ items }) => {
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className={`${s.LeftSidebar} ${collapsed ? s.Collapsed : s.Expanded}`}>
            <button 
                className={s.ToggleButton}
                onClick={toggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? '›' : '‹'}
            </button>

            <div className={s.Header}>
              <div className={s.LogoWrapper}>
                <Logo size="medium" />
                <div className={s.SiteNameWrapper}>
                  <SiteName size="medium" />
                </div>
              </div>
            </div>

            <div className={s.Content}>
                {/* Navigation items */}
                
                <div className={s.Footer}>
                    {!collapsed && <p className={s.ThemeLabel}>Theme</p>}
                    <ThemeToggleButton small={collapsed} />
                </div>
            </div>
        </div>
    );
};

LeftSidebar.defaultProps = {
    items: [],
};

export default LeftSidebar;
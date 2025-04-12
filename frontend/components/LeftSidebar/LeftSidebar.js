import React, { useState } from 'react';
import s from './LeftSidebar.module.css';
import ThemeToggleButton from '../ThemeToggleButton';
import AboutButton from '../AboutButton';
import AccountButton from '../AccountButton';
import Logo from '../Logo';
import SiteName from '../SiteName';

const LeftSidebar = ({ items }) => {
    const [collapsed, setCollapsed] = useState(true);

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
                    {!collapsed && <p className={s.ThemeLabel}></p>}
                    <div className={s.ButtonsContainer}>
                        <div className={`${s.ButtonWrapper} ${s.ThemeButtonWrapper}`}>
                            <ThemeToggleButton/>
                        </div>
                        <div className={`${s.ButtonWrapper} ${s.AboutButtonWrapper}`}>
                            <AboutButton expanded={!collapsed} />
                        </div>
                        <div className={`${s.ButtonWrapper} ${s.AccountButtonWrapper}`}>
                            <AccountButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

LeftSidebar.defaultProps = {
};

export default LeftSidebar;
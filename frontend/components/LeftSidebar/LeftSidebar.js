import React, { useState } from 'react';
import Link from 'next/link';
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
                <nav className={s.Navigation}>
                    <ul className={s.NavList}>
                        <li className={s.NavItem}>
                            <Link href="/learning-resources" className={s.NavLink}>
                                <span className={s.NavIcon}>📚</span>
                                <div className={s.NavTextWrapper}>
                                    <span className={s.NavText}>Learning Resources</span>
                                </div>
                            </Link>
                        </li>
                        <li className={s.NavItem}>
                            <Link href="/wiki" className={s.NavLink}>
                                <span className={s.NavIcon}>🌐</span>
                                <div className={s.NavTextWrapper}>
                                    <span className={s.NavText}>Wiki</span>
                                </div>
                            </Link>
                        </li>
                        <li className={s.NavItem}>
                            <Link href="/my-posts" className={s.NavLink}>
                                <span className={s.NavIcon}>📝</span>
                                <div className={s.NavTextWrapper}>
                                    <span className={s.NavText}>My Posts</span>
                                </div>
                            </Link>
                        </li>
                    </ul>
                </nav>

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
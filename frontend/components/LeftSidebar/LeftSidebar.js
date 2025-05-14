import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import s from './LeftSidebar.module.css';
import ThemeToggleButton from '../ThemeToggleButton';
import AboutButton from '../AboutButton';
import AccountButton from '../AccountButton';
import LanguageSelector from '../LanguageSelector';
import Logo from '../Logo';
import SiteName from '../SiteName';

const LeftSidebar = () => {
    const [collapsed, setCollapsed] = useState(true);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const { language } = useLanguage();
    const collapseTimerRef = useRef(null);
    const sidebarRef = useRef(null);

    const handleMouseEnter = useCallback(() => {
        // Clear any pending collapse timer
        if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
        }
        setCollapsed(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (!isLanguageDropdownOpen) {
            // Set a timeout to delay the collapse by 500ms (half a second)
            collapseTimerRef.current = setTimeout(() => {
                setCollapsed(true);
            }, 500);
        }
    }, [isLanguageDropdownOpen]);
    
    const handleLanguageDropdownToggle = useCallback((isOpen) => {
        setIsLanguageDropdownOpen(isOpen);
    }, []);
    
    // Cleanup timer when component unmounts
    useEffect(() => {
        return () => {
            if (collapseTimerRef.current) {
                clearTimeout(collapseTimerRef.current);
            }
        };
    }, []);

    return (
        <div 
            ref={sidebarRef}
            className={`${s.LeftSidebar} ${collapsed ? s.Collapsed : s.Expanded}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
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
                            <Link href="/wiki" className={s.NavLink}>
                                <span className={s.NavIcon}>🌐</span>
                                <div className={s.NavTextWrapper}>
                                    <span className={s.NavText}>Wiki Articles</span>
                                </div>
                            </Link>
                        </li>
                        <li className={s.NavItem}>
                            <Link href="/learning-resources" className={s.NavLink}>
                                <span className={s.NavIcon}>📚</span>
                                <div className={s.NavTextWrapper}>
                                    <span className={s.NavText}>Learning Resources</span>
                                </div>
                            </Link>
                        </li>
                        <li className={s.NavItem}>
                            <Link href="/community-posts" className={s.NavLink}>
                                <span className={s.NavIcon}>👥</span>
                                <div className={s.NavTextWrapper}>
                                    <span className={s.NavText}>Community Posts</span>
                                </div>
                            </Link>
                        </li>
                        {/* SubNavItem only shows when sidebar is expanded */}
                        {!collapsed && (
                            <li className={`${s.NavItem} ${s.SubNavItem}`}>
                                <Link href="/my-posts" className={s.NavLink}>
                                    <span className={s.NavIcon}>📝</span>
                                    <div className={s.NavTextWrapper}>
                                        <span className={s.NavText}>My Posts</span>
                                    </div>
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className={s.Footer}>
                    {!collapsed && <p className={s.ThemeLabel}></p>}
                    <div className={s.ButtonsContainer}>
                        <div className={`${s.ButtonWrapper} ${s.ThemeButtonWrapper}`}>
                            <ThemeToggleButton/>
                        </div>
                        <div className={`${s.ButtonWrapper} ${s.LanguageButtonWrapper}`}>
                            <LanguageSelector onDropdownToggle={handleLanguageDropdownToggle} />
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
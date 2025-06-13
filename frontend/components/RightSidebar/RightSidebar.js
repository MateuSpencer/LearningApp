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
                <div className={s.Section}>
                    <h3 className={s.SectionTitle}>Learning Tools</h3>
                    <div className={s.ComingSoon}>
                        <p className={s.ComingSoonText}>Coming Soon...</p>
                        <ul className={s.FeatureList}>
                            <li className={s.FeatureItem}>📝 Personal Notebook</li>
                            <li className={s.FeatureItem}>📊 Progress Tracking</li>
                            <li className={s.FeatureItem}>🗃️ Study Flashcards</li>
                            <li className={s.FeatureItem}>📈 Learning Analytics</li>
                            <li className={s.FeatureItem}>🤖 AI Study Companion</li>
                            <li className={s.FeatureItem}>🗺️ Topic Mind Maps</li>
                            <li className={s.FeatureItem}>⏱️ Pomodoro Timer</li>
                            <li className={s.FeatureItem}>🎯 Goal Setting</li>
                        </ul>
                    </div>
                </div>
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
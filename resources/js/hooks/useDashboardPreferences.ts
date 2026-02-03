import { useState, useEffect, useCallback } from 'react';

export type DashboardSectionId =
    | 'stats'
    | 'orderPipeline'
    | 'revenueChart'
    | 'lowStock'
    | 'topSelling'
    | 'bestRated'
    | 'recentActivity'
    | 'recentReviews';

export interface DashboardSection {
    id: DashboardSectionId;
    label: string;
    visible: boolean;
    order: number;
}

export interface DashboardPreferences {
    sections: DashboardSection[];
}

const DEFAULT_SECTIONS: DashboardSection[] = [
    { id: 'stats', label: 'Statistics', visible: true, order: 0 },
    { id: 'orderPipeline', label: 'Order Pipeline', visible: true, order: 1 },
    { id: 'revenueChart', label: 'Revenue & Orders Chart', visible: true, order: 2 },
    { id: 'lowStock', label: 'Low Stock Products', visible: true, order: 3 },
    { id: 'topSelling', label: 'Top Selling Products', visible: true, order: 4 },
    { id: 'bestRated', label: 'Best Rated Products', visible: true, order: 5 },
    { id: 'recentActivity', label: 'Recent Activity', visible: true, order: 6 },
    { id: 'recentReviews', label: 'Recent Reviews', visible: true, order: 7 },
];

const STORAGE_KEY = 'dashboard_preferences';

function loadPreferences(): DashboardPreferences {
    if (typeof window === 'undefined') {
        return { sections: DEFAULT_SECTIONS };
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as DashboardPreferences;
            // Merge with defaults to handle new sections added in updates
            const sectionMap = new Map(parsed.sections.map(s => [s.id, s]));
            const mergedSections = DEFAULT_SECTIONS.map((defaultSection, idx) => {
                const stored = sectionMap.get(defaultSection.id);
                return stored ?? { ...defaultSection, order: idx };
            });
            return { sections: mergedSections.sort((a, b) => a.order - b.order) };
        }
    } catch (e) {
        console.error('Failed to load dashboard preferences:', e);
    }

    return { sections: DEFAULT_SECTIONS };
}

function savePreferences(prefs: DashboardPreferences): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
        console.error('Failed to save dashboard preferences:', e);
    }
}

export function useDashboardPreferences() {
    const [preferences, setPreferences] = useState<DashboardPreferences>(() => loadPreferences());

    // Load from localStorage on mount
    useEffect(() => {
        setPreferences(loadPreferences());
    }, []);

    // Save to localStorage when preferences change
    useEffect(() => {
        savePreferences(preferences);
    }, [preferences]);

    const toggleSectionVisibility = useCallback((sectionId: DashboardSectionId) => {
        setPreferences(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId ? { ...s, visible: !s.visible } : s
            ),
        }));
    }, []);

    const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
        setPreferences(prev => {
            const sections = [...prev.sections];
            const [removed] = sections.splice(fromIndex, 1);
            sections.splice(toIndex, 0, removed);
            // Update order values
            return {
                ...prev,
                sections: sections.map((s, i) => ({ ...s, order: i })),
            };
        });
    }, []);

    const moveSectionUp = useCallback((sectionId: DashboardSectionId) => {
        setPreferences(prev => {
            const index = prev.sections.findIndex(s => s.id === sectionId);
            if (index <= 0) return prev;
            const sections = [...prev.sections];
            [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
            return {
                ...prev,
                sections: sections.map((s, i) => ({ ...s, order: i })),
            };
        });
    }, []);

    const moveSectionDown = useCallback((sectionId: DashboardSectionId) => {
        setPreferences(prev => {
            const index = prev.sections.findIndex(s => s.id === sectionId);
            if (index < 0 || index >= prev.sections.length - 1) return prev;
            const sections = [...prev.sections];
            [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
            return {
                ...prev,
                sections: sections.map((s, i) => ({ ...s, order: i })),
            };
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        setPreferences({ sections: DEFAULT_SECTIONS });
    }, []);

    const getSortedSections = useCallback(() => {
        return [...preferences.sections].sort((a, b) => a.order - b.order);
    }, [preferences.sections]);

    const isSectionVisible = useCallback((sectionId: DashboardSectionId) => {
        const section = preferences.sections.find(s => s.id === sectionId);
        return section?.visible ?? true;
    }, [preferences.sections]);

    return {
        preferences,
        sections: getSortedSections(),
        toggleSectionVisibility,
        reorderSections,
        moveSectionUp,
        moveSectionDown,
        resetToDefaults,
        isSectionVisible,
    };
}

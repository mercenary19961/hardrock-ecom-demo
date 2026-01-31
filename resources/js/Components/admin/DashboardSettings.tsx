import { Fragment, useState } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import {
    X,
    Settings,
    ChevronUp,
    ChevronDown,
    RotateCcw,
    GripVertical,
} from 'lucide-react';
import { DashboardSection, DashboardSectionId } from '@/hooks/useDashboardPreferences';

interface DashboardSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    sections: DashboardSection[];
    onToggleVisibility: (sectionId: DashboardSectionId) => void;
    onMoveUp: (sectionId: DashboardSectionId) => void;
    onMoveDown: (sectionId: DashboardSectionId) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onReset: () => void;
}

const SECTION_ICONS: Record<DashboardSectionId, string> = {
    stats: '📊',
    orderPipeline: '📈',
    revenueChart: '💰',
    lowStock: '⚠️',
    topSelling: '🏆',
    bestRated: '⭐',
    recentActivity: '📝',
    recentReviews: '⭐',
};

export function DashboardSettings({
    isOpen,
    onClose,
    sections,
    onToggleVisibility,
    onMoveUp,
    onMoveDown,
    onReorder,
    onReset,
}: DashboardSettingsProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== toIndex) {
            onReorder(draggedIndex, toIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="w-screen max-w-sm">
                                    <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-xl">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-4 py-4 border-b dark:border-gray-700">
                                            <Dialog.Title className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                                <Settings className="h-5 w-5 text-gray-500" />
                                                Customize Dashboard
                                            </Dialog.Title>
                                            <button
                                                onClick={onClose}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <X className="h-5 w-5 dark:text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 overflow-y-auto px-4 py-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Toggle sections on/off and reorder them using the arrows.
                                            </p>

                                            <div className="space-y-2">
                                                {sections.map((section, index) => (
                                                    <div
                                                        key={section.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, index)}
                                                        onDragOver={(e) => handleDragOver(e, index)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, index)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors select-none ${
                                                            section.visible
                                                                ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60'
                                                        } ${
                                                            draggedIndex === index ? 'opacity-50' : ''
                                                        } ${
                                                            dragOverIndex === index ? 'border-purple-500 border-2' : ''
                                                        }`}
                                                    >
                                                        {/* Drag handle */}
                                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />

                                                        {/* Icon */}
                                                        <span className="text-lg select-none pointer-events-none">{SECTION_ICONS[section.id]}</span>

                                                        {/* Label */}
                                                        <span className={`flex-1 text-sm font-medium select-none pointer-events-none ${
                                                            section.visible
                                                                ? 'text-gray-900 dark:text-white'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            {section.label}
                                                        </span>

                                                        {/* Reorder buttons */}
                                                        <div className="flex flex-col -space-y-1">
                                                            <button
                                                                onClick={() => onMoveUp(section.id)}
                                                                disabled={index === 0}
                                                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="Move up"
                                                            >
                                                                <ChevronUp className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onMoveDown(section.id)}
                                                                disabled={index === sections.length - 1}
                                                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="Move down"
                                                            >
                                                                <ChevronDown className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        {/* Toggle */}
                                                        <Switch
                                                            checked={section.visible}
                                                            onChange={() => onToggleVisibility(section.id)}
                                                            className={`${
                                                                section.visible ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                                            } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                                                        >
                                                            <span
                                                                className={`${
                                                                    section.visible ? 'translate-x-5' : 'translate-x-1'
                                                                } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                                                            />
                                                        </Switch>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="border-t dark:border-gray-700 px-4 py-4">
                                            <button
                                                onClick={onReset}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Reset to Defaults
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

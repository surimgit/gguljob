import { type FC } from 'react';
import {
  Monitor, Server, Shield, BarChart3, Brain, HardDrive,
  Smartphone, Wrench, Briefcase, Pen, type LucideIcon,
} from 'lucide-react';
import { ROLE_LIST, ROLE_DISPLAY_NAMES, type RoleCode } from '../../../../constants/skills';

const ROLE_ICONS: Record<RoleCode, LucideIcon> = {
  FRONTEND: Monitor,
  BACKEND:  Server,
  DEVOPS:   Shield,
  DATA:     BarChart3,
  AI:       Brain,
  DATABASE: HardDrive,
  MOBILE:   Smartphone,
  TOOLS:    Wrench,
  PM:       Briefcase,
  DESIGN:   Pen,
};

interface Props {
  selected: string;
  onChange: (role: string) => void;
}

const Step2Role: FC<Props> = ({ selected, onChange }) => {
  return (
    <div>
      <div className="sticky top-0 bg-surface z-10 pb-3 pt-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">어떤 직무를 희망하시나요?</h2>
        <p className="text-sm text-gray-500">하나를 선택해주세요</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ROLE_LIST.map((code) => {
          const Icon = ROLE_ICONS[code];
          const label = ROLE_DISPLAY_NAMES[code];
          const isSelected = selected === code;
          return (
            <button
              key={code}
              onClick={() => onChange(code)}
              className={`flex flex-col items-center justify-center py-6 px-3 rounded-2xl transition-all duration-150 cursor-pointer gap-2.5 border-2
                ${isSelected ? 'border-primary bg-amber-50' : 'border-border bg-white'}`}
            >
              <Icon
                size={28}
                className={isSelected ? 'text-primary' : 'text-gray-500'}
                strokeWidth={1.5}
              />
              <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step2Role;

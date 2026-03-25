import { type FC, useEffect, useState } from 'react';
import {
  Monitor, Server, Shield, BarChart3, Brain, HardDrive,
  Smartphone, Briefcase, Pen, Box, type LucideIcon,
} from 'lucide-react';
import { getPositions, type PositionDto } from '../../../../api/user';

const ROLE_ICONS: Record<string, LucideIcon> = {
  FE:     Monitor,
  BE:     Server,
  INFRA:  Shield,
  DEVOPS: Shield,
  DATA:   BarChart3,
  AI:     Brain,
  DB:     HardDrive,
  MOBILE: Smartphone,
  PM:     Briefcase,
  DESIGN: Pen,
};

interface Props {
  selected: string;
  onChange: (role: string) => void;
}

const Step2Role: FC<Props> = ({ selected, onChange }) => {
  const [positions, setPositions] = useState<PositionDto[]>([]);

  useEffect(() => {
    getPositions()
      .then(setPositions)
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="sticky top-0 bg-surface z-10 pb-3 pt-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">어떤 직무를 희망하시나요?</h2>
        <p className="text-sm text-gray-500">하나를 선택해주세요</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {positions.map(({ code, name }) => {
          const Icon = ROLE_ICONS[code] ?? Box;
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
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step2Role;

import { type FC, useEffect, useState } from 'react';
import {
  Monitor, Server, Shield, BarChart3, Brain,
  Database, Smartphone, Briefcase, Pen, Box, HelpCircle, type LucideIcon,
} from 'lucide-react';
import { getPositions, type PositionDto } from '../../../../api/user';
import { ROLE_LIST, type RoleCode } from '../../../../constants/skills';

const ROLE_ORDER = Object.fromEntries(ROLE_LIST.map((code, i) => [code, i]));

const ROLE_ICONS: Record<RoleCode, LucideIcon> = {
  FRONTEND: Monitor,
  BACKEND:  Server,
  DEVOPS:   Shield,
  DATA:     BarChart3,
  AI:       Brain,
  DATABASE: Database,
  MOBILE:   Smartphone,
  PM:       Briefcase,
  DESIGN:   Pen,
};

interface Props {
  selected: string;
  onChange: (role: string) => void;
}

const Step2Role: FC<Props> = ({ selected, onChange }) => {
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPositions()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => (ROLE_ORDER[a.code] ?? 999) - (ROLE_ORDER[b.code] ?? 999)
        );
        setPositions(sorted);
      })
      .catch((e) => console.error('Failed to fetch positions:', e))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="sticky top-0 bg-surface z-10 pb-3 pt-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">어떤 직무를 희망하시나요?</h2>
        <p className="text-sm text-gray-500">하나를 선택해주세요</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center py-6 px-3 rounded-2xl border-2 border-border bg-white animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gray-200 mb-2.5" />
            <div className="w-16 h-4 rounded bg-gray-200" />
          </div>
        )) : (
          <>
            {positions.map(({ code, name }) => {
              const Icon = ROLE_ICONS[code as RoleCode] ?? Box;
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
            <button
              onClick={() => onChange('NONE')}
              className={`col-span-2 flex items-center justify-center py-4 px-3 rounded-2xl transition-all duration-150 cursor-pointer gap-2.5 border-2
                ${selected === 'NONE' ? 'border-primary bg-amber-50' : 'border-border bg-white'}`}
            >
              <HelpCircle
                size={22}
                className={selected === 'NONE' ? 'text-primary' : 'text-gray-400'}
                strokeWidth={1.5}
              />
              <span className={`text-sm ${selected === 'NONE' ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                상관 없음
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Step2Role;

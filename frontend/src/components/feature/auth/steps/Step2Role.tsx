import { type FC } from 'react';
import { Monitor, Server, Smartphone, Pen, Briefcase, Database } from 'lucide-react';

const ROLES = [
  { id: 'frontend', Icon: Monitor, label: '프론트엔드' },
  { id: 'backend', Icon: Server, label: '백엔드' },
  { id: 'mobile', Icon: Smartphone, label: '모바일 앱' },
  { id: 'designer', Icon: Pen, label: '디자이너' },
  { id: 'pm', Icon: Briefcase, label: '기획자 / PM' },
  { id: 'data', Icon: Database, label: '데이터 / AI' },
];

interface Props {
  selected: string;
  onChange: (role: string) => void;
}

const Step2Role: FC<Props> = ({ selected, onChange }) => {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        어떤 직무를 희망하시나요?
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>하나를 선택해주세요</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {ROLES.map(({ id, Icon, label }) => {
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 12px',
                borderRadius: 16,
                border: isSelected ? '2px solid #F59E0B' : '1px solid #E8DFB8',
                background: isSelected ? '#FFFBEA' : '#FFFFFF',
                cursor: 'pointer',
                gap: 10,
                transition: 'all 0.15s',
              }}
            >
              <Icon
                size={28}
                color={isSelected ? '#F59E0B' : '#6B7280'}
                strokeWidth={1.5}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                  color: '#111827',
                }}
              >
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

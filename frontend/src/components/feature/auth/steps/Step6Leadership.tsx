import { type FC } from 'react';
import { getLeaderType } from '../utils/leaderUtils';

interface Props {
  value: number;
  onChange: (score: number) => void;
}

const Step6Leadership: FC<Props> = ({ value, onChange }) => {
  const leaderType = getLeaderType(value);

  return (
    <div>
      <div className="sticky top-0 bg-surface z-10 pb-3 pt-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">팀에서의 성향은?</h2>
        <p className="text-sm text-gray-500">슬라이더를 움직여 표현해주세요</p>
      </div>

      {/* 타입 카드 */}
      <div className="w-36 h-36 mx-auto mb-8 flex flex-col items-center justify-center bg-[#FFF3C4] border-2 border-primary rounded-2xl gap-2.5">
        <span className="text-[40px]">{leaderType.emoji}</span>
        <span className="text-lg font-bold text-gray-900">{leaderType.label}</span>
      </div>

      {/* 슬라이더 영역 */}
      <div>
        <div className="flex justify-between mb-2.5">
          <span className="text-sm text-gray-500">🤝 팔로워</span>
          <span className="text-sm text-gray-500">리더 👑</span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
          style={{
            background: `linear-gradient(to right, #F59E0B ${value}%, #E5E7EB ${value}%)`,
          }}
        />

        <div className="flex justify-center mt-2.5">
          <span className="text-[13px] text-amber-800 bg-[#FFF9E6] px-3 py-1 rounded-full border border-[#F3E09A]">
            {value}%
          </span>
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #F59E0B;
          border: 3px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          cursor: pointer;
        }
        input[type='range']::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #F59E0B;
          border: 3px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Step6Leadership;

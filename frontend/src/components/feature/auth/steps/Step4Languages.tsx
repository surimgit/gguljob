import { type FC } from 'react';
import { TechStackInput } from '../../../common';

interface Props {
  selected: string[];
  onChange: (languages: string[]) => void;
}

const Step4Languages: FC<Props> = ({ selected, onChange }) => (
  <div>
    <div className="sticky top-0 bg-surface z-10 pb-3 pt-1">
      <h2 className="text-2xl font-bold text-gray-900 mb-1.5">주로 사용하는 기술스택은?</h2>
      <p className="text-sm text-gray-500">여러 개 선택할 수 있어요</p>
    </div>
    <TechStackInput value={selected} onChange={onChange} />
  </div>
);

export default Step4Languages;

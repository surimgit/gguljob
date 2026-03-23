interface TechStackProps {
  skills: string[];
}

const TechStack = ({ skills }: TechStackProps) => {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-text-secondary text-[15px] font-medium">등록된 기술스택이 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[17px] font-black text-text-primary mb-4">사용 기술</h3>
      <div className="flex flex-wrap gap-3">
        {skills.map((skill) => (
          <span
            key={skill}
            className="px-4 py-2 rounded-xl text-[13px] font-bold border border-border text-text-primary bg-surface shadow-sm"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TechStack;

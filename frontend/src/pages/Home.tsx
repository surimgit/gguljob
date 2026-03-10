import { useState } from 'react';
import ProfileSetupModal from '../components/feature/auth/ProfileSetupModal';

const Home = () => {
  // TODO: 테스트용 임시 코드 - 테스트 완료 후 제거
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <h1>메인 페이지입니다.</h1>
      <button onClick={() => setShowModal(true)}>프로필 모달 테스트</button>
      <ProfileSetupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={(data) => console.log('완료:', data)}
      />
    </>
  );
};
export default Home;
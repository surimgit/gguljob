import { useEffect } from 'react';
import { useNavbarStore } from '../stores/navbarStore';

/** 페이지 마운트 시 Navbar 배경색을 설정하고, 언마운트 시 기본값으로 복원 */
const useNavbarBg = (bgClassName: string) => {
  const setBgClassName = useNavbarStore((s) => s.setBgClassName);

  useEffect(() => {
    setBgClassName(bgClassName);
    return () => setBgClassName('bg-background');
  }, [bgClassName, setBgClassName]);
};

export default useNavbarBg;

import Container from '../common/Container';

const Footer = () => {
  return (
    <footer className="bg-cta text-gray-400 py-8 mt-auto">
      <Container className="text-sm text-center">
        © {new Date().getFullYear()} 꿀잡(GGUL JOB). All rights reserved.
      </Container>
    </footer>
  );
};

export default Footer;

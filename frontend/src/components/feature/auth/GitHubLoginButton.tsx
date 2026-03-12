// VITE_API_BASE_URL은 백엔드 OAuth 서버 주소입니다 (예: https://api.example.com)
// 올바르게 설정되지 않으면 GitHub 로그인이 동작하지 않습니다
const GITHUB_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/auth/github`;

if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
  console.warn('[GitHubLoginButton] VITE_API_BASE_URL이 설정되지 않았습니다. GitHub 로그인이 작동하지 않을 수 있습니다.');
}

const GitHubLoginButton = () => {
  const handleLogin = () => {
    window.location.href = GITHUB_AUTH_URL;
  };

  return (
    <button
      onClick={handleLogin}
      aria-label="GitHub으로 로그인"
      className="flex items-center gap-2 bg-text-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
    >
      <svg className="w-16 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    </button>
  );
};

export default GitHubLoginButton;

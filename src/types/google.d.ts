// Tipagem para a Google Identity Services API (google.accounts.id)
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
  clientId?: string;
}

interface GoogleButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface Google {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: GoogleButtonConfiguration
      ) => void;
      prompt: (notification?: (notification: any) => void) => void;
      revoke: (hint: string, callback: (done: { successful: boolean }) => void) => void;
      disableAutoSelect: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: Google;
  }
}

export {};

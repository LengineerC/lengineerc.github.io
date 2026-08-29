import type React from 'react';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }

}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'meting-js': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        auto?: string;
        fixed?: boolean;
        theme?: string;
        volume?: number;
        IrcType?: boolean;
      };
    }
  }
}

declare module '*.scss' {
  const style: { [className: string]: string };
  export default style;
}

// declare module "aplayer"{
//     const APlayer:any;
//     export default APlayer;
// }

declare namespace JSX {
  interface IntrinsicElements {
    'meting-js': any;
  }
}

declare module 'marked-katex-extension' {
  import func from 'marked-katex-extension';
  export default func;
}

declare module 'jinrishici' {
  export const load: (
    success: (result: any) => void,
    failure?: (error: any) => void,
  ) => void;
}

declare module 'echarts-wordcloud/dist/echarts-wordcloud.js';

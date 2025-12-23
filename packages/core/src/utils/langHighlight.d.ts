declare const highlightjs: {
  getLanguage: (lang: string) => object | undefined;
  highlight: (
    lang: string,
    str: string,
    ignoreIllegals?: boolean,
  ) => { value: string };
};
export default highlightjs;

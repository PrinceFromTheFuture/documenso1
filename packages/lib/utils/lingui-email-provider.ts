// This file explicitly imports from the client version of @lingui/react
// to use in server-side email rendering (which uses renderToString, not RSC)
// We need to bypass the react-server condition in the exports field

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Direct import to bypass react-server condition
export { I18nProvider } from '@lingui/react/dist/index.mjs';

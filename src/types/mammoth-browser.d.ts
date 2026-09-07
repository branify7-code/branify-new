// Ambient types for the prebuilt browser bundle of mammoth (DOCX → HTML).
// The npm package ships no TypeScript definitions; only the small surface used
// by the blog document importer is declared here.
declare module 'mammoth/mammoth.browser.js' {
  export interface MammothImageInput {
    readAsArrayBuffer(): Promise<ArrayBuffer>;
    readAsBase64String(): Promise<string>;
    contentType: string;
    altText?: string | null;
  }

  export interface MammothImageElement {
    src: string;
    alt?: string;
  }

  export interface MammothMessage {
    type: string;
    message: string;
  }

  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  export interface MammothConvertInput {
    arrayBuffer: ArrayBuffer;
  }

  export interface MammothOptions {
    styleMap?: string | string[];
    convertImage?: unknown;
    transforms?: unknown[];
    ignoreEmptyParagraphs?: boolean;
    [key: string]: unknown;
  }

  export const images: {
    imgElement(
      convert: (image: MammothImageInput) => Promise<MammothImageElement> | MammothImageElement,
    ): unknown;
    dataUri(
      convert: (image: MammothImageInput) => Promise<{ src: string }> | { src: string },
    ): unknown;
  };

  export const transforms: {
    underline?: unknown;
    paragraph?: unknown;
    run?: unknown;
  };

  export function convertToHtml(
    input: MammothConvertInput,
    options?: MammothOptions,
  ): Promise<MammothResult>;

  export function extractRawText(input: MammothConvertInput): Promise<{ value: string }>;

  export function embedStyleMap(input: MammothConvertInput, styleMap: string): Promise<MammothResult>;

  const mammoth: {
    convertToHtml: typeof convertToHtml;
    extractRawText: typeof extractRawText;
    images: typeof images;
    transforms: typeof transforms;
    embedStyleMap: typeof embedStyleMap;
  };

  export default mammoth;
}

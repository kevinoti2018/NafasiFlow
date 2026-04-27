// types/docxtemplater.d.ts
declare module "docxtemplater" {
  interface DocxtemplaterOptions {
    paragraphLoop?: boolean;
    linebreaks?: boolean;
  }

  class Docxtemplater {
    constructor(zip: any, options?: DocxtemplaterOptions);
    render(data: Record<string, any>): void;
    getZip(): any;
  }

  export = Docxtemplater;
}
